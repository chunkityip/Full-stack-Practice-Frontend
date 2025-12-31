// employee-list.component.ts (SIMPLIFIED - UI WILL WORK)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

import { EmployeeService } from 'src/app/service/employee.service';
import { Employee, EmployeeStatus } from 'src/app/type/Employee';
import { CreateEmployeeDialogComponent } from '../create-employee-dialog/create-employee-dialog.component';


// Constants
const DIALOG_CONFIG = {
  WIDTH: '500px',
  DISABLE_CLOSE: true
};

const MESSAGES = {
  SAVE_SUCCESS: 'Employees saved successfully!',
  SAVE_ERROR: 'Failed to save employees. Please try again.',
};

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  // Public properties
  tableColumn: ColDef[] = this.initColumns();
  defaultColDef: ColDef = { resizable: true };
  tableData: Employee[] = [];
  unsavedEmployees: Employee[] = [];
  selectedEmployees: Employee[] = [];

  // Private properties
  private gridApi!: GridApi;
  private tempIdCounter = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAllEmployees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Grid Events
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit(); //auto fix the size of header , no longer need to put width on every header in initColumns
  }

  onSelectionChanged(): void {
    if (this.gridApi) {
      this.selectedEmployees = this.gridApi.getSelectedRows();
    }
  }

  // Data Operations
  loadAllEmployees(): void {
    // Show overlay if gridApi exists
    if (this.gridApi) this.gridApi.showLoadingOverlay();

    this.employeeService.getAllEmployee()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (this.gridApi) this.gridApi.hideOverlay();
        })
      )
      .subscribe({
        next: (employees) => {
          this.tableData = [...employees, ...this.unsavedEmployees]; // <-- just update variable
        },
        error: () => {
          if (this.gridApi) this.gridApi.showNoRowsOverlay();
          this.showErrorMessage('Failed to load employees');
        }
      });
  }

  createEmployee(): void {
    const dialogRef = this.dialog.open(CreateEmployeeDialogComponent, {
      width: DIALOG_CONFIG.WIDTH,
      disableClose: DIALOG_CONFIG.DISABLE_CLOSE
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.addUnsavedEmployee(result);
        }
      });
  }

  saveEmployees(): void {
    const employeesToSave = this.getEmployeesToSave();

    if (employeesToSave.length === 0) {
      return;
    }

    this.gridApi.showLoadingOverlay();

    const saveObservables = employeesToSave.map(employee => {
      const payload = this.prepareEmployeePayload(employee);
      return this.employeeService.createEmployee(payload);
    });

    forkJoin(saveObservables)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.gridApi.hideOverlay();  // Hide loading (always)
        })
      )
      .subscribe({
        next: () => {
          this.handleSaveSuccess(employeesToSave);
        },
        error: (error) => {
          console.error('Error saving employees:', error);
          this.showErrorMessage(MESSAGES.SAVE_ERROR);
        }
      });
  }

  // Getters
  get saveButtonText(): string {
    const selectedUnsaved = this.selectedEmployees.filter(emp => emp.isUnsaved);

    if (selectedUnsaved.length > 0) {
      return `💾 Save Selected (${selectedUnsaved.length})`;
    }

    if (this.unsavedEmployees.length > 0) {
      return `💾 Save All (${this.unsavedEmployees.length})`;
    }

    return '💾 Save (0)';
  }

  get hasUnsavedEmployees(): boolean {
    return this.unsavedEmployees.length > 0;
  }

  // Private Helper Methods
  private initColumns(): ColDef[] {
    return [
      {
        headerName: "",
        field: "checkbox",
        width: 50,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        suppressMenu: true,
        pinned: 'left'
      },
      {
        headerName: "Id",
        field: "id",
        width: 80,
        sortable: true,
        filter: true,
        valueFormatter: (params) => params.data?.isUnsaved ? '-' : params.value
      },
      {
        headerName: "Full Name",
        field: "fullName",
        flex: 1,
        sortable: true,
        filter: true
      },
      {
        headerName: "Department",
        field: "department",
        flex: 1,
        sortable: true,
        filter: true
      },
      {
        headerName: "Status",
        field: "status",
        width: 150,
        cellRenderer: this.statusCellRenderer.bind(this),
        sortable: true,
        filter: true
      },
      {
        headerName: "Actions",
        field: "actions",
        width: 220,
        cellRenderer: this.actionsCellRenderer.bind(this),
        suppressMenu: true
      }
    ];
  }

  private addUnsavedEmployee(employeeData: any): void {
    this.tempIdCounter--;

    const unsavedEmployee: Employee = {
      ...employeeData,
      id: this.tempIdCounter,
      status: EmployeeStatus.UNSAVED,
      isUnsaved: true
    };

    this.unsavedEmployees.push(unsavedEmployee);
    this.tableData = [...this.tableData, unsavedEmployee];
    // this.refreshGrid();
  }

  private getEmployeesToSave(): Employee[] {
    const selectedUnsaved = this.selectedEmployees.filter(emp => emp.isUnsaved);
    return selectedUnsaved.length > 0 ? selectedUnsaved : this.unsavedEmployees;
  }

  private prepareEmployeePayload(employee: Employee): any {
    const { id, status, isUnsaved, ...payload } = employee;
    return payload;
  }

  private handleSaveSuccess(savedEmployees: Employee[]): void {
    this.unsavedEmployees = this.unsavedEmployees.filter(
      unsaved => !savedEmployees.some(saved => saved.id === unsaved.id)
    );

    this.showSuccessMessage(MESSAGES.SAVE_SUCCESS);
    this.loadAllEmployees();

    if (this.gridApi) {
      this.gridApi.deselectAll();
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  // Cell Renderers
  private statusCellRenderer(params: any): string {
    const employee: Employee = params.data;
    const status = employee.status || EmployeeStatus.DRAFT;

    const statusConfig = {
      [EmployeeStatus.UNSAVED]: { cssClass: 'unsaved', text: 'UNSAVED' },
      [EmployeeStatus.DRAFT]: { cssClass: 'draft', text: 'DRAFT' },
      [EmployeeStatus.PENDING_APPROVAL]: { cssClass: 'pending', text: 'PENDING' },
      [EmployeeStatus.APPROVED]: { cssClass: 'approved', text: 'APPROVED' },
      [EmployeeStatus.REJECTED]: { cssClass: 'rejected', text: 'REJECTED' }
    };

    const config = statusConfig[status] || statusConfig[EmployeeStatus.DRAFT];
    return `<span class="status-badge ${config.cssClass}">${config.text}</span>`;
  }

  private actionsCellRenderer(params: any): string {
    const employee: Employee = params.data;

    if (employee.isUnsaved) {
      return '<span style="color: #6c757d; font-size: 12px; font-style: italic;">Waiting to save...</span>';
    }

    if (employee.status === EmployeeStatus.DRAFT) {
      return `<div class="action-buttons"><button class="btn-submit" data-action="submit" data-id="${employee.id}">Submit</button></div>`;
    }

    if (employee.status === EmployeeStatus.PENDING_APPROVAL) {
      return `
        <div class="action-buttons">
          <button class="btn-approve" data-action="approve" data-id="${employee.id}">Approve</button>
          <button class="btn-reject" data-action="reject" data-id="${employee.id}">Reject</button>
        </div>
      `;
    }

    return '';
  }
}
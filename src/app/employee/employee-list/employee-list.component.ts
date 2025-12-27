import { Component, OnInit } from '@angular/core';
import { EmployeeService } from 'src/app/service/employee.service';
import { Employee, EmployeeStatus } from 'src/app/type/Employee';
import { CreateEmployeeDialogComponent } from '../create-employee-dialog/create-employee-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit {
  tableColumn: ColDef[] = [
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
      valueFormatter: (params) => {
        if (params.data?.isUnsaved) {
          return '-';
        }
        return params.value;
      }
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

  defaultColDef: ColDef = {
    resizable: true,
  };

  tableData: Employee[] = [];
  unsavedEmployees: Employee[] = [];
  selectedEmployees: Employee[] = [];
  private gridApi!: GridApi;
  private tempIdCounter = 0; 

  constructor(
    private employeeService: EmployeeService, 
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.loadAllEmployees();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onSelectionChanged(): void {
    if (this.gridApi) {
      this.selectedEmployees = this.gridApi.getSelectedRows();
      console.log('Selected employees:', this.selectedEmployees);
    }
  }

  loadAllEmployees(): void {
    this.employeeService.getAllEmployee().subscribe(
      employees => {
        // Combine backend employees with unsaved frontend employees
        this.tableData = [...employees, ...this.unsavedEmployees];
        this.refreshGrid();
      }
    );
  }

  createEmployee(): void {
    const dialogRef = this.dialog.open(CreateEmployeeDialogComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Use negative numbers for temporary IDs to avoid conflicts
        this.tempIdCounter--;
        
        const unsavedEmployee: Employee = {
          ...result,
          id: this.tempIdCounter, // Temporary negative ID
          status: EmployeeStatus.UNSAVED,
          isUnsaved: true
        };
        
        this.unsavedEmployees.push(unsavedEmployee);
        this.tableData = [...this.tableData, unsavedEmployee];
        this.refreshGrid();
      }
    });
  }

  // Save selected employees (or all unsaved if none selected)
  saveEmployees(): void {
    // Get selected unsaved employees
    const selectedUnsaved = this.selectedEmployees.filter(emp => emp.isUnsaved);
    
    // If no unsaved employees are selected, save all unsaved
    const employeesToSave = selectedUnsaved.length > 0 
      ? selectedUnsaved 
      : this.unsavedEmployees;

    if (employeesToSave.length === 0) {
      console.log('No unsaved employees to save');
      return;
    }

    console.log(`Saving ${employeesToSave.length} employee(s)...`);

    const savePromises = employeesToSave.map(employee => {
      // Remove frontend-only fields before sending to backend
      const { id, status, isUnsaved, ...payload } = employee;
      return this.employeeService.createEmployee(payload).toPromise();
    });

    Promise.all(savePromises).then(() => {
      console.log('Employees saved successfully');
      
      // Remove saved employees from unsaved list
      this.unsavedEmployees = this.unsavedEmployees.filter(
        unsaved => !employeesToSave.some(saved => saved.id === unsaved.id)
      );
      
      // Reload all employees from backend and merge with remaining unsaved
      this.loadAllEmployees();
      
      // Clear selection
      if (this.gridApi) {
        this.gridApi.deselectAll();
      }
    }).catch(error => {
      console.error('Error saving employees:', error);
    });
  }

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

  statusCellRenderer(params: any): string {
    const employee: Employee = params.data;
    const status = employee.status || EmployeeStatus.DRAFT;
    
    let cssClass = '';
    let displayText = status;

    switch (status) {
      case EmployeeStatus.UNSAVED:
        cssClass = 'unsaved';
        displayText = EmployeeStatus.UNSAVED;
        break;
      case EmployeeStatus.DRAFT:
        cssClass = 'draft';
        displayText = EmployeeStatus.DRAFT
        break;
      case EmployeeStatus.PENDING_APPROVAL:
        cssClass = 'pending';
        displayText = EmployeeStatus.PENDING_APPROVAL;
        break;
      case EmployeeStatus.APPROVED:
        cssClass = 'approved';
        displayText = EmployeeStatus.APPROVED;
        break;
      case EmployeeStatus.REJECTED:
        cssClass = 'rejected';
        displayText = EmployeeStatus.REJECTED;
        break;
    }

    return `<span class="status-badge ${cssClass}">${displayText}</span>`;
  }

  actionsCellRenderer(params: any): string {
    const employee: Employee = params.data;
    
    if (employee.isUnsaved) {
      return '<span style="color: #6c757d; font-size: 12px; font-style: italic;">Waiting to save...</span>';
    }

    if (employee.status === EmployeeStatus.DRAFT) {
      return `<div class="action-buttons"><button class="btn-submit" data-action="submit" data-id="${employee.id}">Submit</button></div>`;
    } else if (employee.status === EmployeeStatus.PENDING_APPROVAL) {
      return `
        <div class="action-buttons">
          <button class="btn-approve" data-action="approve" data-id="${employee.id}">Approve</button>
          <button class="btn-reject" data-action="reject" data-id="${employee.id}">Reject</button>
        </div>
      `;
    }

    return '';
  }


  private refreshGrid(): void {
    if (this.gridApi) {
      this.gridApi.setRowData(this.tableData);
    }
  }
}

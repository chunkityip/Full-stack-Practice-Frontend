import { Component, OnInit } from '@angular/core';
import { EmployeeService } from 'src/app/service/employee.service';
import { Employee } from 'src/app/type/Employee';
import { CreateEmployeeDialogComponent } from '../create-employee-dialog/create-employee-dialog.component';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit {
  tableColumn = [
    { headerName: "Id" , field: "id" },
    { headerName: "Full Name", field: "fullName" },
    { headerName: "Department", field: "department"}
  ]

  tableData: Employee[] = [];
  constructor(private employeeService: EmployeeService, private dialog: MatDialog) {}
  
  ngOnInit(): void {
      this.loadAllEmployees();
  }

  loadAllEmployees(): void {
   this.employeeService.getAllEmployee().subscribe(
      employees => {
        this.tableData = employees;
      }
    )
  }

createEmploye() {
    console.log('Opening dialog...'); // Add this
    const dialogRef = this.dialog.open(CreateEmployeeDialogComponent, {
      width: '500px',
      disableClose: false
    });
    console.log('Dialog ref:', dialogRef); // Add this

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result); // Add this
      if (result) {
        this.employeeService.createEmployee(result).subscribe(
          (newEmployee) => {
            this.loadAllEmployees();
          },
          (error) => {
            console.error('Error creating employee:', error);
          }
        );
      }
    });
  }
}
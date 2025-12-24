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

//Create loadAllEmployees() using getAllEmployee() from service
  loadAllEmployees() : void {
    this.employeeService.getAllEmployee()
      .subscribe(
        employees => {
          this.tableData = employees;
        }
      )
  }

/*
Create createEmploye() using createEmployee() for 
1. with dialog popup as width 500px connect with CreateEmployeeDialogComponent
2. subscribe the result:
a. if result , using createEmployee() to subscribe new Employee as loadAllEmployees()
b. if error , display console.error('Error creating employee:', error);
*/
createEmployee() {
  const dialogRef = this.dialog.open(CreateEmployeeDialogComponent, {
    width: '500px',
    disableClose: true
  });
  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.employeeService.createEmployee(result).subscribe(
        (newEmployee) => {
          this.loadAllEmployees();
        },
        (error) => {
          console.error('Error create employee:', error)
        }
      )
    }
  })
}




















createEmploye() {
    const dialogRef = this.dialog.open(CreateEmployeeDialogComponent, {
      width: '500px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
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
import { Component, OnInit } from '@angular/core';
import { EmployeeService } from 'src/app/service/employee.service';
import { Employee } from 'src/app/type/Employee';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit {

  tableColumns = [
    { headerName: 'ID', field: 'id' },
    { headerName: 'Full Name', field: 'fullName' },
    { headerName: 'Department', field: 'department'}
  ];

  tableData: Employee[] = [];

  constructor(private employeeService: EmployeeService) {}
  
  ngOnInit(): void {
      this.loadAllEmployees();
  }

  loadAllEmployees(): void {
    this.employeeService.getAllEmployee().subscribe(employees => {
      this.tableData = employees;
    })
  }
 
}
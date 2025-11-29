// src/app/services/employee.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../type/Employee';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
    private baseUrl = 'http://localhost:8080/api/employees';

    constructor(private http: HttpClient){}

    createEmployee(payload: Employee): Observable<Employee> {
      return this.http.post<Employee>(this.baseUrl, payload);
    }

    getEmployeeById(id : number): Observable<Employee> {
      return this.http.get<Employee>(`${this.baseUrl}/${id}`);
    }

    getAllEmployee(): Observable<Employee[]> {
      return this.http.get<Employee[]>(this.baseUrl);
    }

    updateEmployee(id: number, payload: Employee): Observable<Employee> {
      return this.http.put<Employee>(`${this.baseUrl}/${id}`, payload);
    }

    deleteEmployee(id : number): Observable<Employee> {
      return this.http.delete<Employee>(`${this.baseUrl}/${id}`);
    }

}
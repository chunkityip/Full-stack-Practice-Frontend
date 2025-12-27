import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { EmployeeStatus } from 'src/app/type/Employee';

@Component({
  selector: 'app-create-employee-dialog',
  templateUrl: './create-employee-dialog.component.html',
  styleUrls: ['./create-employee-dialog.component.scss']
})
export class CreateEmployeeDialogComponent {
  employeeForm: FormGroup;
  currentStatus: EmployeeStatus = EmployeeStatus.UNSAVED;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateEmployeeDialogComponent>
  ) {
    this.employeeForm = this.fb.group({
      fullName: ['', Validators.required],
      department: ['', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      const formData = {
        ...this.employeeForm.value,
        isUnsaved: true 
      };
      this.dialogRef.close(formData);
    }
  }

  getStatusLabel(): string {
    return this.currentStatus;
  }
}
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEmployeeDialogComponent } from './create-employee-dialog.component';

describe('CreateEmployeeDialogComponent', () => {
  let component: CreateEmployeeDialogComponent;
  let fixture: ComponentFixture<CreateEmployeeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateEmployeeDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEmployeeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

export interface Employee {
    id?: number;
    fullName: string;
    department: string;
    status?: EmployeeStatus;
    isUnsaved?: boolean;
}

export enum EmployeeStatus {
  UNSAVED = 'Unsaved',           
  DRAFT = 'Draft',               
  PENDING_APPROVAL = 'Pending_Approval',  
  APPROVED = 'Approved',         
  REJECTED = 'Rejected'          
}
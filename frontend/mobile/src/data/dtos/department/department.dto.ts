// Wire shapes for departments (docs/team-api-contract.md §3.3). The Team
// tab's HR selector only consumes the list; detail is here for the
// committed DepartmentRepository contract.

export interface DepartmentDto {
  id: string;
  nameEn: string;
  nameAr: string | null;
  memberCount: number;
  managerEmployeeId: string | null;
  managerName: string | null;
}

export interface DepartmentDetailDto extends DepartmentDto {
  memberIds: string[];
}

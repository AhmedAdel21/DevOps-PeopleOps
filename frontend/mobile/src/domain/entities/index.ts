export interface BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type { User } from './user.entity';
export type { Me, MeEmployee, Role, Provider } from './me.entity';
export type {
  Attendance,
  AttendancePlace,
  AttendanceStatus,
} from './attendance.entity';
export type {
  AttendanceRecord,
  AttendanceHistoryPage,
  AttendanceRecordStatus,
  AttendanceRecordPlace,
} from './attendance_record.entity';
export type {
  LeaveTypeRef,
  LeaveTypeMeta,
  PermissionType,
  LeaveRequestStatus,
  LeaveRequestDateRange,
  LeaveRequestSort,
  PermissionRequestStatus,
  LeaveBalance,
  LeaveBalancesSummary,
  LeaveRequestListItem,
  LeaveRequestsPage,
  LeaveAttendanceConflictDay,
  LeaveBalanceImpact,
  LeaveRequestDetail,
  SubmitLeaveResult,
  AdminLeaveRequestListItem,
  AdminLeaveRequestsPage,
  PermissionQuota,
  PermissionRequest,
  PermissionRequestsPage,
} from './leave.entity';
export type {
  TeamAttendanceStatus,
  TeamAttendanceFilter,
  TeamAttendanceRow,
  TeamAttendanceSummary,
  TeamAttendanceDay,
  TeamAttendanceHistoryPage,
  AttendancePermissionType,
  MarkCheckedInInput,
  MarkOnVacationInput,
  ForceSignOutInput,
  AddPermissionEntryInput,
  MarkWorkspaceVacationDateInput,
  RemoveOverrideInput,
  CsvExportRange,
  CsvExportInput,
  CsvExportResult,
  BackfillInput,
  BackfillResult,
} from './team_attendance.entity';
export type {
  RoleId,
  RoleOption,
  EmployeeStatusFilter,
  DirectoryEmployee,
  EmployeeDirectoryPage,
  EmployeeDirectoryQuery,
  EmployeeProfile,
  AddEmployeeInput,
  AddEmployeeResult,
  UpdateEmployeeInput,
  SetUserDisabledInput,
  SetUserRoleInput,
  ProvisionEmployeeInput,
} from './employee_management.entity';
export type {
  Department,
  DepartmentDetail,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  SetDepartmentManagerInput,
  MoveEmployeeToDepartmentInput,
} from './department.entity';
export type {
  LeaveTypeConfigStatus,
  LeaveTypePolicy,
  LeaveTypeConfig,
  UpdateLeaveTypePolicyInput,
  ResetLeaveTypePolicyInput,
} from './leave_type_config.entity';

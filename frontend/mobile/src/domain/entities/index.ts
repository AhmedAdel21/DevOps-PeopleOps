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
  PermissionRequestStatus,
  LeaveBalance,
  LeaveBalancesSummary,
  LeaveRequestListItem,
  LeaveRequestsPage,
  LeaveRequestDetail,
  SubmitLeaveResult,
  AdminLeaveRequestListItem,
  AdminLeaveRequestsPage,
  PermissionQuota,
  PermissionRequest,
  PermissionRequestsPage,
} from './leave.entity';

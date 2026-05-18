export type {
  AttachmentRepository,
  LocalAttachment,
  UploadedAttachment,
} from './attachment.repository';
export type {
  AuthRepository,
  AuthStateSubscription,
} from './auth.repository';
export type { MeRepository } from './me.repository';
export type { AttendanceRepository } from './attendance.repository';
export type { SlackRepository } from './slack.repository';
export type {
  LeaveRepository,
  GetAvailableLeaveTypesParams,
  GetLeaveBalancesParams,
  GetLeaveRequestsParams,
  GetLeaveRequestDetailParams,
  SubmitLeaveRequestParams,
  CancelLeaveRequestParams,
  ReviewLeaveRequestParams,
  RequestPermissionParams,
  GetPermissionRequestsParams,
  GetPermissionRequestDetailParams,
  CancelPermissionRequestParams,
} from './leave.repository';
export type {
  TeamAttendanceRepository,
  GetTeamAttendanceDayParams,
  GetTeamAttendanceHistoryParams,
} from './team_attendance.repository';
export type {
  AdminAttendanceRepository,
} from './admin_attendance.repository';
export type {
  EmployeeManagementRepository,
} from './employee_management.repository';
export type {
  DepartmentRepository,
} from './department.repository';
export type {
  LeaveTypeConfigRepository,
} from './leave_type_config.repository';
export type {
  GetPendingApprovalsParams,
  PendingApprovalsRepository,
} from './pending_approvals.repository';
export type {
  GetApprovalDetailParams,
  ApprovalDetailRepository,
} from './approval_detail.repository';

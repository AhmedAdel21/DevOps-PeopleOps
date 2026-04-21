import type {
  LeaveBalance,
  LeaveRequest,
  LeaveRequestsPage,
  LeaveType,
  PermissionQuota,
  PermissionRequest,
  PermissionRequestsPage,
  PermissionType,
} from '@/domain/entities';

export interface RequestLeaveParams {
  leaveType: LeaveType;
  fromDate: string;  // yyyy-MM-dd
  toDate: string;    // yyyy-MM-dd
}

export interface GetLeaveRequestsParams {
  cursor?: string;
  pageSize?: number;
}

export interface RequestPermissionParams {
  permissionType: PermissionType;
  date: string;       // yyyy-MM-dd
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
}

export interface GetPermissionRequestsParams {
  cursor?: string;
  pageSize?: number;
}

export interface LeaveBalancesResult {
  balances: LeaveBalance[];
  permissionQuota: PermissionQuota | null;
}

export interface LeaveRepository {
  getLeaveBalances(): Promise<LeaveBalancesResult>;
  getLeaveRequests(params: GetLeaveRequestsParams): Promise<LeaveRequestsPage>;
  createLeaveRequest(params: RequestLeaveParams): Promise<LeaveRequest>;
  getPermissionRequests(params: GetPermissionRequestsParams): Promise<PermissionRequestsPage>;
  createPermissionRequest(params: RequestPermissionParams): Promise<PermissionRequest>;
}

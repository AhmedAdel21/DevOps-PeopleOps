import type { LeaveBalance, LeaveRequest, LeaveRequestsPage, LeaveType } from '@/domain/entities';

export interface RequestLeaveParams {
  leaveType: LeaveType;
  fromDate: string;  // yyyy-MM-dd
  toDate: string;    // yyyy-MM-dd
}

export interface GetLeaveRequestsParams {
  cursor?: string;
  pageSize?: number;
}

export interface LeaveRepository {
  getLeaveBalances(): Promise<LeaveBalance[]>;
  getLeaveRequests(params: GetLeaveRequestsParams): Promise<LeaveRequestsPage>;
  createLeaveRequest(params: RequestLeaveParams): Promise<LeaveRequest>;
}

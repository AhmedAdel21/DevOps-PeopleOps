export type LeaveType = 'Annual' | 'Casual' | 'Sick';

export type LeaveRequestStatus = 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';

export interface LeaveBalance {
  readonly type: LeaveType;
  readonly remaining: number | null;
  readonly used: number | null;
  readonly total: number | null;
  readonly unlimited?: boolean;
}

export interface LeaveRequest {
  readonly id: string;
  readonly leaveType: LeaveType;
  readonly fromDate: string;    // yyyy-MM-dd
  readonly toDate: string;      // yyyy-MM-dd
  readonly durationDays: number;
  readonly status: LeaveRequestStatus;
}

export interface LeaveRequestsPage {
  readonly items: LeaveRequest[];
  readonly nextCursor: string | null;
}

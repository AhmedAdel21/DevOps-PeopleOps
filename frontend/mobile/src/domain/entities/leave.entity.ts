export type LeaveType =
  | 'Annual'
  | 'Casual'
  | 'Sick'
  | 'Compassionate'
  | 'Unpaid'
  | 'Hajj'
  | 'Marriage';

export type PermissionType = 'Late' | 'Early' | 'MiddleDay' | 'HalfDay';

export type LeaveRequestStatus = 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';

export type PermissionRequestStatus = 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';

export interface LeaveBalance {
  readonly type: LeaveType;
  readonly remaining: number | null;
  readonly used: number | null;
  readonly total: number | null;
  readonly unlimited?: boolean;
}

export interface PermissionQuota {
  readonly permissionsUsed: number;
  readonly permissionsAllowed: number;
  readonly monthResetsAt: string; // yyyy-MM-dd of first day of next month
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

export interface PermissionRequest {
  readonly id: string;
  readonly permissionType: PermissionType;
  readonly date: string;          // yyyy-MM-dd
  readonly startTime: string;     // HH:mm (24h)
  readonly endTime: string;       // HH:mm (24h)
  readonly durationMinutes: number;
  readonly status: PermissionRequestStatus;
}

export interface PermissionRequestsPage {
  readonly items: PermissionRequest[];
  readonly nextCursor: string | null;
}

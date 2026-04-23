import type {
  AdminLeaveRequestsPage,
  LeaveBalancesSummary,
  LeaveRequestDetail,
  LeaveRequestStatus,
  LeaveRequestsPage,
  LeaveTypeMeta,
  PermissionQuota,
  PermissionRequest,
  PermissionRequestsPage,
  PermissionType,
  SubmitLeaveResult,
} from '@/domain/entities';

// ── Leave (BE-backed) ──────────────────────────────────────────────────────

export interface GetAvailableLeaveTypesParams {
  startDate: string; // yyyy-MM-dd
}

export interface GetLeaveBalancesParams {
  year?: number;
}

export interface GetLeaveRequestsParams {
  status?: LeaveRequestStatus;
  page?: number;
  pageSize?: number;
}

export interface SubmitLeaveRequestParams {
  leaveTypeId: number;
  startDate: string;        // yyyy-MM-dd
  endDate: string;          // yyyy-MM-dd
  notes?: string;
}

export interface CancelLeaveRequestParams {
  leaveRequestId: string;
}

export interface GetLeaveRequestDetailParams {
  leaveRequestId: string;
}

export interface ReviewLeaveRequestParams {
  leaveRequestId: string;
  reviewerComment?: string;
}

// ── Permission (mock-only; unchanged) ──────────────────────────────────────

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

/**
 * Permissions still use the mock-era balance summary with a permission quota
 * attached. The real BE does not expose this feature yet.
 */
export interface MockPermissionBalancesResult {
  permissionQuota: PermissionQuota | null;
}

// ── Repository ─────────────────────────────────────────────────────────────

export interface LeaveRepository {
  // Leave
  getAvailableLeaveTypes(params: GetAvailableLeaveTypesParams): Promise<LeaveTypeMeta[]>;
  getLeaveBalances(params: GetLeaveBalancesParams): Promise<LeaveBalancesSummary>;
  getLeaveRequests(params: GetLeaveRequestsParams): Promise<LeaveRequestsPage>;
  getLeaveRequestDetail(params: GetLeaveRequestDetailParams): Promise<LeaveRequestDetail>;
  submitLeaveRequest(params: SubmitLeaveRequestParams): Promise<SubmitLeaveResult>;
  cancelLeaveRequest(params: CancelLeaveRequestParams): Promise<void>;

  // Admin / manager
  adminGetLeaveRequests(params: GetLeaveRequestsParams): Promise<AdminLeaveRequestsPage>;
  adminApproveLeaveRequest(params: ReviewLeaveRequestParams): Promise<void>;
  adminRejectLeaveRequest(params: ReviewLeaveRequestParams): Promise<void>;

  // Permission (mock)
  getPermissionQuota(): Promise<PermissionQuota | null>;
  getPermissionRequests(params: GetPermissionRequestsParams): Promise<PermissionRequestsPage>;
  createPermissionRequest(params: RequestPermissionParams): Promise<PermissionRequest>;
}

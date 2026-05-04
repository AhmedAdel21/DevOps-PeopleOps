import type {
  AdminLeaveRequestsPage,
  LeaveBalancesSummary,
  LeaveRequestDateRange,
  LeaveRequestDetail,
  LeaveRequestSort,
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
  /**
   * Approval-list filters from designs QosTu / 6.1-6.4. Server-side per
   * Q6:server-side. The valid values per status:
   *   Pending → All / Today / ThisWeek / ThisMonth
   *   Approved / Rejected / Cancelled → All / ThisMonth / Last3Months / ThisYear
   * The BE re-validates and 400s if an invalid combination is sent.
   */
  dateRange?: LeaveRequestDateRange;
  /** Sort popover from SJjs8. Defaults to NewestSubmission server-side. */
  sort?: LeaveRequestSort;
}

export interface SubmitLeaveRequestParams {
  leaveTypeId: number;
  startDate: string;        // yyyy-MM-dd
  endDate: string;          // yyyy-MM-dd
  notes?: string;
  /** Ids returned by POST /api/attachments. */
  attachmentIds?: string[];
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

// ── Permission ─────────────────────────────────────────────────────────────

export interface RequestPermissionParams {
  permissionType: PermissionType;
  date: string;       // yyyy-MM-dd
  startTime: string;  // HH:mm — ignored by backend for HalfDay
  endTime: string;    // HH:mm — ignored by backend for HalfDay
  notes?: string;
  /** Ids returned by POST /api/attachments. Populated once the file picker
   *  ships in Phase B; today this is always empty/undefined. */
  attachmentIds?: string[];
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

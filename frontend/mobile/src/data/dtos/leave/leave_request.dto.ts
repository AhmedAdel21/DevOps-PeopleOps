// ── Employee list + detail ──────────────────────────────────────────────────

export interface LeaveRequestListItemDto {
  leaveRequestId: string;
  leaveTypeName: string;
  leaveTypeNameAr: string;
  colorHex: string;
  startDate: string;        // yyyy-MM-dd
  endDate: string;          // yyyy-MM-dd
  totalDays: number;
  status: string;           // "Pending" | "Approved" | "Rejected" | "Cancelled"
  hasAttendanceConflict: boolean;
  createdAt: string;        // ISO 8601
}

export interface LeaveRequestsPageDto {
  items: LeaveRequestListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface LeaveRequestDetailDto {
  leaveRequestId: string;
  leaveTypeName: string;
  leaveTypeNameAr: string;
  colorHex: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  notes: string | null;
  hasAttendanceConflict: boolean;
  conflictDetails: string | null;
  reviewerComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
  balanceAfterApproval: number | null;
}

// ── Submit ──────────────────────────────────────────────────────────────────

export interface SubmitLeaveRequestDto {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface SubmitLeaveRequestSuccessDto {
  leaveRequestId: string;
  hasWeekendWarning: boolean;
  hasAttendanceConflictWarning: boolean;
  conflictDetails: string | null;
}

// 422 response body.
export interface SubmitLeaveRequestErrorDto {
  errorCode?: string;
  errorMessage?: string;
  remainingBalance?: number | null;
  conflictingDates?: string | null;
}

// Admin variant adds employee fields + review metadata.
export interface AdminLeaveRequestListItemDto extends LeaveRequestListItemDto {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  notes: string | null;
  conflictDetails: string | null;
  reviewerComment: string | null;
  reviewedAt: string | null;
}

export interface AdminLeaveRequestsPageDto {
  items: AdminLeaveRequestListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Admin approve/reject body.
export interface ReviewLeaveRequestDto {
  reviewerComment?: string;
}

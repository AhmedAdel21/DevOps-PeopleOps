// Wire shapes for the BE's LeaveInfoModel + SubmitLeaveResult +
// LeaveRequestModel. Field names match the JSON the new C# backend
// returns (PascalCase → camelCase by ASP.NET's default serializer).

// ── List + detail ──────────────────────────────────────────────────────────

/**
 * One row in the BE's PagedResult<LeaveInfoModel>. Id is a long on the
 * BE — JS reads it as number. The mapper stringifies before reaching the
 * UI so the rest of the app keeps treating leave request ids as strings.
 */
export interface LeaveRequestListItemDto {
  id: number;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveStatusId: number;
  leaveStatusName: string;
  requestStatusId: number;
  requestStatusName: string;
  fromDate: string;        // ISO 8601 — BE serialises DateTime
  toDate: string | null;
  period: number;          // days
  employeeId: number;
  employeeName: string;
  isClosed: boolean;
  assignedToId: number | null;
  assignedUserName: string | null;
  createdDate: string;     // ISO 8601 (DateTimeOffset)
  createdBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
  // Leave-specific balances — BE's LeaveInfoModel carries these on every
  // row (list + detail), so the management Approvals list can derive the
  // balance-impact block (design ynfPj) without a detail fetch.
  currentAnnualLeaveBalance?: number;
  currentSickLeaveBalance?: number;
  currentUrgentLeaveBalance?: number;
}

/** Matches Devopsolution.Dal.Models.BaseClasses.Pagination.PaginationData. */
export interface PaginationDataDto {
  currentPage: number;
  pageSize: number;
  rowCount: number;
  pageCount?: number;
  firstRowOnPage?: number;
  lastRowOnPage?: number;
}

/** Matches PagedResult<LeaveInfoModel>. */
export interface LeaveRequestsPageDto {
  data: LeaveRequestListItemDto[];
  pagination: PaginationDataDto;
}

// Detail endpoint — BE's GetLeaveDetails returns the same LeaveInfoModel
// shape plus attachments and rich employee fields.
export interface AttachmentInfoDto {
  id: number;
  attachmentTypeId: number;
  attachementUrl: string;      // sic — BE typo preserved on the wire
  createdDate: string;
  createdBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
}

export interface LeaveRequestDetailDto extends LeaveRequestListItemDto {
  employeeEmail?: string;
  employeeMobile1?: string;
  empJobLevel?: string;
  empTeamId?: number | null;
  empImageUrl?: string;
  // currentAnnual/Sick/UrgentLeaveBalance inherited from the base.
  attachments?: AttachmentInfoDto[];
}

// ── Submit ─────────────────────────────────────────────────────────────────

/**
 * Wire shape for POST /api/v1/vacations. Maps to BE's
 * Devopsolution.Dal.Models.Requests.Hr.LeaveRequestModel. The BE derives
 * EndDate from FromDateTime + Period (days). ForUserId / CreatedById are
 * filled server-side from the JWT — never sent by the client.
 */
export interface SubmitLeaveRequestDto {
  leaveTypeId: number;     // 1=Urgent, 2=Annual, 3=Sick
  fromDateTime: string;    // yyyy-MM-dd or full ISO 8601
  period: number;          // days
}

/**
 * Response shape for POST /api/v1/vacations. Matches BE's
 * SubmitLeaveResult. The BE returns the same shape on 201 (success=true)
 * and 422 (success=false) — the controller distinguishes by status code.
 */
export interface SubmitLeaveRequestSuccessDto {
  success: boolean;
  leaveRequestId: number;
  errorCode: string | null;
  errorMessage: string | null;
  remainingBalance: number | null;
  conflictingDates: string | null;
  hasWeekendWarning: boolean;
}

// Alias so existing callers don't break — the 422 body has the same shape.
export type SubmitLeaveRequestErrorDto = SubmitLeaveRequestSuccessDto;

// ── Admin ───────────────────────────────────────────────────────────────────

// The BE's admin endpoint returns the same PagedResult<LeaveInfoModel>
// shape as the employee endpoint — there are no extra employee-side
// fields on the row.
export type AdminLeaveRequestListItemDto = LeaveRequestListItemDto;
export type AdminLeaveRequestsPageDto = LeaveRequestsPageDto;

/** Body for PUT /admin/vacations/{id}/approve and /reject. */
export interface ReviewLeaveRequestDto {
  reviewerComment?: string;
}

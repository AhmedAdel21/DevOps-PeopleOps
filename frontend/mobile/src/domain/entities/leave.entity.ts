// ── Leave type (dynamic — driven by BE, not a closed union) ────────────────

/** Minimal identifying data for a leave type. */
export interface LeaveTypeRef {
  readonly id: number;          // 1..8 (see BE integration guide)
  readonly nameEn: string;
  readonly nameAr: string;
  readonly colorHex: string;    // '#RRGGBB'
}

/** Full metadata returned by GET /api/vacations/leave-types. */
export interface LeaveTypeMeta extends LeaveTypeRef {
  readonly requiresMedicalCertificate: boolean;
  readonly isOncePerCareer: boolean;
  readonly maxConsecutiveDays: number | null;
  readonly allowSameDay: boolean;
}

// ── Status enums ───────────────────────────────────────────────────────────

export type LeaveRequestStatus = 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';

// ── Filter / sort options for the Approvals list (designs QosTu + 6.x) ──

/** Date-range chips — the value set differs per status (Pending uses the
 *  short range, the historic statuses Approved/Rejected/Cancelled use the
 *  long range). The repo accepts the union and the BE re-validates. */
export type LeaveRequestDateRange =
  | 'All'
  | 'Today'
  | 'ThisWeek'
  | 'ThisMonth'
  | 'Last3Months'
  | 'ThisYear';

/** Sort options from the popover at SJjs8. */
export type LeaveRequestSort =
  | 'NewestSubmission'
  | 'OldestSubmission'
  | 'SoonestStartDate'
  | 'MostDays';

// Permission feature (mock-only for now, kept intact).
export type PermissionType = 'Late' | 'Early' | 'MiddleDay' | 'HalfDay';
export type PermissionRequestStatus = 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';

// ── Balance ────────────────────────────────────────────────────────────────

export interface LeaveBalance {
  readonly typeId: number;
  readonly typeName: string;
  readonly colorHex: string;
  readonly isUnlimited: boolean;
  readonly totalEntitlement: number;
  readonly usedDays: number;
  readonly remainingDays: number;
}

export interface LeaveBalancesSummary {
  readonly year: number;
  readonly balances: LeaveBalance[];
}

// ── Employee list + detail ─────────────────────────────────────────────────

export interface LeaveRequestListItem {
  readonly id: string;
  readonly leaveTypeName: string;
  readonly leaveTypeNameAr: string;
  readonly colorHex: string;
  readonly startDate: string;   // yyyy-MM-dd
  readonly endDate: string;     // yyyy-MM-dd
  readonly totalDays: number;
  readonly status: LeaveRequestStatus;
  readonly hasAttendanceConflict: boolean;
  readonly createdAt: string;   // ISO 8601
}

export interface LeaveRequestsPage {
  readonly items: LeaveRequestListItem[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * One day inside the conflict card on ynfPj/UirUR — the BE returns the
 * employee's existing attendance line for each day in the requested range
 * so the reviewer can spot overlap. `record` is null for days with no
 * attendance entry yet (rendered as "No record").
 */
export interface LeaveAttendanceConflictDay {
  readonly date: string;            // yyyy-MM-dd
  readonly record: string | null;   // pre-formatted "Office · 9:02–18:15"
}

/** Balance Impact card on ynfPj — "18 days → 13 days". */
export interface LeaveBalanceImpact {
  readonly leaveTypeId: number;
  readonly leaveTypeName: string;
  readonly daysBefore: number;
  readonly daysAfter: number;
}

export interface LeaveRequestDetail {
  readonly id: string;
  readonly leaveTypeName: string;
  readonly leaveTypeNameAr: string;
  readonly colorHex: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly totalDays: number;
  readonly status: LeaveRequestStatus;
  readonly notes: string | null;
  readonly hasAttendanceConflict: boolean;
  readonly conflictDetails: string | null;
  readonly reviewerComment: string | null;
  readonly reviewedAt: string | null;
  readonly createdAt: string;
  readonly balanceAfterApproval: number | null;

  // ── Approval-screen extras (ynfPj/UirUR — server-supplied per Q2:A) ──

  /** Per-day conflict rows. Empty array when no conflict; the screen hides
   *  the conflict card entirely in that case. */
  readonly conflicts: readonly LeaveAttendanceConflictDay[];
  /** Computed before/after balance for the request's leave type. Null when
   *  not applicable (e.g. unlimited Sick Leave). */
  readonly balanceImpact: LeaveBalanceImpact | null;
  /** Number of times this employee has previously taken this leave type.
   *  Renders the precedent footnote on ynfPj. Null when the BE doesn't
   *  ship it yet. */
  readonly precedentCount: number | null;

  // ── Cancellation metadata (Q25 — design 6.4 needs both) ─────────────

  readonly cancelledAt: string | null;
  /** Display name of the cancelling actor — "requester" or a reviewer. */
  readonly cancelledBy: string | null;
}

// ── Submit ─────────────────────────────────────────────────────────────────

export interface SubmitLeaveResult {
  readonly leaveRequestId: string;
  readonly hasWeekendWarning: boolean;
  readonly hasAttendanceConflictWarning: boolean;
  readonly conflictDetails: string | null;
}

// ── Admin ──────────────────────────────────────────────────────────────────

export interface AdminLeaveRequestListItem extends LeaveRequestListItem {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly employeeCode: string;
  readonly notes: string | null;
  readonly conflictDetails: string | null;
  readonly reviewerComment: string | null;
  readonly reviewedAt: string | null;
  /** Display name of the reviewer — used inline on 6.2/6.3 rows e.g.
   *  "Approved by Mona Fadel · 'Looks good — coverage confirmed.'" */
  readonly reviewerName: string | null;
  /** Cancellation metadata (Q25) — both null on non-cancelled rows. */
  readonly cancelledAt: string | null;
  readonly cancelledBy: string | null;
}

export interface AdminLeaveRequestsPage {
  readonly items: AdminLeaveRequestListItem[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
}

// ── Permission feature ─────────────────────────────────────────────────────

export interface PermissionQuota {
  readonly permissionsUsed: number;
  readonly permissionsAllowed: number;
  readonly monthResetsAt: string; // yyyy-MM-dd
}

/** Snapshot of a file attached to a permission/leave request. */
export interface AttachmentSnapshot {
  readonly id: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

export interface PermissionRequest {
  readonly id: string;
  readonly permissionType: PermissionType;
  readonly date: string;          // yyyy-MM-dd
  readonly startTime: string;     // HH:mm
  readonly endTime: string;       // HH:mm
  readonly durationMinutes: number;
  readonly notes?: string;
  readonly status: PermissionRequestStatus;
  readonly attachments: readonly AttachmentSnapshot[];
}

export interface PermissionRequestsPage {
  readonly items: PermissionRequest[];
  readonly nextCursor: string | null;
}

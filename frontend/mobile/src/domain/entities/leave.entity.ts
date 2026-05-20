// ── Leave type (dynamic — driven by BE, not a closed union) ────────────────

/** Minimal identifying data for a leave type. */
export interface LeaveTypeRef {
  readonly id: number;          // 1..8 (see BE integration guide)
  readonly nameEn: string;
  readonly nameAr: string;
  readonly colorHex: string;    // '#RRGGBB'
}

/** Full metadata returned by GET /api/v1/vacations/leave-types. */
export interface LeaveTypeMeta extends LeaveTypeRef {
  readonly requiresMedicalCertificate: boolean;
  readonly isOncePerCareer: boolean;
  readonly maxConsecutiveDays: number | null;
  readonly allowSameDay: boolean;
}

// ── Status enums ───────────────────────────────────────────────────────────

export type LeaveRequestStatus = 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';

// ── Per-leg approval progress (BE Phase 3 — wire-surfaced) ────────────────
// The hierarchical workflow runs through up to three legs: Manager (the
// resolved manager-leg approver) → HR Manager → CEO. Each leg has its own
// status; the request terminalizes when an acting leg ≥ the decisive
// level decides. Mobile uses this to render "Manager ✓, HR pending"
// progress UI on detail screens. `null` on the parent entity means the
// BE didn't surface the per-leg state (older deploy or non-Vacation/
// Permission request type) — UI hides the progress block in that case.

export type ApprovalLegStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Superseded';

/** A single leg of the approval chain (Manager, HR, or CEO). */
export interface ApprovalLeg {
  readonly status: ApprovalLegStatus;
  /** AppUser id of the actor (stringified). Null when leg is still
   *  Pending or Superseded without action. */
  readonly actorId: string | null;
  /** ISO 8601 timestamp of the leg action. Null while Pending. */
  readonly actedAt: string | null;
}

/** Aggregate progress snapshot for a single request. */
export interface ApprovalProgress {
  /** Highest level that, when it acts ≥, terminalizes the request.
   *  `HrManager` for short leave + all permissions; `Ceo` for long
   *  leave or anything escalated past HR (e.g. HR-Manager self-submit). */
  readonly decisiveLevel: 'HrManager' | 'Ceo';
  readonly manager: ApprovalLeg;
  readonly hr: ApprovalLeg;
  readonly ceo: ApprovalLeg;
  /** AppUser id of whoever terminalized the request (null while Pending). */
  readonly decidedBy: string | null;
  readonly decidedAt: string | null;
}

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
  /** Per-leg approval snapshot. Null when the BE didn't surface it
   *  (older deploy, or aggregate-only filter). Cascades to
   *  AdminLeaveRequestListItem via `extends`. */
  readonly approvalProgress: ApprovalProgress | null;
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

  /** Per-leg approval snapshot for the "Approval Progress" UI section. */
  readonly approvalProgress: ApprovalProgress | null;
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
  /** Employee's current leave balances (from BE LeaveInfoModel). Drive the
   *  Approval Detail balance-impact block; null when the BE omits them. */
  readonly currentAnnualLeaveBalance: number | null;
  readonly currentSickLeaveBalance: number | null;
  readonly currentUrgentLeaveBalance: number | null;
}

export interface AdminLeaveRequestsPage {
  readonly items: AdminLeaveRequestListItem[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
}

/** Management Approvals — Permissions tab (`/management/requests/permissions`).
 *  Mirrors AdminLeaveRequestListItem; permission `period` is HOURS. */
export interface AdminPermissionRequestListItem {
  readonly id: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly permissionTypeName: string; // BE EN, e.g. "LateAttendance"
  readonly startDate: string;          // yyyy-MM-dd
  readonly endDate: string;            // yyyy-MM-dd
  readonly periodHours: number;        // BE period, in hours
  readonly status: LeaveRequestStatus; // shared request-status enum
  readonly createdAt: string;          // ISO 8601
  /** Per-leg approval snapshot — same shape used on leave rows. */
  readonly approvalProgress: ApprovalProgress | null;
}

export interface AdminPermissionRequestsPage {
  readonly items: AdminPermissionRequestListItem[];
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
  /** Per-leg approval snapshot — null while BE hasn't surfaced it
   *  (older deploy). Permissions are always 2-step (Manager → HR);
   *  the CEO leg is always Superseded except for HR-self-submit
   *  escalations. */
  readonly approvalProgress: ApprovalProgress | null;
}

export interface PermissionRequestsPage {
  readonly items: PermissionRequest[];
  readonly nextCursor: string | null;
}

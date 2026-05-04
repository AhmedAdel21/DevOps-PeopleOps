/**
 * Entities for the Team Attendance feature (designs EfKE5, dcnNd, xZLeT and
 * the per-row admin-override sheets in Group 3 — hsKdV/DvmlK/CTZmA/Nw6Or/
 * vkrpz/ITFbf/Msjmk).
 *
 * Reads cover both the Manager variant (own-department only) and the HR
 * Admin variant (all departments + dept selector). Scoping is BE-driven —
 * the client never filters by department itself.
 *
 * Writes are the admin overrides that fire from the trailing-⋯ row
 * affordance (T7LFAU). Each is gated by a permission and re-checked by the
 * BE; a 403 surfaces as ManagementError('forbidden').
 */

// ── Status enums ───────────────────────────────────────────────────────────

/**
 * The visible status for a team attendance row, derived from BE attendance
 * records. Matches the chips/labels in EfKE5/dcnNd: Office, Remote, Absent,
 * SignedOut (with worked hours), NotSignedIn, OnLeave (e.g. on vacation).
 *
 * 'Late' is NOT a status — it overlays on top of Office/Remote via
 * `isLate`, mirroring the design where a row reads "Office · Since 9:18 AM"
 * and shows an extra red "Late" badge.
 */
export type TeamAttendanceStatus =
  | 'Office'
  | 'Remote'
  | 'Absent'
  | 'SignedOut'
  | 'NotSignedIn'
  | 'OnLeave';

/** Filter chip values from the design's filter row. */
export type TeamAttendanceFilter =
  | 'All'
  | 'Office'
  | 'Remote'
  | 'Absent'
  | 'Late'
  | 'NotSignedIn';

// ── Read entities ──────────────────────────────────────────────────────────

export interface TeamAttendanceRow {
  readonly userId: string;
  readonly slackUserId: string | null;
  readonly displayName: string;
  readonly avatarInitials: string;
  readonly avatarColorHex: string | null;
  readonly departmentId: string | null;
  readonly departmentName: string | null;
  readonly status: TeamAttendanceStatus;
  /** Late overlays Office/Remote — see comment on TeamAttendanceStatus. */
  readonly isLate: boolean;
  /** ISO 8601, viewer's TZ. Null if no sign-in yet for the day. */
  readonly signedInAt: string | null;
  /** ISO 8601, viewer's TZ. Set on SignedOut rows; null otherwise. */
  readonly signedOutAt: string | null;
  /** Pre-formatted by the mapper, e.g. "Office · Since 8:30 AM" or
   *  "Signed out at 6:00 PM · 8h worked". The screen renders verbatim. */
  readonly statusLabel: string;
}

export interface TeamAttendanceSummary {
  readonly inOffice: number;
  readonly remote: number;
  readonly absent: number;
  readonly late: number;
  readonly notSignedIn: number;
  readonly onLeave: number;
}

export interface TeamAttendanceDay {
  readonly date: string; // yyyy-MM-dd
  readonly summary: TeamAttendanceSummary;
  readonly rows: readonly TeamAttendanceRow[];
}

export interface TeamAttendanceHistoryPage {
  readonly items: readonly TeamAttendanceDay[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
}

// ── Admin-override action inputs ───────────────────────────────────────────

/** Permission types accepted by `Add Permission Entry` (vkrpz). */
export type AttendancePermissionType = 'Late' | 'EarlyLeave' | 'Personal';

export interface MarkCheckedInInput {
  readonly slackUserId: string;
  readonly date: string;     // yyyy-MM-dd
  readonly time: string;     // HH:mm
  readonly location: 'Office' | 'Remote';
  readonly note?: string;
}

export interface MarkOnVacationInput {
  readonly slackUserId: string;
  readonly startDate: string; // yyyy-MM-dd
  readonly endDate: string;   // yyyy-MM-dd
  readonly note?: string;
}

export interface ForceSignOutInput {
  readonly slackUserId: string;
}

export interface AddPermissionEntryInput {
  readonly slackUserId: string;
  readonly date: string;            // yyyy-MM-dd
  readonly permissionType: AttendancePermissionType;
  readonly durationMinutes: number;
  readonly note?: string;
}

/** Workspace-wide vacation date sheet (Msjmk). Affects every active
 *  employee on the selected day(s). HR+ only. */
export interface MarkWorkspaceVacationDateInput {
  readonly startDate: string; // yyyy-MM-dd
  readonly endDate: string;   // yyyy-MM-dd; equals startDate for single-day
  readonly reason?: string;
}

export interface RemoveOverrideInput {
  readonly slackUserId: string;
  /** Identifier of the override the BE should revert. Optional because the
   *  trash icon on a row may target the most-recent override implicitly. */
  readonly overrideId?: string;
}

// ── Bulk admin actions ─────────────────────────────────────────────────────

/** Preset date ranges from the CSV export sheet (Z5yms). */
export type CsvExportRange =
  | 'this-week'
  | 'this-month'
  | 'last-month'
  | { readonly startDate: string; readonly endDate: string }; // custom

export interface CsvExportInput {
  readonly range: CsvExportRange;
  /** Specific department ids, or 'all' for the whole workspace. */
  readonly departmentIds: readonly string[] | 'all';
  readonly format: 'csv';
}

export interface CsvExportResult {
  /** Always true on a 200/202 — the BE emails the link separately. */
  readonly enqueued: boolean;
}

/** Slack backfill form (J2DUZj). */
export interface BackfillInput {
  readonly startDate: string;
  readonly endDate: string;
  /** Specific channel ids, or 'all' to scan every channel. */
  readonly channelIds: readonly string[] | 'all';
  readonly dryRun: boolean;
}

export interface BackfillResult {
  readonly messagesScanned: number;
  readonly leaveEntriesCreated: number;
  readonly conflictsSkipped: number;
}

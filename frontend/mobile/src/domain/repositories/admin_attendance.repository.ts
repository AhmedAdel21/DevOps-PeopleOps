import type {
  AddPermissionEntryInput,
  BackfillInput,
  BackfillResult,
  CsvExportInput,
  CsvExportResult,
  ForceSignOutInput,
  MarkCheckedInInput,
  MarkOnVacationInput,
  MarkWorkspaceVacationDateInput,
  RemoveOverrideInput,
} from '@/domain/entities';

/**
 * Write-side repository for admin attendance overrides — the row-level
 * actions on the Team Attendance HR view (T7LFAU trailing ⋯ → hsKdV
 * action sheet → individual sheets DvmlK / CTZmA / Nw6Or / vkrpz / ITFbf)
 * plus the workspace-wide sheet (Msjmk) and the bulk Profile-tools
 * actions (CSV export Z5yms, Slack backfill J2DUZj).
 *
 * Each method maps to one BE endpoint and is gated by a permission. 403
 * surfaces as ManagementError('forbidden') so the screen can show a toast
 * and re-enable the trigger.
 */

export interface AdminAttendanceRepository {
  // ── Per-row overrides ────────────────────────────────────────────────

  markCheckedIn(input: MarkCheckedInInput): Promise<void>;
  markOnVacation(input: MarkOnVacationInput): Promise<void>;
  forceSignOut(input: ForceSignOutInput): Promise<void>;
  addPermissionEntry(input: AddPermissionEntryInput): Promise<void>;
  removeOverride(input: RemoveOverrideInput): Promise<void>;

  // ── Workspace-wide ──────────────────────────────────────────────────

  markWorkspaceVacationDate(
    input: MarkWorkspaceVacationDateInput,
  ): Promise<void>;

  // ── Bulk admin tools ────────────────────────────────────────────────

  exportAttendanceCsv(input: CsvExportInput): Promise<CsvExportResult>;

  /**
   * Kicks off the backfill. Per Q27 the design uses an indeterminate
   * spinner — we don't poll for progress, we await the single response.
   * The promise resolves on completion with summary counts.
   */
  runSlackBackfill(input: BackfillInput): Promise<BackfillResult>;
}

import type { TeamAttendanceDay } from '@/domain/entities';

/**
 * Read-side repository for the Team tab's Attendance segment
 * (designs EfKE5, dcnNd, xZLeT).
 *
 * Scope is BE-driven by role (HR/CEO/SysAdmin unscoped · Manager=depts ·
 * TeamLead=teams · else 403) — the client never filters by department, and
 * the filter chips are applied client-side on the returned roster. The
 * backend has no per-day endpoint: the impl requests `from=to=date` against
 * `/api/v1/management/attendance/history` and derives the day.
 */

export interface GetTeamAttendanceDayParams {
  /** yyyy-MM-dd. Defaults to "today" in BE TZ when omitted. */
  readonly date?: string;
}

export interface TeamAttendanceRepository {
  getTeamAttendanceDay(
    params: GetTeamAttendanceDayParams,
  ): Promise<TeamAttendanceDay>;
}

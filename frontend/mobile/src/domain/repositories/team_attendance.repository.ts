import type {
  TeamAttendanceDay,
  TeamAttendanceFilter,
  TeamAttendanceHistoryPage,
} from '@/domain/entities';

/**
 * Read-side repository for the Team tab's Attendance segment
 * (designs EfKE5, dcnNd, xZLeT). The Manager variant gets only their
 * department; HR Admin gets every department + a department selector.
 *
 * Department scoping is BE-driven — the client never filters by
 * `departmentId` itself unless the user explicitly picked one in the
 * dept selector dropdown.
 */

export interface GetTeamAttendanceDayParams {
  /** yyyy-MM-dd. Defaults to "today" in BE TZ when omitted. */
  readonly date?: string;
  /** Set when the HR Admin variant has chosen a specific department from
   *  the dropdown. Manager variants always omit this. */
  readonly departmentId?: string;
  /** Server-side filter (Q6:server-side). Omit for "All". */
  readonly filter?: Exclude<TeamAttendanceFilter, 'All'>;
}

export interface GetTeamAttendanceHistoryParams {
  readonly startDate: string;        // yyyy-MM-dd
  readonly endDate: string;          // yyyy-MM-dd
  readonly departmentId?: string;
  readonly filter?: Exclude<TeamAttendanceFilter, 'All'>;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface TeamAttendanceRepository {
  getTeamAttendanceDay(
    params: GetTeamAttendanceDayParams,
  ): Promise<TeamAttendanceDay>;

  getTeamAttendanceHistory(
    params: GetTeamAttendanceHistoryParams,
  ): Promise<TeamAttendanceHistoryPage>;
}

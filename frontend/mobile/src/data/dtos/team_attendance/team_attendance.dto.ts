// Wire shapes for `GET /api/v1/management/attendance/history?from&to`
// (Mobile Management Endpoints Integration Guide §1 — full-schema version).
//
// This endpoint returns a *range bundle* (`AttendanceHistoryDto`), NOT the
// per-day roster the Team Attendance design (EfKE5/dcnNd) shows. The mapper
// derives a single day's summary + rows from it (query `from=to=date`).
// `status` arrives as a string and is validated in the mapper.

export interface DailyStatsDto {
  date: string; // yyyy-MM-dd
  inOffice: number;
  wfh: number;
  absent: number;
  total: number;
  permissionCount: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
}

/** One employee's record for a single day. `status` ∈
 *  `InOffice | Wfh | SignedOut | Absent | Vacation`. */
export interface EmployeeDayRecordDto {
  date: string; // yyyy-MM-dd
  status: string;
  place: string | null;
  signIn: string | null; // ISO 8601 datetime
  signOut: string | null; // ISO 8601 datetime
  /** Hours as a decimal (.NET hours-as-float, e.g. 8.5 = 8h 30m). */
  hoursWorked: number | null;
  permissionType: string | null; // late_arrival | early_leave | half_day_vacation
  permissionMarkedBy: string | null;
  permissionMinutes: number;
  vacationMarkedBy: string | null;
  expectedWorkMinutes: number;
  unexcusedLateMinutes: number;
  unexcusedEarlyLeaveMinutes: number;
}

export interface EmployeeSummaryDto {
  slackUserId: string;
  displayName: string;
  avatarUrl: string | null;
  /** Only an id is sent — no name, no departments endpoint. The design's
   *  dept sub-label (dcnNd) is therefore a documented trim. */
  departmentId: string | null;
  totalDays: number;
  daysInOffice: number;
  daysWfh: number;
  daysSignedOut: number;
  daysAbsent: number;
  avgHoursWorked: number | null;
  excusedLateDays: number;
  excusedLateMinutes: number;
  excusedEarlyLeaveDays: number;
  excusedEarlyLeaveMinutes: number;
  unexcusedLateDays: number;
  unexcusedLateMinutes: number;
  unexcusedEarlyLeaveDays: number;
  unexcusedEarlyLeaveMinutes: number;
  fulfillmentRate: number | null;
  days: EmployeeDayRecordDto[];
}

export interface AttendanceHistoryDto {
  workingDates: string[]; // yyyy-MM-dd
  dailyStats: DailyStatsDto[];
  employees: EmployeeSummaryDto[];
}

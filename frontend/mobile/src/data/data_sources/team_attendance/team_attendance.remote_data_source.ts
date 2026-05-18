import type { HttpClient } from '@/data/data_sources/http';
import type {
  AttendanceHistoryDto,
  EmployeeSummaryDto,
} from '@/data/dtos/team_attendance';
import { managementLog } from '@/core/logger';
import { AppConfig } from '@/di/config';

// ── Path (Mobile Management Endpoints Integration Guide §1) ─────────────────
// Manager/HR scope is server-driven by role; there is NO `departmentId` or
// `filter` query param and no per-day endpoint — the client requests a date
// range and derives the per-day roster (see team_attendance.mapper).
const ATTENDANCE_HISTORY = '/api/v1/management/attendance/history';

export interface GetTeamAttendanceRangeQuery {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
}

// ── Mock ────────────────────────────────────────────────────────────────────

/**
 * Mock until the live endpoint is verified on-device. Flip
 * `USE_MOCK_TEAM_ATTENDANCE` / `USE_MOCK_ADMIN_ATTENDANCE` off in
 * `src/di/config.ts` once `/management/attendance/history` is confirmed
 * (same pattern the leave feature followed).
 */
const useMock = (): boolean =>
  AppConfig.USE_MOCK_TEAM_ATTENDANCE || AppConfig.USE_MOCK_ADMIN_ATTENDANCE;

const mockDelay = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, AppConfig.MOCK_DELAY_MS));

const iso = (date: string, hhmm: string): string => `${date}T${hhmm}:00+03:00`;

const mockEmployee = (
  slackUserId: string,
  displayName: string,
  departmentId: string | null,
  day: Partial<EmployeeSummaryDto['days'][number]> | null,
  date: string,
): EmployeeSummaryDto => ({
  slackUserId,
  displayName,
  avatarUrl: null,
  departmentId,
  totalDays: 1,
  daysInOffice: 0,
  daysWfh: 0,
  daysSignedOut: 0,
  daysAbsent: 0,
  avgHoursWorked: null,
  excusedLateDays: 0,
  excusedLateMinutes: 0,
  excusedEarlyLeaveDays: 0,
  excusedEarlyLeaveMinutes: 0,
  unexcusedLateDays: 0,
  unexcusedLateMinutes: 0,
  unexcusedEarlyLeaveDays: 0,
  unexcusedEarlyLeaveMinutes: 0,
  fulfillmentRate: null,
  days:
    day === null
      ? []
      : [
          {
            date,
            status: 'InOffice',
            place: null,
            signIn: null,
            signOut: null,
            hoursWorked: null,
            permissionType: null,
            permissionMarkedBy: null,
            permissionMinutes: 0,
            vacationMarkedBy: null,
            expectedWorkMinutes: 480,
            unexcusedLateMinutes: 0,
            unexcusedEarlyLeaveMinutes: 0,
            ...day,
          },
        ],
});

/** Sample roster mirroring the designs (EfKE5 Manager + dcnNd HR rows). */
const mockHistory = (date: string): AttendanceHistoryDto => {
  const employees: EmployeeSummaryDto[] = [
    mockEmployee('U04AE', 'Ahmed El-Sayed', 'd_eng',
      { status: 'InOffice', signIn: iso(date, '08:30') }, date),
    mockEmployee('U04NK', 'Nour Khaled', 'd_eng',
      { status: 'Wfh', signIn: iso(date, '09:15') }, date),
    mockEmployee('U04OM', 'Omar Mostafa', 'd_eng',
      {
        status: 'InOffice',
        signIn: iso(date, '09:45'),
        unexcusedLateMinutes: 15,
      }, date),
    mockEmployee('U04FT', 'Fatima Taha', 'd_eng',
      { status: 'Absent' }, date),
    mockEmployee('U04YS', 'Youssef Samir', 'd_eng',
      {
        status: 'SignedOut',
        signIn: iso(date, '10:00'),
        signOut: iso(date, '18:00'),
        hoursWorked: 8,
      }, date),
    mockEmployee('U04LH', 'Layla Hassan', 'd_eng',
      { status: 'Vacation' }, date),
    // No record for the day → mapper synthesizes an Absent row.
    mockEmployee('U04HA', 'Hana Ali', 'd_eng', null, date),
  ];
  return {
    workingDates: [date],
    dailyStats: [
      {
        date,
        inOffice: 2,
        wfh: 1,
        absent: 3,
        total: 7,
        permissionCount: 0,
        lateMinutes: 15,
        earlyLeaveMinutes: 0,
      },
    ],
    employees,
  };
};

// ── Data source ──────────────────────────────────────────────────────────────

export class TeamAttendanceRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async getAttendanceHistory(
    query: GetTeamAttendanceRangeQuery,
  ): Promise<AttendanceHistoryDto> {
    if (useMock()) {
      managementLog.info(
        'data_source',
        `[MOCK] GET ${ATTENDANCE_HISTORY}?from=${query.from}&to=${query.to}`,
      );
      await mockDelay();
      return mockHistory(query.from);
    }
    const params = new URLSearchParams({ from: query.from, to: query.to });
    const path = `${ATTENDANCE_HISTORY}?${params.toString()}`;
    managementLog.info('data_source', `GET ${path}`);
    return this.http.get<AttendanceHistoryDto>(path);
  }
}

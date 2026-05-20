import type { HttpClient } from '@/data/data_sources/http';
import type { TeamDayDto } from '@/data/dtos/team_attendance';
import { managementLog } from '@/core/logger';
import { AppConfig } from '@/di/config';

// ── Path ────────────────────────────────────────────────────────────────────
// Slim per-day endpoint (Mobile.Api.Employee, `[HttpGet("team-day")]`).
// The fat `/history?from&to` endpoint still exists on the admin host for
// the web dashboard's analytics view but the mobile no longer hits it.
const TEAM_DAY_PATH = '/api/v1/management/attendance/team-day';

export interface GetTeamDayQuery {
  date: string; // yyyy-MM-dd
}

// ── Mock ────────────────────────────────────────────────────────────────────

/**
 * Mock until the live endpoint is verified on-device. Flip
 * `USE_MOCK_TEAM_ATTENDANCE` / `USE_MOCK_ADMIN_ATTENDANCE` off in
 * `src/di/config.ts` once the endpoint is confirmed.
 */
const useMock = (): boolean =>
  AppConfig.USE_MOCK_TEAM_ATTENDANCE || AppConfig.USE_MOCK_ADMIN_ATTENDANCE;

const mockDelay = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, AppConfig.MOCK_DELAY_MS));

const iso = (date: string, hhmm: string): string => `${date}T${hhmm}:00+03:00`;

/** Sample roster mirroring the designs (EfKE5 Manager + dcnNd HR rows). */
const mockTeamDay = (date: string): TeamDayDto => ({
  date,
  summary: {
    office: 2,            // Ahmed + Omar
    home: 1,              // Nour
    vacation: 1,          // Layla
    notCheckedIn: 2,      // Fatima + Hana
    signedOut: 1,         // Youssef
    late: 1,              // Omar — unexcusedLateMinutes > 0 on the BE
    total: 7,
  },
  employees: [
    {
      slackUserId: 'U04AE',
      displayName: 'Ahmed El-Sayed',
      avatarUrl: null,
      departmentId: 'd_eng',
      status: 'office',
      place: 'office',
      signIn: iso(date, '08:30'),
      signOut: null,
      hoursWorked: null,
      isLate: false,
    },
    {
      slackUserId: 'U04NK',
      displayName: 'Nour Khaled',
      avatarUrl: null,
      departmentId: 'd_eng',
      status: 'home',
      place: 'home',
      signIn: iso(date, '09:15'),
      signOut: null,
      hoursWorked: null,
      isLate: false,
    },
    {
      slackUserId: 'U04OM',
      displayName: 'Omar Mostafa',
      avatarUrl: null,
      departmentId: 'd_eng',
      status: 'office',
      place: 'office',
      signIn: iso(date, '09:45'),
      signOut: null,
      hoursWorked: null,
      isLate: true,
    },
    {
      slackUserId: 'U04FT',
      displayName: 'Fatima Taha',
      avatarUrl: null,
      departmentId: 'd_eng',
      status: 'notCheckedIn',
      place: null,
      signIn: null,
      signOut: null,
      hoursWorked: null,
      isLate: false,
    },
    {
      slackUserId: 'U04YS',
      displayName: 'Youssef Samir',
      avatarUrl: null,
      departmentId: 'd_eng',
      status: 'signedOut',
      place: 'office',
      signIn: iso(date, '10:00'),
      signOut: iso(date, '18:00'),
      hoursWorked: 8,
      isLate: false,
    },
    {
      slackUserId: 'U04LH',
      displayName: 'Layla Hassan',
      avatarUrl: null,
      departmentId: 'd_eng',
      status: 'vacation',
      place: null,
      signIn: null,
      signOut: null,
      hoursWorked: null,
      isLate: false,
    },
    {
      slackUserId: 'U04HA',
      displayName: 'Hana Ali',
      avatarUrl: null,
      departmentId: 'd_eng',
      status: 'notCheckedIn',
      place: null,
      signIn: null,
      signOut: null,
      hoursWorked: null,
      isLate: false,
    },
  ],
});

// ── Data source ──────────────────────────────────────────────────────────────

export class TeamAttendanceRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async getTeamDay(query: GetTeamDayQuery): Promise<TeamDayDto> {
    if (useMock()) {
      managementLog.info(
        'data_source',
        `[MOCK] GET ${TEAM_DAY_PATH}?date=${query.date}`,
      );
      await mockDelay();
      return mockTeamDay(query.date);
    }
    const params = new URLSearchParams({ date: query.date });
    const path = `${TEAM_DAY_PATH}?${params.toString()}`;
    managementLog.info('data_source', `GET ${path}`);
    return this.http.get<TeamDayDto>(path);
  }
}

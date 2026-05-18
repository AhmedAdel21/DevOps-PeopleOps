import type { HttpClient } from '@/data/data_sources/http';
import type {
  TeamAttendanceDayDto,
  TeamAttendanceHistoryPageDto,
  TeamAttendanceRowDto,
} from '@/data/dtos/team_attendance';
import { managementLog } from '@/core/logger';
import { AppConfig } from '@/di/config';

// ── Paths (docs/team-api-contract.md §3.1 / §3.2) ───────────────────────────

const TEAM_ATTENDANCE_DAY = '/api/v1/admin/team-attendance/day';
const TEAM_ATTENDANCE_HISTORY = '/api/v1/admin/team-attendance/history';

/** Server-side filter values (mirrors the domain's
 *  `Exclude<TeamAttendanceFilter, 'All'>`; kept as a local literal union so
 *  the data layer stays decoupled from domain entities). */
export type TeamAttendanceFilterParam =
  | 'Office'
  | 'Remote'
  | 'Absent'
  | 'Late'
  | 'NotSignedIn';

export interface GetTeamAttendanceDayQuery {
  date?: string;
  departmentId?: string;
  filter?: TeamAttendanceFilterParam;
}

export interface GetTeamAttendanceHistoryQuery {
  startDate: string;
  endDate: string;
  departmentId?: string;
  filter?: TeamAttendanceFilterParam;
  page?: number;
  pageSize?: number;
}

// ── Mock ────────────────────────────────────────────────────────────────────

/**
 * Both flags gate this read because the client can't know its own scope
 * (Manager vs HR) — that's BE-driven. Mock until BOTH endpoints are live;
 * flip both to false together when team-attendance ships.
 */
const useMock = (): boolean =>
  AppConfig.USE_MOCK_TEAM_ATTENDANCE || AppConfig.USE_MOCK_ADMIN_ATTENDANCE;

const mockDelay = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, AppConfig.MOCK_DELAY_MS));

const iso = (date: string, hhmm: string): string => `${date}T${hhmm}:00+03:00`;

/** Sample roster from the designs (EfKE5 Manager + dcnNd HR rows). Labels
 *  are intentionally omitted so the mapper's formatter runs in the app. */
const mockRows = (date: string): TeamAttendanceRowDto[] => [
  {
    userId: 'u_ahmed', slackUserId: 'U04AE', displayName: 'Ahmed El-Sayed',
    avatarInitials: 'AE', avatarColorHex: '#5559D6',
    departmentId: 'd_eng', departmentName: 'Engineering',
    status: 'Office', isLate: false,
    signedInAt: iso(date, '08:30'), signedOutAt: null,
  },
  {
    userId: 'u_nour', slackUserId: 'U04NK', displayName: 'Nour Khaled',
    avatarInitials: 'NK', avatarColorHex: '#1F9D74',
    departmentId: 'd_eng', departmentName: 'Engineering',
    status: 'Remote', isLate: false,
    signedInAt: iso(date, '09:15'), signedOutAt: null,
  },
  {
    userId: 'u_omar', slackUserId: 'U04OM', displayName: 'Omar Mostafa',
    avatarInitials: 'OM', avatarColorHex: '#787CF2',
    departmentId: 'd_eng', departmentName: 'Engineering',
    status: 'Office', isLate: true,
    signedInAt: iso(date, '09:45'), signedOutAt: null,
  },
  {
    userId: 'u_fatima', slackUserId: null, displayName: 'Fatima Taha',
    avatarInitials: 'FT', avatarColorHex: '#D14545',
    departmentId: 'd_eng', departmentName: 'Engineering',
    status: 'Absent', isLate: false,
    signedInAt: null, signedOutAt: null,
  },
  {
    userId: 'u_youssef', slackUserId: 'U04YS', displayName: 'Youssef Samir',
    avatarInitials: 'YS', avatarColorHex: '#D98A00',
    departmentId: 'd_eng', departmentName: 'Engineering',
    status: 'SignedOut', isLate: false,
    signedInAt: iso(date, '10:00'), signedOutAt: iso(date, '18:00'),
  },
  {
    userId: 'u_hana', slackUserId: null, displayName: 'Hana Ali',
    avatarInitials: 'HA', avatarColorHex: null,
    departmentId: 'd_eng', departmentName: 'Engineering',
    status: 'NotSignedIn', isLate: false,
    signedInAt: null, signedOutAt: null,
  },
];

const summarise = (rows: TeamAttendanceRowDto[]) => ({
  inOffice: rows.filter(r => r.status === 'Office').length,
  remote: rows.filter(r => r.status === 'Remote').length,
  absent: rows.filter(r => r.status === 'Absent').length,
  late: rows.filter(r => r.isLate).length,
  notSignedIn: rows.filter(r => r.status === 'NotSignedIn').length,
  onLeave: rows.filter(r => r.status === 'OnLeave').length,
});

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const mockDay = (date: string): TeamAttendanceDayDto => {
  const rows = mockRows(date);
  return { date, summary: summarise(rows), rows };
};

/** Inclusive yyyy-MM-dd range, newest first, capped at `limit`. */
const dateRangeDesc = (
  startDate: string,
  endDate: string,
  limit: number,
): string[] => {
  const out: string[] = [];
  const cur = new Date(`${endDate}T00:00:00Z`);
  const start = new Date(`${startDate}T00:00:00Z`);
  while (cur >= start && out.length < limit) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() - 1);
  }
  return out;
};

// ── Data source ──────────────────────────────────────────────────────────────

export class TeamAttendanceRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async getTeamAttendanceDay(
    query: GetTeamAttendanceDayQuery,
  ): Promise<TeamAttendanceDayDto> {
    const date = query.date ?? todayIso();
    if (useMock()) {
      managementLog.info(
        'data_source',
        `[MOCK] GET ${TEAM_ATTENDANCE_DAY}?date=${date}` +
          `${query.departmentId ? `&departmentId=${query.departmentId}` : ''}` +
          `${query.filter ? `&filter=${query.filter}` : ''}`,
      );
      await mockDelay();
      return mockDay(date);
    }
    const params = new URLSearchParams({ date });
    if (query.departmentId) params.set('departmentId', query.departmentId);
    if (query.filter) params.set('filter', query.filter);
    const path = `${TEAM_ATTENDANCE_DAY}?${params.toString()}`;
    managementLog.info('data_source', `GET ${path}`);
    return this.http.get<TeamAttendanceDayDto>(path);
  }

  async getTeamAttendanceHistory(
    query: GetTeamAttendanceHistoryQuery,
  ): Promise<TeamAttendanceHistoryPageDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? AppConfig.PAGE_SIZE;
    if (useMock()) {
      managementLog.info(
        'data_source',
        `[MOCK] GET ${TEAM_ATTENDANCE_HISTORY} ${query.startDate}..${query.endDate} p${page}`,
      );
      await mockDelay();
      const days = dateRangeDesc(query.startDate, query.endDate, pageSize);
      const items = days.map(mockDay);
      return { items, totalCount: items.length, page, pageSize };
    }
    const params = new URLSearchParams({
      startDate: query.startDate,
      endDate: query.endDate,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (query.departmentId) params.set('departmentId', query.departmentId);
    if (query.filter) params.set('filter', query.filter);
    const path = `${TEAM_ATTENDANCE_HISTORY}?${params.toString()}`;
    managementLog.info('data_source', `GET ${path}`);
    return this.http.get<TeamAttendanceHistoryPageDto>(path);
  }
}

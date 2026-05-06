import type { HttpClient } from '@/data/data_sources/http';
import type {
  EmployeeStatusDto,
  SignInRequestDto,
  AttendanceHistoryResponseDto,
  AttendanceRecordDto,
} from '@/data/dtos/attendance';
import { attendanceLog } from '@/core/logger';

const SIGN_IN_PATH = '/api/v1/attendance/signin';
const GET_CURRENT_STATUS_PATH = '/api/v1/attendance/me';
const SIGN_OUT_PATH = '/api/v1/attendance/signout';
const GET_HISTORY_PATH = '/api/v1/users/me/attendance';

// Backend returns one row per working day in [from, to].
// Frontend wants cursor-based pagination — synthesize it by sliding a
// window of WINDOW_DAYS back from the cursor each page.
const HISTORY_WINDOW_DAYS = 30;

interface PersonalAttendanceDayDto {
  date: string;
  status: string;      // 'InOffice' | 'WFH' | 'SignedOut' | 'Absent'
  place?: string | null;
  signIn?: string | null;
  signOut?: string | null;
  hoursWorked?: number | null;
  permissionType?: string | null;
  permissionMinutes?: number;
}

const toIsoDate = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const subtractDays = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return toIsoDate(d);
};

// Casing differs between endpoints: history backend returns 'WFH' (all-caps),
// mobile UI expects 'Wfh' (title-case, matching the previous contract).
const normalizeWfhCasing = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  return value === 'WFH' ? 'Wfh' : value;
};

export class AttendanceRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async getCurrentStatus(): Promise<EmployeeStatusDto> {
    attendanceLog.info('data_source', `GET ${GET_CURRENT_STATUS_PATH}`);
    return this.http.get<EmployeeStatusDto>(GET_CURRENT_STATUS_PATH);
  }

  async signIn(place: 'InOffice' | 'WFH'): Promise<EmployeeStatusDto> {
    attendanceLog.info('data_source', `POST ${SIGN_IN_PATH} (place=${place})`);
    const body: SignInRequestDto = { place };
    return this.http.post<EmployeeStatusDto>(SIGN_IN_PATH, body);
  }

  async signOut(): Promise<EmployeeStatusDto> {
    attendanceLog.info('data_source', `POST ${SIGN_OUT_PATH}`);
    return this.http.post<EmployeeStatusDto>(SIGN_OUT_PATH, {});
  }

  async getHistory(params: {
    before?: string;
    pageSize?: number;
  }): Promise<AttendanceHistoryResponseDto> {
    // Cursor is the date of the oldest item from the previous page — i.e.,
    // the next page must end strictly before it. Default to today when the
    // caller wants the first page.
    const toDate = params.before ? subtractDays(params.before, 1) : toIsoDate(new Date());
    const fromDate = subtractDays(toDate, HISTORY_WINDOW_DAYS);

    const query = new URLSearchParams();
    query.set('from', fromDate);
    query.set('to', toDate);
    const path = `${GET_HISTORY_PATH}?${query.toString()}`;
    attendanceLog.info('data_source', `GET ${path}`);

    const raw = await this.http.get<PersonalAttendanceDayDto[]>(path);

    // Backend returns ascending by date; UI expects newest-first.
    const sorted = [...raw].sort((a, b) => (a.date < b.date ? 1 : -1));

    const items = sorted.map<AttendanceRecordDto>((r) => ({
      date: r.date,
      status: normalizeWfhCasing(r.status) ?? r.status,
      place: normalizeWfhCasing(r.place ?? null),
      signInTime: r.signIn ?? null,
      signOutTime: r.signOut ?? null,
      workedMinutes:
        r.hoursWorked != null ? Math.round(r.hoursWorked * 60) : null,
    }));

    // When the window returned zero rows, stop paging.
    const nextCursor = items.length > 0 ? items[items.length - 1].date : null;
    return { items, nextCursor };
  }
}

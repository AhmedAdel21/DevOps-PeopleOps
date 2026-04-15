import type { HttpClient } from '@/data/data_sources/http';
import type {
  EmployeeStatusDto,
  SignInRequestDto,
} from '@/data/dtos/attendance';
import { attendanceLog } from '@/core/logger';

const SIGN_IN_PATH = '/api/attendance/signin';
const GET_CURRENT_STATUS_PATH = '/api/attendance/me';
const SIGN_OUT_PATH = '/api/attendance/signout';

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
}

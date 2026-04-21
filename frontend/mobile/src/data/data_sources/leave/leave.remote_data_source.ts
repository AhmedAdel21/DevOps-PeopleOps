import type { HttpClient } from '@/data/data_sources/http';
import type {
  LeaveBalancesResponseDto,
  LeaveRequestsResponseDto,
  LeaveRequestDto,
  CreateLeaveRequestDto,
} from '@/data/dtos/leave';
import { leaveLog } from '@/core/logger';

const BALANCES_PATH = '/api/leave/balances';
const REQUESTS_PATH = '/api/leave/requests';

export class LeaveRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async getLeaveBalances(): Promise<LeaveBalancesResponseDto> {
    leaveLog.info('data_source', `GET ${BALANCES_PATH}`);
    return this.http.get<LeaveBalancesResponseDto>(BALANCES_PATH);
  }

  async getLeaveRequests(params: {
    cursor?: string;
    pageSize?: number;
  }): Promise<LeaveRequestsResponseDto> {
    const query = new URLSearchParams();
    if (params.pageSize !== undefined) {
      query.set('pageSize', params.pageSize.toString());
    }
    if (params.cursor !== undefined) {
      query.set('cursor', params.cursor);
    }
    const qs = query.toString();
    const path = qs ? `${REQUESTS_PATH}?${qs}` : REQUESTS_PATH;
    leaveLog.info('data_source', `GET ${path}`);
    return this.http.get<LeaveRequestsResponseDto>(path);
  }

  async createLeaveRequest(data: CreateLeaveRequestDto): Promise<LeaveRequestDto> {
    leaveLog.info(
      'data_source',
      `POST ${REQUESTS_PATH} (leaveType=${data.leaveType}, from=${data.fromDate}, to=${data.toDate})`,
    );
    return this.http.post<LeaveRequestDto>(REQUESTS_PATH, data);
  }
}

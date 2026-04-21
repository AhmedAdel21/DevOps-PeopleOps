import type { HttpClient } from '@/data/data_sources/http';
import type {
  LeaveBalancesResponseDto,
  LeaveRequestsResponseDto,
  LeaveRequestDto,
  CreateLeaveRequestDto,
  PermissionRequestDto,
  PermissionRequestsResponseDto,
  CreatePermissionRequestDto,
} from '@/data/dtos/leave';
import { leaveLog } from '@/core/logger';
import { AppConfig } from '@/di/config';

const BALANCES_PATH    = '/api/leave/balances';
const REQUESTS_PATH    = '/api/leave/requests';
const PERMISSIONS_PATH = '/api/leave/permissions';

// ── Mock helpers ─────────────────────────────────────────────────────────────

const mockDelay = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, AppConfig.MOCK_DELAY_MS));

let mockRequestIdCounter = 100;
let mockPermissionIdCounter = 200;

const MOCK_BALANCES: LeaveBalancesResponseDto = {
  items: [
    { leaveType: 'Annual',        remaining: 12, used: 6,  total: 18, unlimited: false },
    { leaveType: 'Casual',        remaining: 3,  used: 3,  total: 6,  unlimited: false },
    { leaveType: 'Sick',          remaining: null, used: null, total: null, unlimited: true },
    { leaveType: 'Compassionate', remaining: 3,  used: 0,  total: 3,  unlimited: false },
    { leaveType: 'Unpaid',        remaining: null, used: null, total: null, unlimited: true },
    { leaveType: 'Hajj',          remaining: 15, used: 0,  total: 15, unlimited: false },
    { leaveType: 'Marriage',      remaining: 5,  used: 0,  total: 5,  unlimited: false },
  ],
  permissionQuota: {
    permissionsUsed: 1,
    permissionsAllowed: 2,
    monthResetsAt: '2026-05-01',
  },
};

const MOCK_REQUESTS: LeaveRequestDto[] = [
  {
    id: 'req-1',
    leaveType: 'Annual',
    fromDate: '2026-03-10',
    toDate: '2026-03-14',
    durationDays: 5,
    status: 'Approved',
  },
  {
    id: 'req-2',
    leaveType: 'Sick',
    fromDate: '2026-02-20',
    toDate: '2026-02-21',
    durationDays: 2,
    status: 'Approved',
  },
  {
    id: 'req-3',
    leaveType: 'Casual',
    fromDate: '2026-04-28',
    toDate: '2026-04-28',
    durationDays: 1,
    status: 'Pending',
  },
  {
    id: 'req-4',
    leaveType: 'Compassionate',
    fromDate: '2026-01-15',
    toDate: '2026-01-17',
    durationDays: 3,
    status: 'Approved',
  },
  {
    id: 'req-5',
    leaveType: 'Annual',
    fromDate: '2026-05-05',
    toDate: '2026-05-08',
    durationDays: 4,
    status: 'Rejected',
  },
];

const MOCK_PERMISSIONS: PermissionRequestDto[] = [
  {
    id: 'perm-1',
    permissionType: 'Late',
    date: '2026-04-10',
    startTime: '08:00',
    endTime: '09:30',
    durationMinutes: 90,
    status: 'Approved',
  },
  {
    id: 'perm-2',
    permissionType: 'Early',
    date: '2026-04-17',
    startTime: '15:00',
    endTime: '17:00',
    durationMinutes: 120,
    status: 'Pending',
  },
];

// ── Data source ──────────────────────────────────────────────────────────────

export class LeaveRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async getLeaveBalances(): Promise<LeaveBalancesResponseDto> {
    if (AppConfig.USE_MOCK) {
      leaveLog.info('data_source', `[MOCK] GET ${BALANCES_PATH}`);
      await mockDelay();
      return MOCK_BALANCES;
    }
    leaveLog.info('data_source', `GET ${BALANCES_PATH}`);
    return this.http.get<LeaveBalancesResponseDto>(BALANCES_PATH);
  }

  async getLeaveRequests(params: {
    cursor?: string;
    pageSize?: number;
  }): Promise<LeaveRequestsResponseDto> {
    if (AppConfig.USE_MOCK) {
      leaveLog.info('data_source', `[MOCK] GET ${REQUESTS_PATH}`);
      await mockDelay();
      return { items: MOCK_REQUESTS, nextCursor: null };
    }
    const query = new URLSearchParams();
    if (params.pageSize !== undefined) query.set('pageSize', params.pageSize.toString());
    if (params.cursor !== undefined)   query.set('cursor', params.cursor);
    const qs   = query.toString();
    const path = qs ? `${REQUESTS_PATH}?${qs}` : REQUESTS_PATH;
    leaveLog.info('data_source', `GET ${path}`);
    return this.http.get<LeaveRequestsResponseDto>(path);
  }

  async createLeaveRequest(data: CreateLeaveRequestDto): Promise<LeaveRequestDto> {
    if (AppConfig.USE_MOCK) {
      leaveLog.info('data_source', `[MOCK] POST ${REQUESTS_PATH}`);
      await mockDelay();
      const id = `req-mock-${++mockRequestIdCounter}`;
      return {
        id,
        leaveType: data.leaveType,
        fromDate: data.fromDate,
        toDate: data.toDate,
        durationDays: 1,
        status: 'Pending',
      };
    }
    leaveLog.info(
      'data_source',
      `POST ${REQUESTS_PATH} (leaveType=${data.leaveType}, from=${data.fromDate}, to=${data.toDate})`,
    );
    return this.http.post<LeaveRequestDto>(REQUESTS_PATH, data);
  }

  async getPermissionRequests(params: {
    cursor?: string;
    pageSize?: number;
  }): Promise<PermissionRequestsResponseDto> {
    if (AppConfig.USE_MOCK) {
      leaveLog.info('data_source', `[MOCK] GET ${PERMISSIONS_PATH}`);
      await mockDelay();
      return { items: MOCK_PERMISSIONS, nextCursor: null };
    }
    const query = new URLSearchParams();
    if (params.pageSize !== undefined) query.set('pageSize', params.pageSize.toString());
    if (params.cursor !== undefined)   query.set('cursor', params.cursor);
    const qs   = query.toString();
    const path = qs ? `${PERMISSIONS_PATH}?${qs}` : PERMISSIONS_PATH;
    leaveLog.info('data_source', `GET ${path}`);
    return this.http.get<PermissionRequestsResponseDto>(path);
  }

  async createPermissionRequest(data: CreatePermissionRequestDto): Promise<PermissionRequestDto> {
    if (AppConfig.USE_MOCK) {
      leaveLog.info('data_source', `[MOCK] POST ${PERMISSIONS_PATH}`);
      await mockDelay();
      const id = `perm-mock-${++mockPermissionIdCounter}`;
      return {
        id,
        permissionType: data.permissionType,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: 60,
        status: 'Pending',
      };
    }
    leaveLog.info(
      'data_source',
      `POST ${PERMISSIONS_PATH} (permissionType=${data.permissionType}, date=${data.date})`,
    );
    return this.http.post<PermissionRequestDto>(PERMISSIONS_PATH, data);
  }
}

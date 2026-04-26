import type { HttpClient } from '@/data/data_sources/http';
import type {
  AdminLeaveRequestsPageDto,
  CreatePermissionRequestDto,
  LeaveBalancesResponseDto,
  LeaveRequestDetailDto,
  LeaveRequestsPageDto,
  LeaveTypeSummaryDto,
  PermissionQuotaDto,
  PermissionRequestDto,
  PermissionRequestsResponseDto,
  ReviewLeaveRequestDto,
  SubmitLeaveRequestDto,
  SubmitLeaveRequestSuccessDto,
} from '@/data/dtos/leave';
import { leaveLog } from '@/core/logger';
import { AppConfig } from '@/di/config';

// ── Paths ────────────────────────────────────────────────────────────────────

const LEAVE_TYPES_PATH   = '/api/vacations/leave-types';
const BALANCES_PATH      = '/api/vacations/balances';
const VACATIONS_PATH     = '/api/vacations';
const ADMIN_VACATIONS    = '/api/admin/vacations';
const PERMISSIONS_PATH       = '/api/leave/permissions';
const PERMISSIONS_QUOTA_PATH = '/api/leave/permissions/quota';

// ── Mock helpers ─────────────────────────────────────────────────────────────

const mockDelay = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, AppConfig.MOCK_DELAY_MS));

let mockPermissionIdCounter = 200;

const MOCK_LEAVE_TYPES: LeaveTypeSummaryDto[] = [
  { leaveTypeId: 1, nameEn: 'Annual Leave',       nameAr: 'إجازة سنوية',   colorHex: '#4CAF50', requiresMedicalCertificate: false, isOncePerCareer: false, maxConsecutiveDays: null, allowSameDay: false },
  { leaveTypeId: 2, nameEn: 'Casual Leave',       nameAr: 'إجازة عارضة',   colorHex: '#2196F3', requiresMedicalCertificate: false, isOncePerCareer: false, maxConsecutiveDays: 3,    allowSameDay: true  },
  { leaveTypeId: 3, nameEn: 'Sick Leave',         nameAr: 'إجازة مرضية',   colorHex: '#F44336', requiresMedicalCertificate: true,  isOncePerCareer: false, maxConsecutiveDays: null, allowSameDay: true  },
  { leaveTypeId: 4, nameEn: 'Unpaid Leave',       nameAr: 'إجازة بدون راتب', colorHex: '#9E9E9E', requiresMedicalCertificate: false, isOncePerCareer: false, maxConsecutiveDays: null, allowSameDay: false },
  { leaveTypeId: 5, nameEn: 'Maternity Leave',    nameAr: 'إجازة أمومة',    colorHex: '#E91E63', requiresMedicalCertificate: true,  isOncePerCareer: true,  maxConsecutiveDays: 90,   allowSameDay: false },
  { leaveTypeId: 6, nameEn: 'Bereavement Leave',  nameAr: 'إجازة عزاء',     colorHex: '#607D8B', requiresMedicalCertificate: false, isOncePerCareer: false, maxConsecutiveDays: 3,    allowSameDay: true  },
  { leaveTypeId: 7, nameEn: 'Marriage Leave',     nameAr: 'إجازة زواج',     colorHex: '#FF9800', requiresMedicalCertificate: false, isOncePerCareer: true,  maxConsecutiveDays: 5,    allowSameDay: false },
  { leaveTypeId: 8, nameEn: 'Hajj Leave',         nameAr: 'إجازة حج',       colorHex: '#795548', requiresMedicalCertificate: false, isOncePerCareer: true,  maxConsecutiveDays: 15,   allowSameDay: false },
];

const MOCK_BALANCES: LeaveBalancesResponseDto = {
  year: new Date().getFullYear(),
  balances: [
    { leaveTypeId: 1, leaveTypeName: 'Annual Leave',      colorHex: '#4CAF50', isUnlimited: false, totalEntitlement: 21, usedDays: 5, remainingDays: 16 },
    { leaveTypeId: 2, leaveTypeName: 'Casual Leave',      colorHex: '#2196F3', isUnlimited: false, totalEntitlement: 6,  usedDays: 3, remainingDays: 3 },
    { leaveTypeId: 3, leaveTypeName: 'Sick Leave',        colorHex: '#F44336', isUnlimited: true,  totalEntitlement: 0,  usedDays: 0, remainingDays: 0 },
    { leaveTypeId: 6, leaveTypeName: 'Bereavement Leave', colorHex: '#607D8B', isUnlimited: false, totalEntitlement: 3,  usedDays: 0, remainingDays: 3 },
    { leaveTypeId: 7, leaveTypeName: 'Marriage Leave',    colorHex: '#FF9800', isUnlimited: false, totalEntitlement: 5,  usedDays: 0, remainingDays: 5 },
    { leaveTypeId: 8, leaveTypeName: 'Hajj Leave',        colorHex: '#795548', isUnlimited: false, totalEntitlement: 15, usedDays: 0, remainingDays: 15 },
  ],
};

const MOCK_PERMISSIONS: PermissionRequestDto[] = [
  { id: 'perm-1', permissionType: 'Late',  date: '2026-04-10', startTime: '08:00', endTime: '09:30', durationMinutes: 90,  status: 'Approved' },
  { id: 'perm-2', permissionType: 'Early', date: '2026-04-17', startTime: '15:00', endTime: '17:00', durationMinutes: 120, status: 'Pending' },
];

// ── Data source ──────────────────────────────────────────────────────────────

export class LeaveRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  // ── Available leave types ──────────────────────────────────────────────────

  async getAvailableLeaveTypes(startDate: string): Promise<LeaveTypeSummaryDto[]> {
    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] GET ${LEAVE_TYPES_PATH}?startDate=${startDate}`);
      await mockDelay();
      return MOCK_LEAVE_TYPES;
    }
    const path = `${LEAVE_TYPES_PATH}?startDate=${encodeURIComponent(startDate)}`;
    leaveLog.info('data_source', `GET ${path}`);
    return this.http.get<LeaveTypeSummaryDto[]>(path);
  }

  // ── Balances ───────────────────────────────────────────────────────────────

  async getLeaveBalances(year?: number): Promise<LeaveBalancesResponseDto> {
    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] GET ${BALANCES_PATH}${year ? `?year=${year}` : ''}`);
      await mockDelay();
      return MOCK_BALANCES;
    }
    const path = year !== undefined ? `${BALANCES_PATH}?year=${year}` : BALANCES_PATH;
    leaveLog.info('data_source', `GET ${path}`);
    return this.http.get<LeaveBalancesResponseDto>(path);
  }

  // ── Employee list ──────────────────────────────────────────────────────────

  async getMyLeaveRequests(params: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<LeaveRequestsPageDto> {
    const qs = buildLeaveRequestsQuery(params);
    const path = qs ? `${VACATIONS_PATH}?${qs}` : VACATIONS_PATH;

    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] GET ${path}`);
      await mockDelay();
      return { items: [], totalCount: 0, page: params.page ?? 1, pageSize: params.pageSize ?? 20 };
    }
    leaveLog.info('data_source', `GET ${path}`);
    return this.http.get<LeaveRequestsPageDto>(path);
  }

  async getLeaveRequestDetail(id: string): Promise<LeaveRequestDetailDto> {
    const path = `${VACATIONS_PATH}/${encodeURIComponent(id)}`;
    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] GET ${path}`);
      await mockDelay();
      throw new Error('Mock leave detail not implemented');
    }
    leaveLog.info('data_source', `GET ${path}`);
    return this.http.get<LeaveRequestDetailDto>(path);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async submitLeaveRequest(data: SubmitLeaveRequestDto): Promise<SubmitLeaveRequestSuccessDto> {
    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] POST ${VACATIONS_PATH}`);
      await mockDelay();
      return {
        leaveRequestId: `req-mock-${Date.now()}`,
        hasWeekendWarning: false,
        hasAttendanceConflictWarning: false,
        conflictDetails: null,
      };
    }
    leaveLog.info(
      'data_source',
      `POST ${VACATIONS_PATH} (typeId=${data.leaveTypeId}, ${data.startDate}→${data.endDate})`,
    );
    return this.http.post<SubmitLeaveRequestSuccessDto>(VACATIONS_PATH, data);
  }

  async cancelLeaveRequest(id: string): Promise<void> {
    const path = `${VACATIONS_PATH}/${encodeURIComponent(id)}/cancel`;
    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] DELETE ${path}`);
      await mockDelay();
      return;
    }
    leaveLog.info('data_source', `DELETE ${path}`);
    await this.http.delete<void>(path);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  async adminGetLeaveRequests(params: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AdminLeaveRequestsPageDto> {
    const qs = buildLeaveRequestsQuery(params);
    const path = qs ? `${ADMIN_VACATIONS}?${qs}` : ADMIN_VACATIONS;

    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] GET ${path}`);
      await mockDelay();
      return { items: [], totalCount: 0, page: params.page ?? 1, pageSize: params.pageSize ?? 20 };
    }
    leaveLog.info('data_source', `GET ${path}`);
    return this.http.get<AdminLeaveRequestsPageDto>(path);
  }

  async adminApproveLeaveRequest(id: string, body: ReviewLeaveRequestDto): Promise<void> {
    const path = `${ADMIN_VACATIONS}/${encodeURIComponent(id)}/approve`;
    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] PUT ${path}`);
      await mockDelay();
      return;
    }
    leaveLog.info('data_source', `PUT ${path}`);
    await this.http.put<void>(path, body);
  }

  async adminRejectLeaveRequest(id: string, body: ReviewLeaveRequestDto): Promise<void> {
    const path = `${ADMIN_VACATIONS}/${encodeURIComponent(id)}/reject`;
    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] PUT ${path}`);
      await mockDelay();
      return;
    }
    leaveLog.info('data_source', `PUT ${path}`);
    await this.http.put<void>(path, body);
  }

  // ── Permissions ────────────────────────────────────────────────────────────

  async getPermissionQuota(): Promise<PermissionQuotaDto> {
    if (AppConfig.USE_MOCK_PERMISSIONS) {
      leaveLog.info('data_source', `[MOCK] GET ${PERMISSIONS_QUOTA_PATH}`);
      await mockDelay();
      // Mock falls through to repo impl's static value when this is called;
      // shape kept identical so the live → mock flip stays seamless.
      return { permissionsUsed: 1, permissionsAllowed: 2, monthResetsAt: '' };
    }
    leaveLog.info('data_source', `GET ${PERMISSIONS_QUOTA_PATH}`);
    return this.http.get<PermissionQuotaDto>(PERMISSIONS_QUOTA_PATH);
  }

  async getPermissionRequests(params: {
    cursor?: string;
    pageSize?: number;
  }): Promise<PermissionRequestsResponseDto> {
    if (AppConfig.USE_MOCK_PERMISSIONS) {
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
    if (AppConfig.USE_MOCK_PERMISSIONS) {
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

// ── Helpers ─────────────────────────────────────────────────────────────────

const buildLeaveRequestsQuery = (params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): string => {
  const q = new URLSearchParams();
  if (params.status)   q.set('status', params.status);
  if (params.page)     q.set('page', params.page.toString());
  if (params.pageSize) q.set('pageSize', params.pageSize.toString());
  return q.toString();
};

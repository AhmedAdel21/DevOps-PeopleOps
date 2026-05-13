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
  SubmitLeaveRequestSuccessDto,
  PermissionTypeIdDto,
  SubmitPermissionResultDto,
} from '@/data/dtos/leave';
import { leaveLog } from '@/core/logger';
import { AppConfig } from '@/di/config';

// ── Paths ────────────────────────────────────────────────────────────────────

const LEAVE_TYPES_PATH       = '/api/v1/vacations/leave-types';
const BALANCES_PATH          = '/api/v1/vacations/balances';
const VACATIONS_PATH         = '/api/v1/vacations';
const ADMIN_VACATIONS        = '/api/v1/admin/vacations';
const PERMISSIONS_PATH       = '/api/v1/leave/permissions';
const PERMISSIONS_QUOTA_PATH = '/api/v1/leave/permissions/quota';

// ── User-friendly request shapes (mobile-side input) ────────────────────────

/** Repository-facing submit input — gets converted to the BE's LeaveRequestModel
 *  shape inside this data source. The repo keeps the legacy field names. */
export interface SubmitLeaveRequestInput {
  leaveTypeId: number;
  startDate: string;          // yyyy-MM-dd
  endDate: string;            // yyyy-MM-dd
  notes?: string;             // dropped on the wire (BE has no notes field)
  attachmentIds?: string[];   // dropped on the wire (BE has no link)
}

export interface CreatePermissionInput {
  permissionType: 'Late' | 'Early' | 'MiddleDay' | 'HalfDay';
  date: string;       // yyyy-MM-dd
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  notes?: string;
  attachmentIds?: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Inclusive days between two yyyy-MM-dd dates. Matches BE Period semantics
 *  in LeaveRequestService.SubmitMyLeave (totalDays = end - start + 1). */
const daysBetween = (startIso: string, endIso: string): number => {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / 86_400_000) + 1;
};

/** BE PermissionTypeEnum mapping. Mobile's 'MiddleDay'/'HalfDay' aren't
 *  supported by the new BE — fall back to 'Late' so the POST doesn't 400. */
const permissionTypeToId = (t: string): PermissionTypeIdDto => {
  switch (t) {
    case 'Late':   return 1;  // LateAttendance
    case 'Early':  return 2;  // EarlyLeave
    default:
      leaveLog.warn('data_source', `Unsupported permissionType "${t}" — sending as Late.`);
      return 1;
  }
};

/** "HH:mm" delta as fractional hours, e.g. 09:00 → 11:30 = 2.5. */
const hoursBetween = (startHHmm: string, endHHmm: string): number => {
  const [sh, sm] = startHHmm.split(':').map(Number);
  const [eh, em] = endHHmm.split(':').map(Number);
  const minutes = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0.5, Math.round((minutes / 60) * 10) / 10);
};

// ── Mock helpers ─────────────────────────────────────────────────────────────

const mockDelay = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, AppConfig.MOCK_DELAY_MS));

let mockPermissionIdCounter = 200;

const MOCK_LEAVE_TYPES: LeaveTypeSummaryDto[] = [
  { leaveTypeId: 2, nameEn: 'AnnualVacation', isUnlimited: false, allowSameDay: false, allowPastDate: false, remainingDays: 16 },
  { leaveTypeId: 1, nameEn: 'UrgentVacation', isUnlimited: false, allowSameDay: true,  allowPastDate: false, remainingDays: 3  },
  { leaveTypeId: 3, nameEn: 'SickVacation',   isUnlimited: true,  allowSameDay: true,  allowPastDate: true,  remainingDays: null },
];

const MOCK_BALANCES: LeaveBalancesResponseDto = {
  year: new Date().getFullYear(),
  balances: [
    { leaveTypeId: 2, leaveTypeName: 'AnnualVacation', isUnlimited: false, remainingDays: 16 },
    { leaveTypeId: 1, leaveTypeName: 'UrgentVacation', isUnlimited: false, remainingDays: 3  },
    { leaveTypeId: 3, leaveTypeName: 'SickVacation',   isUnlimited: true,  remainingDays: 0  },
  ],
};

const mockEmpty = <T,>(): {
  data: T[];
  pagination: { currentPage: number; pageSize: number; rowCount: number };
} => ({ data: [], pagination: { currentPage: 1, pageSize: 20, rowCount: 0 } });

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
    const qs = buildVacationsQuery(params);
    const path = qs ? `${VACATIONS_PATH}?${qs}` : VACATIONS_PATH;

    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] GET ${path}`);
      await mockDelay();
      return mockEmpty<LeaveRequestDetailDto>() as unknown as LeaveRequestsPageDto;
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

  async submitLeaveRequest(input: SubmitLeaveRequestInput): Promise<SubmitLeaveRequestSuccessDto> {
    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] POST ${VACATIONS_PATH}`);
      await mockDelay();
      return {
        success: true,
        leaveRequestId: Date.now(),
        errorCode: null,
        errorMessage: null,
        remainingBalance: null,
        conflictingDates: null,
        hasWeekendWarning: false,
      };
    }
    // Convert mobile-friendly input → BE's LeaveRequestModel shape.
    const period = daysBetween(input.startDate, input.endDate);
    const body = {
      leaveTypeId: input.leaveTypeId,
      fromDateTime: `${input.startDate}T00:00:00`,
      period,
    };
    leaveLog.info(
      'data_source',
      `POST ${VACATIONS_PATH} (typeId=${body.leaveTypeId}, fromDateTime=${body.fromDateTime}, period=${body.period})`,
    );
    return this.http.post<SubmitLeaveRequestSuccessDto>(VACATIONS_PATH, body);
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
    const qs = buildVacationsQuery(params);
    const path = qs ? `${ADMIN_VACATIONS}?${qs}` : ADMIN_VACATIONS;

    if (AppConfig.USE_MOCK_LEAVE) {
      leaveLog.info('data_source', `[MOCK] GET ${path}`);
      await mockDelay();
      return mockEmpty<LeaveRequestDetailDto>() as unknown as AdminLeaveRequestsPageDto;
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
      return { year: 0, month: 0, maxHoursPerMonth: 2, usedHours: 1, remainingHours: 1 };
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
      return {
        data: [],
        pagination: { currentPage: 1, pageSize: params.pageSize ?? 20, rowCount: 0 },
      };
    }
    // Cursor is the next page number encoded as a string. First call →
    // no cursor → page 1.
    const pageNumber = params.cursor ? parseInt(params.cursor, 10) : 1;
    const query = new URLSearchParams();
    query.set('pageNumber', pageNumber.toString());
    if (params.pageSize !== undefined) query.set('pageSize', params.pageSize.toString());
    const path = `${PERMISSIONS_PATH}?${query.toString()}`;
    leaveLog.info('data_source', `GET ${path}`);
    return this.http.get<PermissionRequestsResponseDto>(path);
  }

  async createPermissionRequest(input: CreatePermissionInput): Promise<PermissionRequestDto> {
    if (AppConfig.USE_MOCK_PERMISSIONS) {
      leaveLog.info('data_source', `[MOCK] POST ${PERMISSIONS_PATH}`);
      await mockDelay();
      const id = ++mockPermissionIdCounter;
      const hours = hoursBetween(input.startTime, input.endTime);
      return {
        id,
        permissionTypeId: permissionTypeToId(input.permissionType),
        permissionTypeName: input.permissionType === 'Early' ? 'EarlyLeave' : 'LateAttendance',
        permissionStatusId: 1,
        permissionStatusName: 'Pending',
        requestStatusId: 1,
        requestStatusName: 'New',
        fromDate: `${input.date}T${input.startTime}:00`,
        toDate: `${input.date}T${input.endTime}:00`,
        period: hours,
        employeeId: 0,
        employeeName: '',
        isClosed: false,
        assignedToId: null,
        assignedUserName: null,
        createdDate: new Date().toISOString(),
        createdBy: null,
        updatedDate: null,
        updatedBy: null,
      };
    }
    const body: CreatePermissionRequestDto = {
      permissionTypeId: permissionTypeToId(input.permissionType),
      fromDateTime: `${input.date}T${input.startTime}:00`,
      period: hoursBetween(input.startTime, input.endTime),
    };
    leaveLog.info(
      'data_source',
      `POST ${PERMISSIONS_PATH} (typeId=${body.permissionTypeId}, fromDateTime=${body.fromDateTime}, period=${body.period}h)`,
    );
    // BE wraps result; the repository reads it as a PermissionRequestDto via the
    // SubmitPermissionResult shape. Re-fetching the row by id would be the
    // correct path; this convenience cast keeps the existing repo flow
    // working until repo is updated.
    const result = await this.http.post<SubmitPermissionResultDto>(PERMISSIONS_PATH, body);
    return {
      id: result.permissionRequestId,
      permissionTypeId: body.permissionTypeId,
      permissionTypeName: body.permissionTypeId === 1 ? 'LateAttendance' : 'EarlyLeave',
      permissionStatusId: 1,
      permissionStatusName: 'Pending',
      requestStatusId: 1,
      requestStatusName: 'New',
      fromDate: body.fromDateTime,
      toDate: `${input.date}T${input.endTime}:00`,
      period: body.period,
      employeeId: 0,
      employeeName: '',
      isClosed: false,
      assignedToId: null,
      assignedUserName: null,
      createdDate: new Date().toISOString(),
      createdBy: null,
      updatedDate: null,
      updatedBy: null,
    };
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const buildVacationsQuery = (params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): string => {
  const q = new URLSearchParams();
  if (params.status)   q.set('status', params.status);
  if (params.page)     q.set('pageNumber', params.page.toString());  // BE expects pageNumber
  if (params.pageSize) q.set('pageSize', params.pageSize.toString());
  return q.toString();
};

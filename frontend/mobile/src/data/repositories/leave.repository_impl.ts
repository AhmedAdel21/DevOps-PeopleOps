import type {
  AdminLeaveRequestsPage,
  LeaveBalancesSummary,
  LeaveRequestDetail,
  LeaveRequestsPage,
  LeaveTypeMeta,
  PermissionQuota,
  PermissionRequest,
  PermissionRequestsPage,
  SubmitLeaveResult,
} from '@/domain/entities';
import type {
  CancelLeaveRequestParams,
  CancelPermissionRequestParams,
  GetAvailableLeaveTypesParams,
  GetLeaveBalancesParams,
  GetLeaveRequestDetailParams,
  GetLeaveRequestsParams,
  GetPermissionRequestDetailParams,
  GetPermissionRequestsParams,
  LeaveRepository,
  RequestPermissionParams,
  ReviewLeaveRequestParams,
  SubmitLeaveRequestParams,
} from '@/domain/repositories';
import { LeaveRemoteDataSource } from '@/data/data_sources/leave';
import {
  adminLeaveRequestsPageDtoToDomain,
  leaveBalancesResponseDtoToDomain,
  leaveRequestDetailDtoToDomain,
  leaveRequestsPageDtoToDomain,
  leaveTypeSummaryDtoToDomain,
  mapHttpErrorToLeave,
  MOCK_PERMISSION_QUOTA,
  permissionRequestDtoToDomain,
  permissionRequestsResponseDtoToDomain,
  submitLeaveRequestSuccessDtoToDomain,
} from '@/data/mappers/leave';
import { leaveLog } from '@/core/logger';
import { AppConfig } from '@/di/config';

export class LeaveRepositoryImpl implements LeaveRepository {
  constructor(private readonly ds: LeaveRemoteDataSource) {}

  // ── Leave types ────────────────────────────────────────────────────────────

  async getAvailableLeaveTypes(
    params: GetAvailableLeaveTypesParams,
  ): Promise<LeaveTypeMeta[]> {
    leaveLog.info('repository', `getAvailableLeaveTypes called (startDate=${params.startDate})`);
    try {
      const dtos = await this.ds.getAvailableLeaveTypes(params.startDate);
      const result = dtos.map(leaveTypeSummaryDtoToDomain);
      leaveLog.info('repository', `getAvailableLeaveTypes → ${result.length} types`);
      return result;
    } catch (e) {
      throw mapAndLog(e, 'getAvailableLeaveTypes');
    }
  }

  // ── Balances ───────────────────────────────────────────────────────────────

  async getLeaveBalances(
    params: GetLeaveBalancesParams,
  ): Promise<LeaveBalancesSummary> {
    leaveLog.info('repository', `getLeaveBalances called (year=${params.year ?? 'current'})`);
    try {
      const dto = await this.ds.getLeaveBalances(params.year);
      const result = leaveBalancesResponseDtoToDomain(dto);
      leaveLog.info(
        'repository',
        `getLeaveBalances → year=${result.year}, ${result.balances.length} balances`,
      );
      return result;
    } catch (e) {
      throw mapAndLog(e, 'getLeaveBalances');
    }
  }

  // ── Employee list + detail ─────────────────────────────────────────────────

  async getLeaveRequests(params: GetLeaveRequestsParams): Promise<LeaveRequestsPage> {
    leaveLog.info(
      'repository',
      `getLeaveRequests called (status=${params.status ?? 'all'}, page=${params.page ?? 1})`,
    );
    try {
      const dto = await this.ds.getMyLeaveRequests({
        status: params.status,
        page: params.page,
        pageSize: params.pageSize,
      });
      const page = leaveRequestsPageDtoToDomain(dto);
      leaveLog.info(
        'repository',
        `getLeaveRequests → ${page.items.length}/${page.totalCount} items`,
      );
      return page;
    } catch (e) {
      throw mapAndLog(e, 'getLeaveRequests');
    }
  }

  async getLeaveRequestDetail(
    params: GetLeaveRequestDetailParams,
  ): Promise<LeaveRequestDetail> {
    leaveLog.info('repository', `getLeaveRequestDetail called (id=${params.leaveRequestId})`);
    try {
      const dto = await this.ds.getLeaveRequestDetail(params.leaveRequestId);
      const entity = leaveRequestDetailDtoToDomain(dto);
      leaveLog.info('repository', `getLeaveRequestDetail → status=${entity.status}`);
      return entity;
    } catch (e) {
      throw mapAndLog(e, 'getLeaveRequestDetail');
    }
  }

  // ── Submit + cancel ────────────────────────────────────────────────────────

  async submitLeaveRequest(params: SubmitLeaveRequestParams): Promise<SubmitLeaveResult> {
    leaveLog.info(
      'repository',
      `submitLeaveRequest called (typeId=${params.leaveTypeId}, ${params.startDate}→${params.endDate})`,
    );
    try {
      const dto = await this.ds.submitLeaveRequest({
        leaveTypeId: params.leaveTypeId,
        startDate: params.startDate,
        endDate: params.endDate,
        notes: params.notes,
        attachmentIds: params.attachmentIds,
      });
      // BE returns the same shape for 201 and 422; the http layer only
      // throws on 422 via HttpError. On success we use the result as-is.
      if (!dto.success) {
        leaveLog.error(
          'repository',
          `submitLeaveRequest → BE returned success=false (${dto.errorCode}): ${dto.errorMessage}`,
        );
        throw new Error(dto.errorMessage ?? dto.errorCode ?? 'Submit failed');
      }
      const result = submitLeaveRequestSuccessDtoToDomain(dto);
      leaveLog.info('repository', `submitLeaveRequest → id=${result.leaveRequestId}`);
      return result;
    } catch (e) {
      throw mapAndLog(e, 'submitLeaveRequest');
    }
  }

  async cancelLeaveRequest(params: CancelLeaveRequestParams): Promise<void> {
    leaveLog.info('repository', `cancelLeaveRequest called (id=${params.leaveRequestId})`);
    try {
      await this.ds.cancelLeaveRequest(params.leaveRequestId);
      leaveLog.info('repository', `cancelLeaveRequest → ok`);
    } catch (e) {
      throw mapAndLog(e, 'cancelLeaveRequest');
    }
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  async adminGetLeaveRequests(
    params: GetLeaveRequestsParams,
  ): Promise<AdminLeaveRequestsPage> {
    leaveLog.info(
      'repository',
      `adminGetLeaveRequests called (status=${params.status ?? 'all'}, page=${params.page ?? 1})`,
    );
    try {
      const dto = await this.ds.adminGetLeaveRequests({
        status: params.status,
        page: params.page,
        pageSize: params.pageSize,
      });
      const page = adminLeaveRequestsPageDtoToDomain(dto);
      leaveLog.info(
        'repository',
        `adminGetLeaveRequests → ${page.items.length}/${page.totalCount} items`,
      );
      return page;
    } catch (e) {
      throw mapAndLog(e, 'adminGetLeaveRequests');
    }
  }

  async adminApproveLeaveRequest(params: ReviewLeaveRequestParams): Promise<void> {
    leaveLog.info('repository', `adminApproveLeaveRequest called (id=${params.leaveRequestId})`);
    try {
      await this.ds.adminApproveLeaveRequest(params.leaveRequestId, {
        reviewerComment: params.reviewerComment,
      });
      leaveLog.info('repository', `adminApproveLeaveRequest → ok`);
    } catch (e) {
      throw mapAndLog(e, 'adminApproveLeaveRequest');
    }
  }

  async adminRejectLeaveRequest(params: ReviewLeaveRequestParams): Promise<void> {
    leaveLog.info('repository', `adminRejectLeaveRequest called (id=${params.leaveRequestId})`);
    try {
      await this.ds.adminRejectLeaveRequest(params.leaveRequestId, {
        reviewerComment: params.reviewerComment,
      });
      leaveLog.info('repository', `adminRejectLeaveRequest → ok`);
    } catch (e) {
      throw mapAndLog(e, 'adminRejectLeaveRequest');
    }
  }

  // ── Permission ─────────────────────────────────────────────────────────────

  async getPermissionQuota(): Promise<PermissionQuota | null> {
    if (AppConfig.USE_MOCK_PERMISSIONS) {
      leaveLog.info('repository', 'getPermissionQuota called (mock)');
      return MOCK_PERMISSION_QUOTA;
    }
    leaveLog.info('repository', 'getPermissionQuota called');
    try {
      const dto = await this.ds.getPermissionQuota();
      // BE returns hours; mobile UI thinks in "permission count". BE's
      // monthly cap is 2 hours == 2 permissions by convention, so we
      // pass the hour numbers straight through as the count. If the
      // monthly cap changes on the BE, this assumption breaks.
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const yyyy = nextMonth.getFullYear();
      const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
      return {
        permissionsUsed: dto.usedHours,
        permissionsAllowed: dto.maxHoursPerMonth,
        monthResetsAt: `${yyyy}-${mm}-01`,
      };
    } catch (e) {
      throw mapAndLog(e, 'getPermissionQuota');
    }
  }

  async getPermissionRequests(
    params: GetPermissionRequestsParams,
  ): Promise<PermissionRequestsPage> {
    leaveLog.info('repository', `getPermissionRequests called (cursor=${params.cursor ?? 'none'})`);
    try {
      const dto = await this.ds.getPermissionRequests(params);
      return permissionRequestsResponseDtoToDomain(dto);
    } catch (e) {
      throw mapAndLog(e, 'getPermissionRequests');
    }
  }

  async createPermissionRequest(params: RequestPermissionParams): Promise<PermissionRequest> {
    leaveLog.info(
      'repository',
      `createPermissionRequest called (permissionType=${params.permissionType}, date=${params.date})`,
    );
    try {
      const dto = await this.ds.createPermissionRequest(params);
      return permissionRequestDtoToDomain(dto);
    } catch (e) {
      throw mapAndLog(e, 'createPermissionRequest');
    }
  }

  async getPermissionRequestDetail(
    params: GetPermissionRequestDetailParams,
  ): Promise<PermissionRequest> {
    leaveLog.info(
      'repository',
      `getPermissionRequestDetail called (id=${params.permissionRequestId})`,
    );
    try {
      const dto = await this.ds.getPermissionRequestDetail(params.permissionRequestId);
      const entity = permissionRequestDtoToDomain(dto);
      leaveLog.info(
        'repository',
        `getPermissionRequestDetail → status=${entity.status}`,
      );
      return entity;
    } catch (e) {
      throw mapAndLog(e, 'getPermissionRequestDetail');
    }
  }

  async cancelPermissionRequest(
    params: CancelPermissionRequestParams,
  ): Promise<void> {
    leaveLog.info(
      'repository',
      `cancelPermissionRequest called (id=${params.permissionRequestId})`,
    );
    try {
      await this.ds.cancelPermissionRequest(params.permissionRequestId);
      leaveLog.info('repository', 'cancelPermissionRequest → ok');
    } catch (e) {
      throw mapAndLog(e, 'cancelPermissionRequest');
    }
  }
}

const mapAndLog = (e: unknown, label: string) => {
  const mapped = mapHttpErrorToLeave(e);
  leaveLog.error('repository', `${label} failed (code=${mapped.leaveCode})`);
  return mapped;
};

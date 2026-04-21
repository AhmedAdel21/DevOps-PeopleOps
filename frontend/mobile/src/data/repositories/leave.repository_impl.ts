import type {
  LeaveRequest,
  LeaveRequestsPage,
  PermissionRequest,
  PermissionRequestsPage,
} from '@/domain/entities';
import type {
  LeaveRepository,
  LeaveBalancesResult,
  RequestLeaveParams,
  GetLeaveRequestsParams,
  RequestPermissionParams,
  GetPermissionRequestsParams,
} from '@/domain/repositories';
import { LeaveRemoteDataSource } from '@/data/data_sources/leave';
import {
  leaveBalancesResponseDtoToDomain,
  leaveRequestDtoToDomain,
  leaveRequestsResponseDtoToDomain,
  permissionRequestDtoToDomain,
  permissionRequestsResponseDtoToDomain,
  mapHttpErrorToLeave,
} from '@/data/mappers/leave';
import { leaveLog } from '@/core/logger';

export class LeaveRepositoryImpl implements LeaveRepository {
  constructor(private readonly ds: LeaveRemoteDataSource) {}

  async getLeaveBalances(): Promise<LeaveBalancesResult> {
    leaveLog.info('repository', 'getLeaveBalances called');
    try {
      const dto = await this.ds.getLeaveBalances();
      const result = leaveBalancesResponseDtoToDomain(dto);
      leaveLog.info('repository', `getLeaveBalances → ${result.balances.length} balances`);
      return result;
    } catch (e) {
      const mapped = mapHttpErrorToLeave(e);
      leaveLog.error('repository', `getLeaveBalances failed (code=${mapped.leaveCode})`);
      throw mapped;
    }
  }

  async getLeaveRequests(params: GetLeaveRequestsParams): Promise<LeaveRequestsPage> {
    leaveLog.info(
      'repository',
      `getLeaveRequests called (cursor=${params.cursor ?? 'none'}, pageSize=${params.pageSize ?? 'default'})`,
    );
    try {
      const dto = await this.ds.getLeaveRequests(params);
      const page = leaveRequestsResponseDtoToDomain(dto);
      leaveLog.info(
        'repository',
        `getLeaveRequests → ${page.items.length} items, nextCursor=${page.nextCursor ?? 'none'}`,
      );
      return page;
    } catch (e) {
      const mapped = mapHttpErrorToLeave(e);
      leaveLog.error('repository', `getLeaveRequests failed (code=${mapped.leaveCode})`);
      throw mapped;
    }
  }

  async createLeaveRequest(params: RequestLeaveParams): Promise<LeaveRequest> {
    leaveLog.info(
      'repository',
      `createLeaveRequest called (leaveType=${params.leaveType}, from=${params.fromDate}, to=${params.toDate})`,
    );
    try {
      const dto = await this.ds.createLeaveRequest(params);
      const entity = leaveRequestDtoToDomain(dto);
      leaveLog.info('repository', `createLeaveRequest → id=${entity.id}`);
      return entity;
    } catch (e) {
      const mapped = mapHttpErrorToLeave(e);
      leaveLog.error('repository', `createLeaveRequest failed (code=${mapped.leaveCode})`);
      throw mapped;
    }
  }

  async getPermissionRequests(params: GetPermissionRequestsParams): Promise<PermissionRequestsPage> {
    leaveLog.info(
      'repository',
      `getPermissionRequests called (cursor=${params.cursor ?? 'none'})`,
    );
    try {
      const dto = await this.ds.getPermissionRequests(params);
      const page = permissionRequestsResponseDtoToDomain(dto);
      leaveLog.info(
        'repository',
        `getPermissionRequests → ${page.items.length} items, nextCursor=${page.nextCursor ?? 'none'}`,
      );
      return page;
    } catch (e) {
      const mapped = mapHttpErrorToLeave(e);
      leaveLog.error('repository', `getPermissionRequests failed (code=${mapped.leaveCode})`);
      throw mapped;
    }
  }

  async createPermissionRequest(params: RequestPermissionParams): Promise<PermissionRequest> {
    leaveLog.info(
      'repository',
      `createPermissionRequest called (permissionType=${params.permissionType}, date=${params.date})`,
    );
    try {
      const dto = await this.ds.createPermissionRequest(params);
      const entity = permissionRequestDtoToDomain(dto);
      leaveLog.info('repository', `createPermissionRequest → id=${entity.id}`);
      return entity;
    } catch (e) {
      const mapped = mapHttpErrorToLeave(e);
      leaveLog.error('repository', `createPermissionRequest failed (code=${mapped.leaveCode})`);
      throw mapped;
    }
  }
}

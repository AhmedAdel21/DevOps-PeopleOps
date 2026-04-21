import type { LeaveBalance, LeaveRequest, LeaveRequestsPage } from '@/domain/entities';
import type { LeaveRepository, RequestLeaveParams, GetLeaveRequestsParams } from '@/domain/repositories';
import { LeaveRemoteDataSource } from '@/data/data_sources/leave';
import {
  leaveBalanceDtoToDomain,
  leaveRequestDtoToDomain,
  leaveRequestsResponseDtoToDomain,
  mapHttpErrorToLeave,
} from '@/data/mappers/leave';
import { leaveLog } from '@/core/logger';

export class LeaveRepositoryImpl implements LeaveRepository {
  constructor(private readonly ds: LeaveRemoteDataSource) {}

  async getLeaveBalances(): Promise<LeaveBalance[]> {
    leaveLog.info('repository', 'getLeaveBalances called');
    try {
      const dto = await this.ds.getLeaveBalances();
      const entities = dto.items.map(leaveBalanceDtoToDomain);
      leaveLog.info('repository', `getLeaveBalances → ${entities.length} balances`);
      return entities;
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
}

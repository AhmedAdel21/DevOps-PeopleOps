import { UseCase } from '@/domain/use_cases/use_case.base';
import type { LeaveRequestsPage } from '@/domain/entities';
import type { LeaveRepository, GetLeaveRequestsParams } from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class GetLeaveRequestsUseCase extends UseCase<GetLeaveRequestsParams, LeaveRequestsPage> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: GetLeaveRequestsParams): Promise<LeaveRequestsPage> {
    leaveLog.info(
      'use_case',
      `GetLeaveRequestsUseCase.execute → cursor=${input.cursor ?? 'none'}, pageSize=${input.pageSize ?? 'default'}`,
    );
    try {
      const page = await this.repo.getLeaveRequests(input);
      leaveLog.info(
        'use_case',
        `GetLeaveRequestsUseCase completed → ${page.items.length} items, nextCursor=${page.nextCursor ?? 'none'}`,
      );
      return page;
    } catch (e) {
      leaveLog.error('use_case', 'GetLeaveRequestsUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

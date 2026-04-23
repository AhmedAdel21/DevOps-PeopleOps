import { UseCase } from '@/domain/use_cases/use_case.base';
import type { LeaveRequestsPage } from '@/domain/entities';
import type {
  GetLeaveRequestsParams,
  LeaveRepository,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class GetLeaveRequestsUseCase extends UseCase<
  GetLeaveRequestsParams,
  LeaveRequestsPage
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: GetLeaveRequestsParams): Promise<LeaveRequestsPage> {
    leaveLog.info(
      'use_case',
      `GetLeaveRequestsUseCase.execute → status=${input.status ?? 'all'}, page=${input.page ?? 1}, pageSize=${input.pageSize ?? 'default'}`,
    );
    try {
      const page = await this.repo.getLeaveRequests(input);
      leaveLog.info(
        'use_case',
        `GetLeaveRequestsUseCase completed → ${page.items.length} items (${page.totalCount} total)`,
      );
      return page;
    } catch (e) {
      leaveLog.error('use_case', 'GetLeaveRequestsUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

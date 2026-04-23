import { UseCase } from '@/domain/use_cases/use_case.base';
import type { AdminLeaveRequestsPage } from '@/domain/entities';
import type {
  GetLeaveRequestsParams,
  LeaveRepository,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class AdminGetLeaveRequestsUseCase extends UseCase<
  GetLeaveRequestsParams,
  AdminLeaveRequestsPage
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: GetLeaveRequestsParams): Promise<AdminLeaveRequestsPage> {
    leaveLog.info(
      'use_case',
      `AdminGetLeaveRequestsUseCase.execute → status=${input.status ?? 'all'}, page=${input.page ?? 1}`,
    );
    try {
      const page = await this.repo.adminGetLeaveRequests(input);
      leaveLog.info(
        'use_case',
        `AdminGetLeaveRequestsUseCase completed → ${page.items.length} items (${page.totalCount} total)`,
      );
      return page;
    } catch (e) {
      leaveLog.error('use_case', 'AdminGetLeaveRequestsUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

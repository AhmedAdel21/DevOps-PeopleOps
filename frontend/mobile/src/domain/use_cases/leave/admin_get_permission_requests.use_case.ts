import { UseCase } from '@/domain/use_cases/use_case.base';
import type { AdminPermissionRequestsPage } from '@/domain/entities';
import type {
  GetLeaveRequestsParams,
  LeaveRepository,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class AdminGetPermissionRequestsUseCase extends UseCase<
  GetLeaveRequestsParams,
  AdminPermissionRequestsPage
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(
    input: GetLeaveRequestsParams,
  ): Promise<AdminPermissionRequestsPage> {
    leaveLog.info(
      'use_case',
      `AdminGetPermissionRequestsUseCase.execute → status=${input.status ?? 'all'}, page=${input.page ?? 1}`,
    );
    try {
      const page = await this.repo.adminGetPermissionRequests(input);
      leaveLog.info(
        'use_case',
        `AdminGetPermissionRequestsUseCase completed → ${page.items.length} items (${page.totalCount} total)`,
      );
      return page;
    } catch (e) {
      leaveLog.error(
        'use_case',
        'AdminGetPermissionRequestsUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

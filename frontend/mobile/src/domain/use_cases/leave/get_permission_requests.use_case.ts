import { UseCase } from '@/domain/use_cases/use_case.base';
import type { PermissionRequestsPage } from '@/domain/entities';
import type { LeaveRepository, GetPermissionRequestsParams } from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class GetPermissionRequestsUseCase extends UseCase<GetPermissionRequestsParams, PermissionRequestsPage> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: GetPermissionRequestsParams): Promise<PermissionRequestsPage> {
    leaveLog.info(
      'use_case',
      `GetPermissionRequestsUseCase.execute → cursor=${input.cursor ?? 'none'}`,
    );
    try {
      const page = await this.repo.getPermissionRequests(input);
      leaveLog.info(
        'use_case',
        `GetPermissionRequestsUseCase completed → ${page.items.length} items, nextCursor=${page.nextCursor ?? 'none'}`,
      );
      return page;
    } catch (e) {
      leaveLog.error('use_case', 'GetPermissionRequestsUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

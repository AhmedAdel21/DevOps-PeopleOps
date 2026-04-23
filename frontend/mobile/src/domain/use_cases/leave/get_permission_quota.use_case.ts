import { UseCase } from '@/domain/use_cases/use_case.base';
import type { PermissionQuota } from '@/domain/entities';
import type { LeaveRepository } from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class GetPermissionQuotaUseCase extends UseCase<void, PermissionQuota | null> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(): Promise<PermissionQuota | null> {
    leaveLog.info('use_case', 'GetPermissionQuotaUseCase.execute →');
    try {
      const result = await this.repo.getPermissionQuota();
      leaveLog.info(
        'use_case',
        `GetPermissionQuotaUseCase completed → quota=${result ? `${result.permissionsUsed}/${result.permissionsAllowed}` : 'none'}`,
      );
      return result;
    } catch (e) {
      leaveLog.error('use_case', 'GetPermissionQuotaUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

import { UseCase } from '@/domain/use_cases/use_case.base';
import type { LeaveRepository, LeaveBalancesResult } from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class GetLeaveBalancesUseCase extends UseCase<void, LeaveBalancesResult> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(): Promise<LeaveBalancesResult> {
    leaveLog.info('use_case', 'GetLeaveBalancesUseCase.execute →');
    try {
      const result = await this.repo.getLeaveBalances();
      leaveLog.info(
        'use_case',
        `GetLeaveBalancesUseCase completed → ${result.balances.length} balances, quota=${result.permissionQuota ? `${result.permissionQuota.permissionsUsed}/${result.permissionQuota.permissionsAllowed}` : 'none'}`,
      );
      return result;
    } catch (e) {
      leaveLog.error('use_case', 'GetLeaveBalancesUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

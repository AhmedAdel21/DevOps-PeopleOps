import { UseCase } from '@/domain/use_cases/use_case.base';
import type { LeaveBalance } from '@/domain/entities';
import type { LeaveRepository } from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class GetLeaveBalancesUseCase extends UseCase<void, LeaveBalance[]> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(): Promise<LeaveBalance[]> {
    leaveLog.info('use_case', 'GetLeaveBalancesUseCase.execute →');
    try {
      const result = await this.repo.getLeaveBalances();
      leaveLog.info('use_case', `GetLeaveBalancesUseCase completed → ${result.length} balances`);
      return result;
    } catch (e) {
      leaveLog.error('use_case', 'GetLeaveBalancesUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

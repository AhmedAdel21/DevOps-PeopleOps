import { UseCase } from '@/domain/use_cases/use_case.base';
import type { LeaveBalancesSummary } from '@/domain/entities';
import type {
  GetLeaveBalancesParams,
  LeaveRepository,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class GetLeaveBalancesUseCase extends UseCase<
  GetLeaveBalancesParams,
  LeaveBalancesSummary
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: GetLeaveBalancesParams): Promise<LeaveBalancesSummary> {
    leaveLog.info(
      'use_case',
      `GetLeaveBalancesUseCase.execute → year=${input.year ?? 'current'}`,
    );
    try {
      const result = await this.repo.getLeaveBalances(input);
      leaveLog.info(
        'use_case',
        `GetLeaveBalancesUseCase completed → year=${result.year}, ${result.balances.length} balances`,
      );
      return result;
    } catch (e) {
      leaveLog.error('use_case', 'GetLeaveBalancesUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

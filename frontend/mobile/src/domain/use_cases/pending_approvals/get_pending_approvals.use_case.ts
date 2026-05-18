import { UseCase } from '@/domain/use_cases/use_case.base';
import type { PendingApprovalsPage } from '@/domain/entities';
import type {
  GetPendingApprovalsParams,
  PendingApprovalsRepository,
} from '@/domain/repositories';
import { managementLog } from '@/core/logger';

export class GetPendingApprovalsUseCase extends UseCase<
  GetPendingApprovalsParams,
  PendingApprovalsPage
> {
  constructor(private readonly repo: PendingApprovalsRepository) {
    super();
  }

  async execute(
    input: GetPendingApprovalsParams,
  ): Promise<PendingApprovalsPage> {
    managementLog.info(
      'use_case',
      `GetPendingApprovalsUseCase.execute → range=${input.range ?? 'all'}`,
    );
    try {
      const result = await this.repo.getPendingApprovals(input);
      managementLog.info(
        'use_case',
        `GetPendingApprovalsUseCase completed → ${result.pendingCount} pending`,
      );
      return result;
    } catch (e) {
      managementLog.error(
        'use_case',
        'GetPendingApprovalsUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

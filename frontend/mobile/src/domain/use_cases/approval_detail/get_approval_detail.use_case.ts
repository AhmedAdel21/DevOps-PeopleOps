import { UseCase } from '@/domain/use_cases/use_case.base';
import type { ApprovalDetail } from '@/domain/entities';
import type {
  ApprovalDetailRepository,
  GetApprovalDetailParams,
} from '@/domain/repositories';
import { managementLog } from '@/core/logger';

export class GetApprovalDetailUseCase extends UseCase<
  GetApprovalDetailParams,
  ApprovalDetail
> {
  constructor(private readonly repo: ApprovalDetailRepository) {
    super();
  }

  async execute(
    input: GetApprovalDetailParams,
  ): Promise<ApprovalDetail> {
    managementLog.info(
      'use_case',
      `GetApprovalDetailUseCase.execute → ${input.requestId}`,
    );
    try {
      const result = await this.repo.getApprovalDetail(input);
      managementLog.info(
        'use_case',
        `GetApprovalDetailUseCase completed → status=${result.status}`,
      );
      return result;
    } catch (e) {
      managementLog.error(
        'use_case',
        'GetApprovalDetailUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

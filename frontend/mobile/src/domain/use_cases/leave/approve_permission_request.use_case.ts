import { UseCase } from '@/domain/use_cases/use_case.base';
import type {
  LeaveRepository,
  ReviewLeaveRequestParams,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class ApprovePermissionRequestUseCase extends UseCase<
  ReviewLeaveRequestParams,
  void
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: ReviewLeaveRequestParams): Promise<void> {
    leaveLog.info(
      'use_case',
      `ApprovePermissionRequestUseCase.execute → id=${input.leaveRequestId}`,
    );
    try {
      await this.repo.adminApprovePermissionRequest(input);
      leaveLog.info('use_case', `ApprovePermissionRequestUseCase completed`);
    } catch (e) {
      leaveLog.error(
        'use_case',
        'ApprovePermissionRequestUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

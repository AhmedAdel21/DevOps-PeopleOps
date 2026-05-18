import { UseCase } from '@/domain/use_cases/use_case.base';
import type {
  LeaveRepository,
  ReviewLeaveRequestParams,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class RejectPermissionRequestUseCase extends UseCase<
  ReviewLeaveRequestParams,
  void
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: ReviewLeaveRequestParams): Promise<void> {
    leaveLog.info(
      'use_case',
      `RejectPermissionRequestUseCase.execute → id=${input.leaveRequestId}`,
    );
    try {
      await this.repo.adminRejectPermissionRequest(input);
      leaveLog.info('use_case', `RejectPermissionRequestUseCase completed`);
    } catch (e) {
      leaveLog.error(
        'use_case',
        'RejectPermissionRequestUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

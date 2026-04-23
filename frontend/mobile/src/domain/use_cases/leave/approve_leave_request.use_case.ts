import { UseCase } from '@/domain/use_cases/use_case.base';
import type {
  LeaveRepository,
  ReviewLeaveRequestParams,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class ApproveLeaveRequestUseCase extends UseCase<ReviewLeaveRequestParams, void> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: ReviewLeaveRequestParams): Promise<void> {
    leaveLog.info(
      'use_case',
      `ApproveLeaveRequestUseCase.execute → id=${input.leaveRequestId}`,
    );
    try {
      await this.repo.adminApproveLeaveRequest(input);
      leaveLog.info('use_case', `ApproveLeaveRequestUseCase completed`);
    } catch (e) {
      leaveLog.error('use_case', 'ApproveLeaveRequestUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

import { UseCase } from '@/domain/use_cases/use_case.base';
import type {
  LeaveRepository,
  ReviewLeaveRequestParams,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class RejectLeaveRequestUseCase extends UseCase<ReviewLeaveRequestParams, void> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: ReviewLeaveRequestParams): Promise<void> {
    leaveLog.info(
      'use_case',
      `RejectLeaveRequestUseCase.execute → id=${input.leaveRequestId}`,
    );
    try {
      await this.repo.adminRejectLeaveRequest(input);
      leaveLog.info('use_case', `RejectLeaveRequestUseCase completed`);
    } catch (e) {
      leaveLog.error('use_case', 'RejectLeaveRequestUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

import { UseCase } from '@/domain/use_cases/use_case.base';
import type {
  CancelLeaveRequestParams,
  LeaveRepository,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class CancelLeaveRequestUseCase extends UseCase<CancelLeaveRequestParams, void> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: CancelLeaveRequestParams): Promise<void> {
    leaveLog.info(
      'use_case',
      `CancelLeaveRequestUseCase.execute → id=${input.leaveRequestId}`,
    );
    try {
      await this.repo.cancelLeaveRequest(input);
      leaveLog.info('use_case', `CancelLeaveRequestUseCase completed → id=${input.leaveRequestId}`);
    } catch (e) {
      leaveLog.error('use_case', 'CancelLeaveRequestUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

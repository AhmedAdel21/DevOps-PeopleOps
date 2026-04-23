import { UseCase } from '@/domain/use_cases/use_case.base';
import type { SubmitLeaveResult } from '@/domain/entities';
import type {
  LeaveRepository,
  SubmitLeaveRequestParams,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class SubmitLeaveRequestUseCase extends UseCase<
  SubmitLeaveRequestParams,
  SubmitLeaveResult
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: SubmitLeaveRequestParams): Promise<SubmitLeaveResult> {
    leaveLog.info(
      'use_case',
      `SubmitLeaveRequestUseCase.execute → typeId=${input.leaveTypeId}, start=${input.startDate}, end=${input.endDate}`,
    );
    try {
      const result = await this.repo.submitLeaveRequest(input);
      leaveLog.info(
        'use_case',
        `SubmitLeaveRequestUseCase completed → id=${result.leaveRequestId} weekend=${result.hasWeekendWarning} attendanceConflict=${result.hasAttendanceConflictWarning}`,
      );
      return result;
    } catch (e) {
      leaveLog.error('use_case', 'SubmitLeaveRequestUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

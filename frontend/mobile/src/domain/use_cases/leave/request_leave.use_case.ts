import { UseCase } from '@/domain/use_cases/use_case.base';
import type { LeaveRequest } from '@/domain/entities';
import type { LeaveRepository, RequestLeaveParams } from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class RequestLeaveUseCase extends UseCase<RequestLeaveParams, LeaveRequest> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: RequestLeaveParams): Promise<LeaveRequest> {
    leaveLog.info(
      'use_case',
      `RequestLeaveUseCase.execute → leaveType=${input.leaveType}, from=${input.fromDate}, to=${input.toDate}`,
    );
    try {
      const result = await this.repo.createLeaveRequest(input);
      leaveLog.info('use_case', `RequestLeaveUseCase completed → id=${result.id}`);
      return result;
    } catch (e) {
      leaveLog.error('use_case', 'RequestLeaveUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

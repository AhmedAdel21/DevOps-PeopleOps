import { UseCase } from '@/domain/use_cases/use_case.base';
import type { LeaveRequestDetail } from '@/domain/entities';
import type {
  GetLeaveRequestDetailParams,
  LeaveRepository,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class GetLeaveRequestDetailUseCase extends UseCase<
  GetLeaveRequestDetailParams,
  LeaveRequestDetail
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: GetLeaveRequestDetailParams): Promise<LeaveRequestDetail> {
    leaveLog.info(
      'use_case',
      `GetLeaveRequestDetailUseCase.execute → id=${input.leaveRequestId}`,
    );
    try {
      const result = await this.repo.getLeaveRequestDetail(input);
      leaveLog.info(
        'use_case',
        `GetLeaveRequestDetailUseCase completed → status=${result.status}`,
      );
      return result;
    } catch (e) {
      leaveLog.error('use_case', 'GetLeaveRequestDetailUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

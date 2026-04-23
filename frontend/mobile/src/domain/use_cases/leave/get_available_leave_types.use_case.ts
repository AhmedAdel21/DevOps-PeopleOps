import { UseCase } from '@/domain/use_cases/use_case.base';
import type { LeaveTypeMeta } from '@/domain/entities';
import type {
  GetAvailableLeaveTypesParams,
  LeaveRepository,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class GetAvailableLeaveTypesUseCase extends UseCase<
  GetAvailableLeaveTypesParams,
  LeaveTypeMeta[]
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: GetAvailableLeaveTypesParams): Promise<LeaveTypeMeta[]> {
    leaveLog.info(
      'use_case',
      `GetAvailableLeaveTypesUseCase.execute → startDate=${input.startDate}`,
    );
    try {
      const result = await this.repo.getAvailableLeaveTypes(input);
      leaveLog.info(
        'use_case',
        `GetAvailableLeaveTypesUseCase completed → ${result.length} types`,
      );
      return result;
    } catch (e) {
      leaveLog.error('use_case', 'GetAvailableLeaveTypesUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

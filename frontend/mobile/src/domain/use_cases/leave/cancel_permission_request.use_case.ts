import { UseCase } from '@/domain/use_cases/use_case.base';
import type {
  CancelPermissionRequestParams,
  LeaveRepository,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class CancelPermissionRequestUseCase extends UseCase<
  CancelPermissionRequestParams,
  void
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: CancelPermissionRequestParams): Promise<void> {
    leaveLog.info(
      'use_case',
      `CancelPermissionRequestUseCase.execute → id=${input.permissionRequestId}`,
    );
    try {
      await this.repo.cancelPermissionRequest(input);
      leaveLog.info('use_case', 'CancelPermissionRequestUseCase completed');
    } catch (e) {
      leaveLog.error(
        'use_case',
        'CancelPermissionRequestUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

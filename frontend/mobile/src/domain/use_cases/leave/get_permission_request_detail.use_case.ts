import { UseCase } from '@/domain/use_cases/use_case.base';
import type { PermissionRequest } from '@/domain/entities';
import type {
  GetPermissionRequestDetailParams,
  LeaveRepository,
} from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class GetPermissionRequestDetailUseCase extends UseCase<
  GetPermissionRequestDetailParams,
  PermissionRequest
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(
    input: GetPermissionRequestDetailParams,
  ): Promise<PermissionRequest> {
    leaveLog.info(
      'use_case',
      `GetPermissionRequestDetailUseCase.execute → id=${input.permissionRequestId}`,
    );
    try {
      const result = await this.repo.getPermissionRequestDetail(input);
      leaveLog.info(
        'use_case',
        `GetPermissionRequestDetailUseCase completed → status=${result.status}`,
      );
      return result;
    } catch (e) {
      leaveLog.error(
        'use_case',
        'GetPermissionRequestDetailUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

import { UseCase } from '@/domain/use_cases/use_case.base';
import type { PermissionRequest } from '@/domain/entities';
import type { LeaveRepository, RequestPermissionParams } from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export class RequestPermissionUseCase extends UseCase<RequestPermissionParams, PermissionRequest> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: RequestPermissionParams): Promise<PermissionRequest> {
    leaveLog.info(
      'use_case',
      `RequestPermissionUseCase.execute → permissionType=${input.permissionType}, date=${input.date}`,
    );
    try {
      const result = await this.repo.createPermissionRequest(input);
      leaveLog.info('use_case', `RequestPermissionUseCase completed → id=${result.id}`);
      return result;
    } catch (e) {
      leaveLog.error('use_case', 'RequestPermissionUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

import { UseCase } from '@/domain/use_cases/use_case.base';
import type { Me } from '@/domain/entities';
import type { MeRepository } from '@/domain/repositories';
import { authLog } from '@/core/logger';

export class FetchMeUseCase extends UseCase<void, Me> {
  constructor(private readonly repo: MeRepository) {
    super();
  }

  async execute(): Promise<Me> {
    authLog.info('use_case', 'FetchMeUseCase.execute →');
    try {
      const me = await this.repo.fetchMe();
      authLog.info(
        'use_case',
        `FetchMeUseCase.execute completed (role=${me.role}, perms=${me.permissions.length}, employeeLinked=${me.employee !== null})`,
      );
      return me;
    } catch (e) {
      authLog.error('use_case', 'FetchMeUseCase.execute threw (rethrowing)', e);
      throw e;
    }
  }
}

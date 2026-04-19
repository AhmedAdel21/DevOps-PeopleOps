import { UseCase } from '@/domain/use_cases/use_case.base';
import type { AuthRepository } from '@/domain/repositories';
import { authLog } from '@/core/logger';

export class ZohoLoginUseCase extends UseCase<void, void> {
  constructor(private readonly repo: AuthRepository) {
    super();
  }

  async execute(): Promise<void> {
    authLog.info('use_case', 'ZohoLoginUseCase.execute →');
    try {
      await this.repo.loginWithZoho();
      authLog.info('use_case', 'ZohoLoginUseCase.execute completed');
    } catch (e) {
      authLog.error('use_case', 'ZohoLoginUseCase.execute threw (rethrowing)', e);
      throw e;
    }
  }
}

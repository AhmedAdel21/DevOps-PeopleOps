import { UseCase } from '@/domain/use_cases/use_case.base';
import type { AuthRepository } from '@/domain/repositories';
import { authLog } from '@/core/logger';

export class ZohoLoginUseCase extends UseCase<void, { mustChangePassword: boolean }> {
  constructor(private readonly repo: AuthRepository) {
    super();
  }

  async execute(): Promise<{ mustChangePassword: boolean }> {
    authLog.info('use_case', 'ZohoLoginUseCase.execute →');
    try {
      const result = await this.repo.loginWithZoho();
      authLog.info('use_case', 'ZohoLoginUseCase.execute completed');
      return result;
    } catch (e) {
      authLog.error('use_case', 'ZohoLoginUseCase.execute threw (rethrowing)', e);
      throw e;
    }
  }
}

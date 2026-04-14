import { UseCase } from '@/domain/use_cases/use_case.base';
import type { AuthRepository } from '@/domain/repositories';
import { authLog } from '@/core/logger';

export interface LoginInput {
  email: string;
  password: string;
}

export class LoginUseCase extends UseCase<LoginInput, void> {
  constructor(private readonly repo: AuthRepository) {
    super();
  }

  async execute({ email, password }: LoginInput): Promise<void> {
    authLog.info(
      'use_case',
      `LoginUseCase.execute → email=${authLog.maskEmail(email)}`,
    );
    try {
      await this.repo.signIn(email.trim(), password);
      authLog.info('use_case', 'LoginUseCase.execute completed');
    } catch (e) {
      authLog.error(
        'use_case',
        'LoginUseCase.execute threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

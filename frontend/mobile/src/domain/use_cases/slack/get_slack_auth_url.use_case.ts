import { UseCase } from '@/domain/use_cases/use_case.base';
import type { SlackRepository } from '@/domain/repositories';
import { slackLog } from '@/core/logger';

export class GetSlackAuthUrlUseCase extends UseCase<void, string> {
  constructor(private readonly repo: SlackRepository) {
    super();
  }

  async execute(): Promise<string> {
    slackLog.info('use_case', 'GetSlackAuthUrlUseCase.execute →');
    try {
      const url = await this.repo.getAuthorizationUrl();
      slackLog.info('use_case', 'GetSlackAuthUrlUseCase.execute completed');
      return url;
    } catch (e) {
      slackLog.error('use_case', 'GetSlackAuthUrlUseCase.execute threw (rethrowing)', e);
      throw e;
    }
  }
}

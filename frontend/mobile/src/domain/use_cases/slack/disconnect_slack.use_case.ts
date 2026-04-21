import { UseCase } from '@/domain/use_cases/use_case.base';
import type { SlackRepository } from '@/domain/repositories';
import { slackLog } from '@/core/logger';

export class DisconnectSlackUseCase extends UseCase<void, void> {
  constructor(private readonly repo: SlackRepository) {
    super();
  }

  async execute(): Promise<void> {
    slackLog.info('use_case', 'DisconnectSlackUseCase.execute →');
    try {
      await this.repo.disconnect();
      slackLog.info('use_case', 'DisconnectSlackUseCase.execute completed');
    } catch (e) {
      slackLog.error('use_case', 'DisconnectSlackUseCase.execute threw (rethrowing)', e);
      throw e;
    }
  }
}

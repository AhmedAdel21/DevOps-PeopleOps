import { UseCase } from '@/domain/use_cases/use_case.base';
import type { SlackRepository } from '@/domain/repositories';
import { slackLog } from '@/core/logger';

export class CheckSlackConnectionUseCase extends UseCase<void, boolean> {
  constructor(private readonly repo: SlackRepository) {
    super();
  }

  async execute(): Promise<boolean> {
    slackLog.info('use_case', 'CheckSlackConnectionUseCase.execute →');
    try {
      const connected = await this.repo.getConnectionStatus();
      slackLog.info('use_case', `CheckSlackConnectionUseCase.execute completed → connected=${connected}`);
      return connected;
    } catch (e) {
      slackLog.error('use_case', 'CheckSlackConnectionUseCase.execute threw (rethrowing)', e);
      throw e;
    }
  }
}

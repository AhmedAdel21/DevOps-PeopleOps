import type { SlackRepository } from '@/domain/repositories';
import { SlackOAuthRemoteDataSource } from '@/data/data_sources/slack';
import { mapHttpErrorToSlack } from '@/data/mappers/slack';
import { slackLog } from '@/core/logger';

export class SlackRepositoryImpl implements SlackRepository {
  constructor(private readonly ds: SlackOAuthRemoteDataSource) {}

  async getAuthorizationUrl(): Promise<string> {
    slackLog.info('repository', 'getAuthorizationUrl called');
    try {
      const url = await this.ds.getAuthorizationUrl();
      slackLog.info('repository', 'getAuthorizationUrl resolved');
      return url;
    } catch (e) {
      const mapped = mapHttpErrorToSlack(e);
      slackLog.error('repository', `getAuthorizationUrl failed (code=${mapped.slackCode})`);
      throw mapped;
    }
  }

  async getConnectionStatus(): Promise<boolean> {
    slackLog.info('repository', 'getConnectionStatus called');
    try {
      const connected = await this.ds.getConnectionStatus();
      slackLog.info('repository', `getConnectionStatus resolved → connected=${connected}`);
      return connected;
    } catch (e) {
      const mapped = mapHttpErrorToSlack(e);
      slackLog.error('repository', `getConnectionStatus failed (code=${mapped.slackCode})`);
      throw mapped;
    }
  }

  async disconnect(): Promise<void> {
    slackLog.info('repository', 'disconnect called');
    try {
      await this.ds.disconnect();
      slackLog.info('repository', 'disconnect resolved');
    } catch (e) {
      const mapped = mapHttpErrorToSlack(e);
      slackLog.error('repository', `disconnect failed (code=${mapped.slackCode})`);
      throw mapped;
    }
  }
}

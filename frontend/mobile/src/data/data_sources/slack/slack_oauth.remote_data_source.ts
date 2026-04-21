import type { HttpClient } from '@/data/data_sources/http';
import { slackLog } from '@/core/logger';

const START_PATH = '/api/slack/user-oauth/start';
const STATUS_PATH = '/api/slack/user-oauth/status';
const DISCONNECT_PATH = '/api/slack/user-oauth/disconnect';

export class SlackOAuthRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async getAuthorizationUrl(): Promise<string> {
    slackLog.info('data_source', `GET ${START_PATH}`);
    const res = await this.http.get<{ authorizationUrl: string }>(START_PATH);
    return res.authorizationUrl;
  }

  async getConnectionStatus(): Promise<boolean> {
    slackLog.info('data_source', `GET ${STATUS_PATH}`);
    const res = await this.http.get<{ connected: boolean }>(STATUS_PATH);
    return res.connected;
  }

  async disconnect(): Promise<void> {
    slackLog.info('data_source', `DELETE ${DISCONNECT_PATH}`);
    await this.http.delete<{ disconnected: boolean }>(DISCONNECT_PATH);
  }
}

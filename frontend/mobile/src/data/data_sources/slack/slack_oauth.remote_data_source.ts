import type { HttpClient } from '@/data/data_sources/http';

const START_PATH = '/api/slack/user-oauth/start';
const STATUS_PATH = '/api/slack/user-oauth/status';

export class SlackOAuthRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async getAuthorizationUrl(): Promise<string> {
    const res = await this.http.get<{ authorizationUrl: string }>(START_PATH);
    return res.authorizationUrl;
  }

  async getConnectionStatus(): Promise<boolean> {
    const res = await this.http.get<{ connected: boolean }>(STATUS_PATH);
    return res.connected;
  }
}

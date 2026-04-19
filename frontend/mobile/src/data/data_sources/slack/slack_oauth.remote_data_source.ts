import type { HttpClient } from '@/data/data_sources/http';

const START_PATH = '/api/slack/user-oauth/start';

export class SlackOAuthRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async getAuthorizationUrl(): Promise<string> {
    const res = await this.http.get<{ authorizationUrl: string }>(START_PATH);
    return res.authorizationUrl;
  }
}

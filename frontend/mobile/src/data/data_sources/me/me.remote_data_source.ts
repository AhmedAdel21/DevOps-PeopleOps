import type { HttpClient } from '@/data/data_sources/http';
import type { MeDto } from '@/data/dtos/me';
import { authLog } from '@/core/logger';

const ME_PATH = '/api/auth/me';

export class MeRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async fetchMe(): Promise<MeDto> {
    authLog.info('data_source', `MeRemoteDataSource.fetchMe → GET ${ME_PATH}`);
    try {
      const dto = await this.http.get<MeDto>(ME_PATH);
      authLog.info(
        'data_source',
        `MeRemoteDataSource.fetchMe ← ok (role=${dto.role}, perms=${dto.permissions?.length ?? 0})`,
      );
      return dto;
    } catch (e) {
      authLog.error('data_source', 'MeRemoteDataSource.fetchMe failed', e);
      throw e;
    }
  }
}

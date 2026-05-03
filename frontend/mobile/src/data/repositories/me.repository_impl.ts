import type { Me } from '@/domain/entities';
import type { MeRepository } from '@/domain/repositories';
import { MeError } from '@/domain/errors';
import { MeRemoteDataSource } from '@/data/data_sources/me';
import { meDtoToDomain } from '@/data/mappers/me';
import { HttpError } from '@/data/data_sources/http';

const httpErrorToMeError = (e: HttpError): MeError => {
  if (e.status === 401) return new MeError('unauthorized', 'Session expired');
  if (e.status === 403) return new MeError('forbidden', 'Access denied');
  if (e.status === 0 || e.status >= 500) {
    return new MeError('transient', 'Profile service unavailable');
  }
  return new MeError('unknown', `Unexpected status ${e.status}`);
};

export class MeRepositoryImpl implements MeRepository {
  constructor(private readonly remote: MeRemoteDataSource) {}

  async fetchMe(): Promise<Me> {
    try {
      const dto = await this.remote.fetchMe();
      return meDtoToDomain(dto);
    } catch (e) {
      if (e instanceof HttpError) throw httpErrorToMeError(e);
      throw new MeError('unknown', e instanceof Error ? e.message : 'Failed to load profile');
    }
  }
}

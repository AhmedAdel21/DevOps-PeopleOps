import type { Me } from '@/domain/entities';
import type { MeRepository } from '@/domain/repositories';
import { MeRemoteDataSource } from '@/data/data_sources/me';
import { meDtoToDomain } from '@/data/mappers/me';

export class MeRepositoryImpl implements MeRepository {
  constructor(private readonly remote: MeRemoteDataSource) {}

  async fetchMe(): Promise<Me> {
    const dto = await this.remote.fetchMe();
    return meDtoToDomain(dto);
  }
}

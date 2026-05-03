import type { Me } from '@/domain/entities';

export interface MeRepository {
  fetchMe(): Promise<Me>;
}

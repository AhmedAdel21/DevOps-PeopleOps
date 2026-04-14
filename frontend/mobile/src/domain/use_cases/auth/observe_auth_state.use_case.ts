import { SyncUseCase } from '@/domain/use_cases/use_case.base';
import type {
  AuthRepository,
  AuthStateSubscription,
} from '@/domain/repositories';
import type { User } from '@/domain/entities';
import { authLog } from '@/core/logger';

export interface ObserveAuthStateInput {
  onChange: (user: User | null) => void;
}

export class ObserveAuthStateUseCase extends SyncUseCase<
  ObserveAuthStateInput,
  AuthStateSubscription
> {
  constructor(private readonly repo: AuthRepository) {
    super();
  }

  execute({ onChange }: ObserveAuthStateInput): AuthStateSubscription {
    authLog.info(
      'use_case',
      'ObserveAuthStateUseCase.execute → installing repository subscription',
    );
    return this.repo.observeAuthState(onChange);
  }
}

import type { User } from '@/domain/entities';
import type {
  AuthRepository,
  AuthStateSubscription,
} from '@/domain/repositories';
import { FirebaseAuthRemoteDataSource } from '@/data/data_sources/auth';
import {
  firebaseUserToDomain,
  mapFirebaseAuthError,
} from '@/data/mappers/auth';
import { authLog } from '@/core/logger';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly ds: FirebaseAuthRemoteDataSource) {}

  async signIn(email: string, password: string): Promise<void> {
    authLog.info(
      'repository',
      `signIn called → email=${authLog.maskEmail(email)}`,
    );
    try {
      await this.ds.signIn(email, password);
      authLog.info('repository', 'signIn succeeded');
    } catch (e) {
      const mapped = mapFirebaseAuthError(e);
      authLog.error(
        'repository',
        `signIn failed (authCode=${mapped.authCode})`,
      );
      throw mapped;
    }
  }

  async signOut(): Promise<void> {
    authLog.info('repository', 'signOut called');
    try {
      await this.ds.signOut();
      authLog.info('repository', 'signOut succeeded');
    } catch (e) {
      const mapped = mapFirebaseAuthError(e);
      authLog.error(
        'repository',
        `signOut failed (authCode=${mapped.authCode})`,
      );
      throw mapped;
    }
  }

  getCurrentUser(): User | null {
    const fu = this.ds.getCurrentUser();
    const user = fu ? firebaseUserToDomain(fu) : null;
    authLog.info(
      'repository',
      `getCurrentUser → ${user ? `uid=${user.id}` : '<none>'}`,
    );
    return user;
  }

  observeAuthState(
    onChange: (user: User | null) => void,
  ): AuthStateSubscription {
    authLog.info('repository', 'observeAuthState installing subscription');
    const unsubscribe = this.ds.observe((fu) => {
      const user = fu ? firebaseUserToDomain(fu) : null;
      authLog.info(
        'repository',
        `observeAuthState emitting → ${user ? `uid=${user.id}` : '<none>'}`,
      );
      onChange(user);
    });
    return {
      unsubscribe: () => {
        authLog.info('repository', 'observeAuthState unsubscribing');
        unsubscribe();
      },
    };
  }
}

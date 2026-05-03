import type { User } from '@/domain/entities';
import type {
  AuthRepository,
  AuthStateSubscription,
} from '@/domain/repositories';
import {
  FirebaseAuthRemoteDataSource,
  ZohoAuthRemoteDataSource,
} from '@/data/data_sources/auth';
import {
  firebaseUserToDomain,
  mapFirebaseAuthError,
} from '@/data/mappers/auth';
import { AuthError } from '@/domain/errors';
import { authLog } from '@/core/logger';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(
    private readonly ds: FirebaseAuthRemoteDataSource,
    private readonly zohoDs: ZohoAuthRemoteDataSource,
  ) {}

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

  async loginWithZoho(): Promise<void> {
    authLog.info('repository', 'loginWithZoho called');
    try {
      const result = await this.zohoDs.authenticate();

      if (!result.isActive) {
        authLog.warn('repository', 'loginWithZoho: account inactive');
        throw new AuthError('user-disabled', 'Account is inactive');
      }

      // Mint the Firebase session from the BE-issued custom token. Profile
      // fields (mustChangePassword, role, etc.) come from /api/auth/me after
      // the auth observer fires — not from the Zoho login response.
      await this.ds.signInWithCustomToken(result.accessToken);
      authLog.info('repository', 'loginWithZoho succeeded');
    } catch (e) {
      if (e instanceof AuthError) throw e;
      const mapped = mapFirebaseAuthError(e);
      authLog.error('repository', `loginWithZoho failed (authCode=${mapped.authCode})`);
      throw mapped;
    }
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

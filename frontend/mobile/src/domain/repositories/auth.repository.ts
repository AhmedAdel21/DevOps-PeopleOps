import type { User } from '@/domain/entities';

export interface AuthStateSubscription {
  unsubscribe(): void;
}

export interface AuthRepository {
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  observeAuthState(
    onChange: (user: User | null) => void,
  ): AuthStateSubscription;
  loginWithZoho(): Promise<void>;
  /** Update the currently-signed-in user's Firebase password. Throws an
   *  AuthError on Firebase rejection (mapped from `auth/*` codes). The
   *  BE never sees the plaintext. Caller is responsible for the BE
   *  `completePasswordChange` follow-up + forceRefreshIdToken. */
  updatePassword(newPassword: string): Promise<void>;
  /** Force-refresh the Firebase ID token so the latest custom claims
   *  (cleared mustChangePassword, role updates) land in the JWT used
   *  by subsequent BE calls. */
  forceRefreshIdToken(): Promise<void>;
}

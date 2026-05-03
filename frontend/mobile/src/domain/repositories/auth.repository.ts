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
}

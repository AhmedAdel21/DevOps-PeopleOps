import { DiKeys } from '@/core/keys/di.key';
import type { AuthRepository } from '@/domain/repositories';
import {
  LoginUseCase,
  LogoutUseCase,
  ObserveAuthStateUseCase,
} from '@/domain/use_cases';
import { FirebaseAuthRemoteDataSource } from '@/data/data_sources';
import { AuthRepositoryImpl } from '@/data/repositories';

export class ServiceLocator {
  private static registry = new Map<string, unknown>();

  static initialize(): void {
    ServiceLocator.registry.clear();

    const firebaseAuthDs = new FirebaseAuthRemoteDataSource();
    ServiceLocator.register(
      DiKeys.FIREBASE_AUTH_DATA_SOURCE,
      firebaseAuthDs,
    );

    const authRepo: AuthRepository = new AuthRepositoryImpl(firebaseAuthDs);
    ServiceLocator.register(DiKeys.AUTH_REPOSITORY, authRepo);

    ServiceLocator.register(
      DiKeys.LOGIN_USE_CASE,
      new LoginUseCase(authRepo),
    );
    ServiceLocator.register(
      DiKeys.LOGOUT_USE_CASE,
      new LogoutUseCase(authRepo),
    );
    ServiceLocator.register(
      DiKeys.OBSERVE_AUTH_STATE_USE_CASE,
      new ObserveAuthStateUseCase(authRepo),
    );
  }

  static register<T>(key: string, instance: T): void {
    ServiceLocator.registry.set(key, instance);
  }

  static get<T>(key: string): T {
    const instance = ServiceLocator.registry.get(key);
    if (instance === undefined) {
      throw new Error(
        `ServiceLocator: No instance registered for key "${key}"`,
      );
    }
    return instance as T;
  }

  static reset(): void {
    ServiceLocator.registry.clear();
  }
}

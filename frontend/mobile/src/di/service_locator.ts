import { AppConfig } from '@/di/config';
import { DiKeys } from '@/core/keys/di.key';
import type {
  AuthRepository,
  AttendanceRepository,
} from '@/domain/repositories';
import {
  LoginUseCase,
  LogoutUseCase,
  ObserveAuthStateUseCase,
  GetAttendanceStatusUseCase,
  SignInAttendanceUseCase,
  SignOutAttendanceUseCase,
  GetAttendanceHistoryUseCase,
} from '@/domain/use_cases';
import {
  FirebaseAuthRemoteDataSource,
  AttendanceRemoteDataSource,
  HttpClient,
} from '@/data/data_sources';
import {
  AuthRepositoryImpl,
  AttendanceRepositoryImpl,
} from '@/data/repositories';

export class ServiceLocator {
  private static registry = new Map<string, unknown>();

  static initialize(): void {
    ServiceLocator.registry.clear();

    // ── Auth ────────────────────────────────────────────────
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

    // ── HTTP + Attendance ───────────────────────────────────
    const httpClient = new HttpClient(
      AppConfig.API_BASE_URL,
      () => firebaseAuthDs.getIdToken(),
    );
    ServiceLocator.register(DiKeys.HTTP_CLIENT, httpClient);

    const attendanceDs = new AttendanceRemoteDataSource(httpClient);
    ServiceLocator.register(
      DiKeys.ATTENDANCE_REMOTE_DATA_SOURCE,
      attendanceDs,
    );

    const attendanceRepo: AttendanceRepository = new AttendanceRepositoryImpl(
      attendanceDs,
    );
    ServiceLocator.register(DiKeys.ATTENDANCE_REPOSITORY, attendanceRepo);

    ServiceLocator.register(
      DiKeys.GET_ATTENDANCE_STATUS_USE_CASE,
      new GetAttendanceStatusUseCase(attendanceRepo),
    );
    ServiceLocator.register(
      DiKeys.SIGN_IN_ATTENDANCE_USE_CASE,
      new SignInAttendanceUseCase(attendanceRepo),
    );
    ServiceLocator.register(
      DiKeys.SIGN_OUT_ATTENDANCE_USE_CASE,
      new SignOutAttendanceUseCase(attendanceRepo),
    );
    ServiceLocator.register(
      DiKeys.GET_ATTENDANCE_HISTORY_USE_CASE,
      new GetAttendanceHistoryUseCase(attendanceRepo),
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

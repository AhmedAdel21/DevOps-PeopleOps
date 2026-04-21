import { AppConfig } from '@/di/config';
import { DiKeys } from '@/core/keys/di.key';
import type {
  AuthRepository,
  AttendanceRepository,
  SlackRepository,
  LeaveRepository,
} from '@/domain/repositories';
import {
  LoginUseCase,
  LogoutUseCase,
  ObserveAuthStateUseCase,
  ZohoLoginUseCase,
  GetAttendanceStatusUseCase,
  SignInAttendanceUseCase,
  SignOutAttendanceUseCase,
  GetAttendanceHistoryUseCase,
  GetSlackAuthUrlUseCase,
  CheckSlackConnectionUseCase,
  DisconnectSlackUseCase,
  GetLeaveBalancesUseCase,
  GetLeaveRequestsUseCase,
  RequestLeaveUseCase,
  GetPermissionRequestsUseCase,
  RequestPermissionUseCase,
} from '@/domain/use_cases';
import {
  FirebaseAuthRemoteDataSource,
  ZohoAuthRemoteDataSource,
  AttendanceRemoteDataSource,
  SlackOAuthRemoteDataSource,
  LeaveRemoteDataSource,
  HttpClient,
} from '@/data/data_sources';
import {
  AuthRepositoryImpl,
  AttendanceRepositoryImpl,
  SlackRepositoryImpl,
  LeaveRepositoryImpl,
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

    const zohoAuthDs = new ZohoAuthRemoteDataSource({
      baseUrl: AppConfig.API_BASE_URL,
      mobileRedirectUri: AppConfig.ZOHO_MOBILE_REDIRECT_URI,
      deepLink: AppConfig.ZOHO_DEEP_LINK,
      warmUpTimeoutMs: AppConfig.WARM_UP_TIMEOUT_MS,
    });
    ServiceLocator.register(DiKeys.ZOHO_AUTH_DATA_SOURCE, zohoAuthDs);

    const authRepo: AuthRepository = new AuthRepositoryImpl(firebaseAuthDs, zohoAuthDs);
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
    ServiceLocator.register(
      DiKeys.ZOHO_LOGIN_USE_CASE,
      new ZohoLoginUseCase(authRepo),
    );

    // ── HTTP + Attendance ───────────────────────────────────
    const httpClient = new HttpClient(
      AppConfig.API_BASE_URL,
      () => firebaseAuthDs.getIdToken(),
    );
    ServiceLocator.register(DiKeys.HTTP_CLIENT, httpClient);

    const slackOAuthDs = new SlackOAuthRemoteDataSource(httpClient);
    ServiceLocator.register(DiKeys.SLACK_OAUTH_DATA_SOURCE, slackOAuthDs);

    const slackRepo: SlackRepository = new SlackRepositoryImpl(slackOAuthDs);
    ServiceLocator.register(DiKeys.SLACK_REPOSITORY, slackRepo);

    ServiceLocator.register(
      DiKeys.GET_SLACK_AUTH_URL_USE_CASE,
      new GetSlackAuthUrlUseCase(slackRepo),
    );
    ServiceLocator.register(
      DiKeys.CHECK_SLACK_CONNECTION_USE_CASE,
      new CheckSlackConnectionUseCase(slackRepo),
    );
    ServiceLocator.register(
      DiKeys.DISCONNECT_SLACK_USE_CASE,
      new DisconnectSlackUseCase(slackRepo),
    );

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

    // ── Leave ───────────────────────────────────────────────
    const leaveDs = new LeaveRemoteDataSource(httpClient);
    ServiceLocator.register(DiKeys.LEAVE_REMOTE_DATA_SOURCE, leaveDs);

    const leaveRepo: LeaveRepository = new LeaveRepositoryImpl(leaveDs);
    ServiceLocator.register(DiKeys.LEAVE_REPOSITORY, leaveRepo);

    ServiceLocator.register(
      DiKeys.GET_LEAVE_BALANCES_USE_CASE,
      new GetLeaveBalancesUseCase(leaveRepo),
    );
    ServiceLocator.register(
      DiKeys.GET_LEAVE_REQUESTS_USE_CASE,
      new GetLeaveRequestsUseCase(leaveRepo),
    );
    ServiceLocator.register(
      DiKeys.REQUEST_LEAVE_USE_CASE,
      new RequestLeaveUseCase(leaveRepo),
    );
    ServiceLocator.register(
      DiKeys.GET_PERMISSION_REQUESTS_USE_CASE,
      new GetPermissionRequestsUseCase(leaveRepo),
    );
    ServiceLocator.register(
      DiKeys.REQUEST_PERMISSION_USE_CASE,
      new RequestPermissionUseCase(leaveRepo),
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

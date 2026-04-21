export const DiKeys = {
  // auth
  FIREBASE_AUTH_DATA_SOURCE: 'firebaseAuthDataSource',
  ZOHO_AUTH_DATA_SOURCE: 'zohoAuthDataSource',
  AUTH_REPOSITORY: 'authRepository',
  LOGIN_USE_CASE: 'loginUseCase',
  LOGOUT_USE_CASE: 'logoutUseCase',
  OBSERVE_AUTH_STATE_USE_CASE: 'observeAuthStateUseCase',
  ZOHO_LOGIN_USE_CASE: 'zohoLoginUseCase',

  // slack oauth
  SLACK_OAUTH_DATA_SOURCE: 'slackOAuthDataSource',
  SLACK_REPOSITORY: 'slackRepository',
  GET_SLACK_AUTH_URL_USE_CASE: 'getSlackAuthUrlUseCase',
  CHECK_SLACK_CONNECTION_USE_CASE: 'checkSlackConnectionUseCase',
  DISCONNECT_SLACK_USE_CASE: 'disconnectSlackUseCase',

  // leave
  LEAVE_REMOTE_DATA_SOURCE: 'leaveRemoteDataSource',
  LEAVE_REPOSITORY: 'leaveRepository',
  GET_LEAVE_BALANCES_USE_CASE: 'getLeaveBalancesUseCase',
  GET_LEAVE_REQUESTS_USE_CASE: 'getLeaveRequestsUseCase',
  REQUEST_LEAVE_USE_CASE: 'requestLeaveUseCase',
  GET_PERMISSION_REQUESTS_USE_CASE: 'getPermissionRequestsUseCase',
  REQUEST_PERMISSION_USE_CASE: 'requestPermissionUseCase',

  // http + attendance
  HTTP_CLIENT: 'httpClient',
  ATTENDANCE_REMOTE_DATA_SOURCE: 'attendanceRemoteDataSource',
  ATTENDANCE_REPOSITORY: 'attendanceRepository',
  GET_ATTENDANCE_STATUS_USE_CASE: 'getAttendanceStatusUseCase',
  SIGN_IN_ATTENDANCE_USE_CASE: 'signInAttendanceUseCase',
  SIGN_OUT_ATTENDANCE_USE_CASE: 'signOutAttendanceUseCase',
  GET_ATTENDANCE_HISTORY_USE_CASE: 'getAttendanceHistoryUseCase',
} as const;

export type DiKey = (typeof DiKeys)[keyof typeof DiKeys];

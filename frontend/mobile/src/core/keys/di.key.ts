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

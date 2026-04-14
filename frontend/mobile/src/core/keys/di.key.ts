export const DiKeys = {
  FIREBASE_AUTH_DATA_SOURCE: 'firebaseAuthDataSource',
  AUTH_REPOSITORY: 'authRepository',
  LOGIN_USE_CASE: 'loginUseCase',
  LOGOUT_USE_CASE: 'logoutUseCase',
  OBSERVE_AUTH_STATE_USE_CASE: 'observeAuthStateUseCase',
} as const;

export type DiKey = (typeof DiKeys)[keyof typeof DiKeys];

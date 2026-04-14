import type { RootState } from '../index';

export const selectAuthStatus = (s: RootState) => s.auth.status;
export const selectCurrentUser = (s: RootState) => s.auth.user;
export const selectIsAuthenticated = (s: RootState) =>
  s.auth.status === 'authenticated';
export const selectIsAuthBootstrapped = (s: RootState) =>
  s.auth.status !== 'uninitialized';
export const selectLoginStatus = (s: RootState) => s.auth.loginStatus;
export const selectLoginError = (s: RootState) => s.auth.loginError;
export const selectLogoutStatus = (s: RootState) => s.auth.logoutStatus;
export const selectLogoutError = (s: RootState) => s.auth.logoutError;

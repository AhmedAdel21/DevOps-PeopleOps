import type { RootState } from '../index';

export const selectCurrentUser = (s: RootState) => s.me.currentUser;
export const selectMeFetchStatus = (s: RootState) => s.me.fetchStatus;
export const selectMeFetchError = (s: RootState) => s.me.fetchError;
export const selectMeBootstrapStatus = (s: RootState) => s.me.bootstrapStatus;
export const selectMustChangePassword = (s: RootState) =>
  s.me.currentUser?.mustChangePassword ?? false;
export const selectRole = (s: RootState) => s.me.currentUser?.role ?? null;
export const selectProvider = (s: RootState) => s.me.currentUser?.provider ?? null;
export const selectEmployee = (s: RootState) => s.me.currentUser?.employee ?? null;
export const selectPermissions = (s: RootState) =>
  s.me.currentUser?.permissions ?? [];

/**
 * Parameterized selector. Use either directly:
 *   useAppSelector(s => selectHasPermission(s, 'leave:approve'))
 * or via the useHasPermission hook below.
 */
export const selectHasPermission = (s: RootState, permission: string): boolean =>
  s.me.currentUser?.permissions.includes(permission) ?? false;

export const selectHasAnyPermission = (
  s: RootState,
  ...permissions: string[]
): boolean => {
  const perms = s.me.currentUser?.permissions;
  if (!perms || perms.length === 0) return false;
  return permissions.some((p) => perms.includes(p));
};

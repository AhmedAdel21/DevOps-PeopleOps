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
 * Parameterized selector. Always pass values from `Permissions` (in
 * `@/core/auth`) — never raw strings. Example:
 *   useAppSelector(s => selectHasPermission(s, Permissions.Leave.Approve))
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

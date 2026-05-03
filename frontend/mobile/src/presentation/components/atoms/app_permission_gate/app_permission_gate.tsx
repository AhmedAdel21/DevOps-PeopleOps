import React from 'react';
import { useAppSelector } from '@/presentation/store/hooks';
import {
  selectHasPermission,
  selectHasAnyPermission,
} from '@/presentation/store/selectors';

export interface AppPermissionGateProps {
  /** Single permission required. Mutually exclusive with anyOf. */
  permission?: string;
  /** Render children if the user has any of the listed permissions. */
  anyOf?: string[];
  /** Optional fallback rendered when the gate is closed (defaults to null). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditional renderer driven by /api/auth/me permissions. UI-gating only —
 * the backend re-authorizes every action, so a dropped permission still
 * results in a 403 even if the gate is open.
 *
 * Usage:
 *   <AppPermissionGate permission="leave:approve"><ApproveButton /></AppPermissionGate>
 *   <AppPermissionGate anyOf={['leave:approve', 'leave:reject']}>...</AppPermissionGate>
 */
export const AppPermissionGate: React.FC<AppPermissionGateProps> = ({
  permission,
  anyOf,
  fallback = null,
  children,
}) => {
  const allowed = useAppSelector((state) => {
    if (permission) return selectHasPermission(state, permission);
    if (anyOf && anyOf.length > 0) return selectHasAnyPermission(state, ...anyOf);
    return false;
  });
  return <>{allowed ? children : fallback}</>;
};

import type { RootState } from '../index';

// ── Balances ─────────────────────────────────────────────────────────────────
export const selectLeaveBalances = (s: RootState) => s.leave.balances;
export const selectPermissionQuota = (s: RootState) => s.leave.permissionQuota;
export const selectLeaveBalancesFetchStatus = (s: RootState) => s.leave.balancesFetchStatus;
export const selectLeaveBalancesFetchError = (s: RootState) => s.leave.balancesFetchError;

// ── Leave requests ────────────────────────────────────────────────────────────
export const selectLeaveRequests = (s: RootState) => s.leave.requests;
export const selectLeaveRequestsNextCursor = (s: RootState) => s.leave.requestsNextCursor;
export const selectLeaveRequestsHasMore = (s: RootState) => s.leave.requestsHasMore;
export const selectLeaveRequestsFetchStatus = (s: RootState) => s.leave.requestsFetchStatus;
export const selectLeaveRequestsFetchError = (s: RootState) => s.leave.requestsFetchError;

export const selectRequestLeaveStatus = (s: RootState) => s.leave.requestLeaveStatus;
export const selectRequestLeaveError = (s: RootState) => s.leave.requestLeaveError;

// ── Permission requests ───────────────────────────────────────────────────────
export const selectPermissionRequests = (s: RootState) => s.leave.permissionRequests;
export const selectPermissionRequestsNextCursor = (s: RootState) => s.leave.permissionRequestsNextCursor;
export const selectPermissionRequestsHasMore = (s: RootState) => s.leave.permissionRequestsHasMore;
export const selectPermissionRequestsFetchStatus = (s: RootState) => s.leave.permissionRequestsFetchStatus;
export const selectPermissionRequestsFetchError = (s: RootState) => s.leave.permissionRequestsFetchError;

export const selectRequestPermissionStatus = (s: RootState) => s.leave.requestPermissionStatus;
export const selectRequestPermissionError = (s: RootState) => s.leave.requestPermissionError;

// ── Busy aggregate ────────────────────────────────────────────────────────────
export const selectIsLeaveBusy = (s: RootState) =>
  s.leave.balancesFetchStatus === 'pending' ||
  s.leave.requestsFetchStatus === 'pending' ||
  s.leave.permissionRequestsFetchStatus === 'pending' ||
  s.leave.requestLeaveStatus === 'pending' ||
  s.leave.requestPermissionStatus === 'pending';

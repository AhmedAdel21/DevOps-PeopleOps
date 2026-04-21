import type { RootState } from '../index';

export const selectLeaveBalances = (s: RootState) => s.leave.balances;
export const selectLeaveBalancesFetchStatus = (s: RootState) => s.leave.balancesFetchStatus;
export const selectLeaveBalancesFetchError = (s: RootState) => s.leave.balancesFetchError;

export const selectLeaveRequests = (s: RootState) => s.leave.requests;
export const selectLeaveRequestsNextCursor = (s: RootState) => s.leave.requestsNextCursor;
export const selectLeaveRequestsHasMore = (s: RootState) => s.leave.requestsHasMore;
export const selectLeaveRequestsFetchStatus = (s: RootState) => s.leave.requestsFetchStatus;
export const selectLeaveRequestsFetchError = (s: RootState) => s.leave.requestsFetchError;

export const selectRequestLeaveStatus = (s: RootState) => s.leave.requestLeaveStatus;
export const selectRequestLeaveError = (s: RootState) => s.leave.requestLeaveError;

export const selectIsLeaveBusy = (s: RootState) =>
  s.leave.balancesFetchStatus === 'pending' ||
  s.leave.requestsFetchStatus === 'pending' ||
  s.leave.requestLeaveStatus === 'pending';

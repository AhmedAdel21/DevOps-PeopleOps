import type { RootState } from '../index';

// ── Balances ─────────────────────────────────────────────────────────────────
export const selectLeaveBalances = (s: RootState) => s.leave.balances;
export const selectLeaveBalancesYear = (s: RootState) => s.leave.balancesYear;
export const selectLeaveBalancesFetchStatus = (s: RootState) => s.leave.balancesFetchStatus;
export const selectLeaveBalancesFetchError = (s: RootState) => s.leave.balancesFetchError;

// ── Available leave types ───────────────────────────────────────────────────
export const selectAvailableLeaveTypes = (s: RootState) => s.leave.availableTypes;
export const selectAvailableLeaveTypesStartDate = (s: RootState) => s.leave.availableTypesStartDate;
export const selectAvailableLeaveTypesFetchStatus = (s: RootState) =>
  s.leave.availableTypesFetchStatus;
export const selectAvailableLeaveTypesFetchError = (s: RootState) =>
  s.leave.availableTypesFetchError;

// ── My leave requests ───────────────────────────────────────────────────────
export const selectLeaveRequests = (s: RootState) => s.leave.requests;
export const selectLeaveRequestsFilter = (s: RootState) => s.leave.requestsFilter;
export const selectLeaveRequestsPage = (s: RootState) => s.leave.requestsPage;
export const selectLeaveRequestsPageSize = (s: RootState) => s.leave.requestsPageSize;
export const selectLeaveRequestsTotalCount = (s: RootState) => s.leave.requestsTotalCount;
export const selectLeaveRequestsFetchStatus = (s: RootState) => s.leave.requestsFetchStatus;
export const selectLeaveRequestsFetchError = (s: RootState) => s.leave.requestsFetchError;

// ── Detail ──────────────────────────────────────────────────────────────────
export const selectLeaveRequestDetailById = (id: string) => (s: RootState) =>
  s.leave.requestDetailsById[id] ?? null;
export const selectLeaveRequestDetailFetchStatus = (s: RootState) =>
  s.leave.requestDetailFetchStatus;
export const selectLeaveRequestDetailFetchError = (s: RootState) =>
  s.leave.requestDetailFetchError;

// ── Submit ──────────────────────────────────────────────────────────────────
export const selectSubmitLeaveStatus = (s: RootState) => s.leave.submitStatus;
export const selectSubmitLeaveError = (s: RootState) => s.leave.submitError;
export const selectLastSubmitResult = (s: RootState) => s.leave.lastSubmitResult;

// ── Cancel ──────────────────────────────────────────────────────────────────
export const selectCancelStatus = (s: RootState) => s.leave.cancelStatus;
export const selectCancelError = (s: RootState) => s.leave.cancelError;

// ── Admin ───────────────────────────────────────────────────────────────────
export const selectAdminLeaveRequests = (s: RootState) => s.leave.adminRequests;
export const selectAdminFilter = (s: RootState) => s.leave.adminFilter;
export const selectAdminPage = (s: RootState) => s.leave.adminPage;
export const selectAdminPageSize = (s: RootState) => s.leave.adminPageSize;
export const selectAdminTotalCount = (s: RootState) => s.leave.adminTotalCount;
export const selectAdminFetchStatus = (s: RootState) => s.leave.adminFetchStatus;
export const selectAdminFetchError = (s: RootState) => s.leave.adminFetchError;
export const selectReviewStatus = (s: RootState) => s.leave.reviewStatus;
export const selectReviewError = (s: RootState) => s.leave.reviewError;

// ── Permissions (mock) ──────────────────────────────────────────────────────
export const selectPermissionQuota = (s: RootState) => s.leave.permissionQuota;
export const selectPermissionRequests = (s: RootState) => s.leave.permissionRequests;
export const selectPermissionRequestsNextCursor = (s: RootState) =>
  s.leave.permissionRequestsNextCursor;
export const selectPermissionRequestsHasMore = (s: RootState) =>
  s.leave.permissionRequestsHasMore;
export const selectPermissionRequestsFetchStatus = (s: RootState) =>
  s.leave.permissionRequestsFetchStatus;
export const selectPermissionRequestsFetchError = (s: RootState) =>
  s.leave.permissionRequestsFetchError;

export const selectRequestPermissionStatus = (s: RootState) => s.leave.requestPermissionStatus;
export const selectRequestPermissionError = (s: RootState) => s.leave.requestPermissionError;

// ── Busy aggregate ──────────────────────────────────────────────────────────
export const selectIsLeaveBusy = (s: RootState) =>
  s.leave.balancesFetchStatus === 'pending' ||
  s.leave.availableTypesFetchStatus === 'pending' ||
  s.leave.requestsFetchStatus === 'pending' ||
  s.leave.requestDetailFetchStatus === 'pending' ||
  s.leave.submitStatus === 'pending' ||
  s.leave.cancelStatus === 'pending' ||
  s.leave.adminFetchStatus === 'pending' ||
  s.leave.reviewStatus === 'pending' ||
  s.leave.permissionRequestsFetchStatus === 'pending' ||
  s.leave.requestPermissionStatus === 'pending';

import type { RootState } from '../index';

export const selectTeamSegment = (s: RootState) => s.team.segment;

export const selectTeamSelectedDate = (s: RootState) => s.team.selectedDate;
export const selectTeamActiveFilter = (s: RootState) => s.team.activeFilter;

export const selectTeamDay = (s: RootState) => s.team.day;
export const selectTeamDaySummary = (s: RootState) => s.team.day?.summary ?? null;
export const selectTeamRows = (s: RootState) => s.team.day?.rows ?? [];
export const selectTeamDayFetchStatus = (s: RootState) =>
  s.team.dayFetchStatus;
export const selectTeamDayFetchError = (s: RootState) =>
  s.team.dayFetchError;

// ── Approvals segment ───────────────────────────────────────────────────────
export const selectPendingTab = (s: RootState) => s.team.pendingTab;
export const selectApprovalsRange = (s: RootState) => s.team.approvalsRange;
export const selectPendingCount = (s: RootState) => s.team.pendingCount;
export const selectApprovalSections = (s: RootState) =>
  s.team.approvalSections;
export const selectApprovalsFetchStatus = (s: RootState) =>
  s.team.approvalsFetchStatus;
export const selectApprovalsFetchError = (s: RootState) =>
  s.team.approvalsFetchError;

// Approvals — Permissions inner tab
export const selectPermissionPendingCount = (s: RootState) =>
  s.team.permissionPendingCount;
export const selectPermissionApprovalSections = (s: RootState) =>
  s.team.permissionApprovalSections;
export const selectPermissionApprovalsFetchStatus = (s: RootState) =>
  s.team.permissionApprovalsFetchStatus;
export const selectPermissionApprovalsFetchError = (s: RootState) =>
  s.team.permissionApprovalsFetchError;

// ── Approval detail ─────────────────────────────────────────────────────────
export const selectApprovalDetailById =
  (requestId: string) => (s: RootState) =>
    s.team.approvalDetailsById[requestId] ?? null;
export const selectApprovalDetailFetchStatus = (s: RootState) =>
  s.team.approvalDetailFetchStatus;
export const selectApprovalDetailFetchError = (s: RootState) =>
  s.team.approvalDetailFetchError;

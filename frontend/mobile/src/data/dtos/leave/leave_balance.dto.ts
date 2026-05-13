// Wire shape returned by GET /api/v1/vacations/balances. The BE
// schema only carries the flat per-employee balance fields on AppUser
// (CurrentAnnualLeaveBalance / SickLeaveBalance / UrgentLeaveBalance)
// — no per-year history table, so totalEntitlement and usedDays are
// not exposed. The mapper synthesises defaults for the UI.
export interface LeaveBalanceItemDto {
  leaveTypeId: number;
  leaveTypeName: string;
  remainingDays: number;
  isUnlimited: boolean;
}

export interface LeaveBalancesResponseDto {
  year: number;
  balances: LeaveBalanceItemDto[];
}

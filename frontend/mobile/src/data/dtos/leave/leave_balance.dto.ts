// Matches LeaveBalanceItemDto on BE.
export interface LeaveBalanceItemDto {
  leaveTypeId: number;
  leaveTypeName: string;
  colorHex: string;
  isUnlimited: boolean;
  totalEntitlement: number;
  usedDays: number;
  remainingDays: number;
}

// Matches LeaveBalanceSummaryDto on BE.
export interface LeaveBalancesResponseDto {
  year: number;
  balances: LeaveBalanceItemDto[];
}

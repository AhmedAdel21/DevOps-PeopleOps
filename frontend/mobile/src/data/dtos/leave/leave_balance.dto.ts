export interface LeaveBalanceDto {
  leaveType: string;        // 'Annual' | 'Casual' | 'Sick'
  remaining: number | null;
  used: number | null;
  total: number | null;
  unlimited?: boolean;
}

export interface LeaveBalancesResponseDto {
  items: LeaveBalanceDto[];
}

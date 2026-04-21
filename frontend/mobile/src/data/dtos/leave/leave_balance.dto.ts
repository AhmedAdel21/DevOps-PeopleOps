export interface LeaveBalanceDto {
  leaveType: string;
  remaining: number | null;
  used: number | null;
  total: number | null;
  unlimited?: boolean;
}

export interface PermissionQuotaDto {
  permissionsUsed: number;
  permissionsAllowed: number;
  monthResetsAt: string; // yyyy-MM-dd
}

export interface LeaveBalancesResponseDto {
  items: LeaveBalanceDto[];
  permissionQuota?: PermissionQuotaDto;
}

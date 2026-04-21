import type {
  LeaveBalance,
  LeaveRequest,
  LeaveRequestsPage,
  LeaveType,
  LeaveRequestStatus,
  PermissionQuota,
  PermissionRequest,
  PermissionRequestsPage,
  PermissionType,
  PermissionRequestStatus,
} from '@/domain/entities';
import type {
  LeaveBalanceDto,
  LeaveBalancesResponseDto,
  LeaveRequestDto,
  LeaveRequestsResponseDto,
  PermissionQuotaDto,
  PermissionRequestDto,
  PermissionRequestsResponseDto,
} from '@/data/dtos/leave';
import { leaveLog } from '@/core/logger';

const toLeaveType = (raw: string): LeaveType => {
  switch (raw) {
    case 'Annual':        return 'Annual';
    case 'Casual':        return 'Casual';
    case 'Sick':          return 'Sick';
    case 'Compassionate': return 'Compassionate';
    case 'Unpaid':        return 'Unpaid';
    case 'Hajj':          return 'Hajj';
    case 'Marriage':      return 'Marriage';
    default:
      leaveLog.warn('mapper', `Unknown leaveType "${raw}", falling back to 'Annual'`);
      return 'Annual';
  }
};

const toLeaveRequestStatus = (raw: string): LeaveRequestStatus => {
  switch (raw) {
    case 'Approved':  return 'Approved';
    case 'Pending':   return 'Pending';
    case 'Rejected':  return 'Rejected';
    case 'Cancelled': return 'Cancelled';
    default:
      leaveLog.warn('mapper', `Unknown leave status "${raw}", falling back to 'Pending'`);
      return 'Pending';
  }
};

const toPermissionType = (raw: string): PermissionType => {
  switch (raw) {
    case 'Late':      return 'Late';
    case 'Early':     return 'Early';
    case 'MiddleDay': return 'MiddleDay';
    case 'HalfDay':   return 'HalfDay';
    default:
      leaveLog.warn('mapper', `Unknown permissionType "${raw}", falling back to 'Late'`);
      return 'Late';
  }
};

const toPermissionRequestStatus = (raw: string): PermissionRequestStatus => {
  switch (raw) {
    case 'Approved':  return 'Approved';
    case 'Pending':   return 'Pending';
    case 'Rejected':  return 'Rejected';
    case 'Cancelled': return 'Cancelled';
    default:
      leaveLog.warn('mapper', `Unknown permission status "${raw}", falling back to 'Pending'`);
      return 'Pending';
  }
};

export const leaveBalanceDtoToDomain = (dto: LeaveBalanceDto): LeaveBalance => ({
  type: toLeaveType(dto.leaveType),
  remaining: dto.remaining,
  used: dto.used,
  total: dto.total,
  unlimited: dto.unlimited,
});

export const permissionQuotaDtoToDomain = (dto: PermissionQuotaDto): PermissionQuota => ({
  permissionsUsed: dto.permissionsUsed,
  permissionsAllowed: dto.permissionsAllowed,
  monthResetsAt: dto.monthResetsAt,
});

export const leaveBalancesResponseDtoToDomain = (
  dto: LeaveBalancesResponseDto,
): { balances: LeaveBalance[]; permissionQuota: PermissionQuota | null } => ({
  balances: dto.items.map(leaveBalanceDtoToDomain),
  permissionQuota: dto.permissionQuota
    ? permissionQuotaDtoToDomain(dto.permissionQuota)
    : null,
});

export const leaveRequestDtoToDomain = (dto: LeaveRequestDto): LeaveRequest => ({
  id: dto.id,
  leaveType: toLeaveType(dto.leaveType),
  fromDate: dto.fromDate,
  toDate: dto.toDate,
  durationDays: dto.durationDays,
  status: toLeaveRequestStatus(dto.status),
});

export const leaveRequestsResponseDtoToDomain = (
  dto: LeaveRequestsResponseDto,
): LeaveRequestsPage => ({
  items: dto.items.map(leaveRequestDtoToDomain),
  nextCursor: dto.nextCursor,
});

export const permissionRequestDtoToDomain = (dto: PermissionRequestDto): PermissionRequest => ({
  id: dto.id,
  permissionType: toPermissionType(dto.permissionType),
  date: dto.date,
  startTime: dto.startTime,
  endTime: dto.endTime,
  durationMinutes: dto.durationMinutes,
  status: toPermissionRequestStatus(dto.status),
});

export const permissionRequestsResponseDtoToDomain = (
  dto: PermissionRequestsResponseDto,
): PermissionRequestsPage => ({
  items: dto.items.map(permissionRequestDtoToDomain),
  nextCursor: dto.nextCursor,
});

import type {
  LeaveBalance,
  LeaveRequest,
  LeaveRequestsPage,
  LeaveType,
  LeaveRequestStatus,
} from '@/domain/entities';
import type {
  LeaveBalanceDto,
  LeaveRequestDto,
  LeaveRequestsResponseDto,
} from '@/data/dtos/leave';
import { leaveLog } from '@/core/logger';

const toLeaveType = (raw: string): LeaveType => {
  switch (raw) {
    case 'Annual': return 'Annual';
    case 'Casual': return 'Casual';
    case 'Sick':   return 'Sick';
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
      leaveLog.warn('mapper', `Unknown status "${raw}", falling back to 'Pending'`);
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

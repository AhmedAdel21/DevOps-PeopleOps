import type {
  AdminLeaveRequestListItem,
  AdminLeaveRequestsPage,
  LeaveBalance,
  LeaveBalancesSummary,
  LeaveRequestDetail,
  LeaveRequestListItem,
  LeaveRequestStatus,
  LeaveRequestsPage,
  LeaveTypeMeta,
  PermissionQuota,
  PermissionRequest,
  PermissionRequestStatus,
  PermissionRequestsPage,
  PermissionType,
  SubmitLeaveResult,
} from '@/domain/entities';
import type {
  AdminLeaveRequestListItemDto,
  AdminLeaveRequestsPageDto,
  LeaveBalanceItemDto,
  LeaveBalancesResponseDto,
  LeaveRequestDetailDto,
  LeaveRequestListItemDto,
  LeaveRequestsPageDto,
  LeaveTypeSummaryDto,
  PermissionRequestDto,
  PermissionRequestsResponseDto,
  SubmitLeaveRequestSuccessDto,
} from '@/data/dtos/leave';
import { leaveLog } from '@/core/logger';

// ── Status ───────────────────────────────────────────────────────────────────

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

// ── Leave types ──────────────────────────────────────────────────────────────

export const leaveTypeSummaryDtoToDomain = (dto: LeaveTypeSummaryDto): LeaveTypeMeta => ({
  id: dto.leaveTypeId,
  nameEn: dto.nameEn,
  nameAr: dto.nameAr,
  colorHex: dto.colorHex,
  requiresMedicalCertificate: dto.requiresMedicalCertificate,
  isOncePerCareer: dto.isOncePerCareer,
  maxConsecutiveDays: dto.maxConsecutiveDays,
  allowSameDay: dto.allowSameDay,
});

// ── Balances ─────────────────────────────────────────────────────────────────

export const leaveBalanceItemDtoToDomain = (dto: LeaveBalanceItemDto): LeaveBalance => ({
  typeId: dto.leaveTypeId,
  typeName: dto.leaveTypeName,
  colorHex: dto.colorHex,
  isUnlimited: dto.isUnlimited,
  totalEntitlement: dto.totalEntitlement,
  usedDays: dto.usedDays,
  remainingDays: dto.remainingDays,
});

export const leaveBalancesResponseDtoToDomain = (
  dto: LeaveBalancesResponseDto,
): LeaveBalancesSummary => ({
  year: dto.year,
  balances: dto.balances.map(leaveBalanceItemDtoToDomain),
});

// ── List + detail ────────────────────────────────────────────────────────────

export const leaveRequestListItemDtoToDomain = (
  dto: LeaveRequestListItemDto,
): LeaveRequestListItem => ({
  id: dto.leaveRequestId,
  leaveTypeName: dto.leaveTypeName,
  leaveTypeNameAr: dto.leaveTypeNameAr,
  colorHex: dto.colorHex,
  startDate: dto.startDate,
  endDate: dto.endDate,
  totalDays: dto.totalDays,
  status: toLeaveRequestStatus(dto.status),
  hasAttendanceConflict: dto.hasAttendanceConflict,
  createdAt: dto.createdAt,
});

export const leaveRequestsPageDtoToDomain = (
  dto: LeaveRequestsPageDto,
): LeaveRequestsPage => ({
  items: dto.items.map(leaveRequestListItemDtoToDomain),
  totalCount: dto.totalCount,
  page: dto.page,
  pageSize: dto.pageSize,
});

export const leaveRequestDetailDtoToDomain = (
  dto: LeaveRequestDetailDto,
): LeaveRequestDetail => ({
  id: dto.leaveRequestId,
  leaveTypeName: dto.leaveTypeName,
  leaveTypeNameAr: dto.leaveTypeNameAr,
  colorHex: dto.colorHex,
  startDate: dto.startDate,
  endDate: dto.endDate,
  totalDays: dto.totalDays,
  status: toLeaveRequestStatus(dto.status),
  notes: dto.notes,
  hasAttendanceConflict: dto.hasAttendanceConflict,
  conflictDetails: dto.conflictDetails,
  reviewerComment: dto.reviewerComment,
  reviewedAt: dto.reviewedAt,
  createdAt: dto.createdAt,
  balanceAfterApproval: dto.balanceAfterApproval,
  // Approval-screen extras (ynfPj/UirUR) — wired up when the BE ships the
  // fields. Empty conflict[] means the screen hides the conflict card;
  // null balanceImpact / precedentCount hide their respective sections.
  conflicts: [],
  balanceImpact: null,
  precedentCount: null,
  cancelledAt: null,
  cancelledBy: null,
});

// ── Submit result ────────────────────────────────────────────────────────────

export const submitLeaveRequestSuccessDtoToDomain = (
  dto: SubmitLeaveRequestSuccessDto,
): SubmitLeaveResult => ({
  leaveRequestId: dto.leaveRequestId,
  hasWeekendWarning: dto.hasWeekendWarning,
  hasAttendanceConflictWarning: dto.hasAttendanceConflictWarning,
  conflictDetails: dto.conflictDetails,
});

// ── Admin ────────────────────────────────────────────────────────────────────

export const adminLeaveRequestListItemDtoToDomain = (
  dto: AdminLeaveRequestListItemDto,
): AdminLeaveRequestListItem => ({
  ...leaveRequestListItemDtoToDomain(dto),
  employeeId: dto.employeeId,
  employeeName: dto.employeeName,
  employeeCode: dto.employeeCode,
  notes: dto.notes,
  conflictDetails: dto.conflictDetails,
  reviewerComment: dto.reviewerComment,
  reviewedAt: dto.reviewedAt,
  // Designs 6.2/6.3 show the reviewer's display name inline; 6.4 shows
  // the cancellation actor + timestamp. Backfilled when BE adds them.
  reviewerName: null,
  cancelledAt: null,
  cancelledBy: null,
});

export const adminLeaveRequestsPageDtoToDomain = (
  dto: AdminLeaveRequestsPageDto,
): AdminLeaveRequestsPage => ({
  items: dto.items.map(adminLeaveRequestListItemDtoToDomain),
  totalCount: dto.totalCount,
  page: dto.page,
  pageSize: dto.pageSize,
});

// ── Permission ────────────────────────────────────────────────────────────────

export const permissionRequestDtoToDomain = (dto: PermissionRequestDto): PermissionRequest => ({
  id: dto.id,
  permissionType: toPermissionType(dto.permissionType),
  date: dto.date,
  startTime: dto.startTime,
  endTime: dto.endTime,
  durationMinutes: dto.durationMinutes,
  notes: dto.notes ?? undefined,
  status: toPermissionRequestStatus(dto.status),
  attachments: (dto.attachments ?? []).map(a => ({
    id: a.id,
    fileName: a.fileName,
    contentType: a.contentType,
    sizeBytes: a.sizeBytes,
  })),
});

export const permissionRequestsResponseDtoToDomain = (
  dto: PermissionRequestsResponseDto,
): PermissionRequestsPage => ({
  items: dto.items.map(permissionRequestDtoToDomain),
  nextCursor: dto.nextCursor,
});

/** Mock quota — held in the repository impl until BE exposes permissions. */
export const MOCK_PERMISSION_QUOTA: PermissionQuota = {
  permissionsUsed: 1,
  permissionsAllowed: 2,
  monthResetsAt: (() => {
    const now = new Date();
    const y = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const m = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
    return `${y}-${String(m).padStart(2, '0')}-01`;
  })(),
};

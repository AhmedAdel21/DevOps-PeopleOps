import type {
  AdminLeaveRequestListItem,
  AdminLeaveRequestsPage,
  AdminPermissionRequestListItem,
  AdminPermissionRequestsPage,
  ApprovalLeg,
  ApprovalLegStatus,
  ApprovalProgress,
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

// Mobile expects 'Approved' | 'Pending' | 'Rejected' | 'Cancelled'.
//
// Cancel-eligibility MUST track the BE: LeaveRequestService.CancelMyLeave
// allows self-cancel only when the *Request* status is New/InReview, and
// the BE does NOT advance the Leave status enum on approval. Deriving
// from leaveStatusName therefore left approved leaves looking 'Pending'
// (Cancel shown → BE returns 404). So map from requestStatusName, and
// use leaveStatusName only to detect a self-cancel (the BE sets
// Request=Rejected + Leave=Canceled in that case, and we want to show
// 'Cancelled', not 'Rejected').
const toLeaveRequestStatus = (
  requestStatusName: string,
  leaveStatusName: string,
): LeaveRequestStatus => {
  if (leaveStatusName === 'Canceled' || leaveStatusName === 'Cancelled') {
    return 'Cancelled';
  }
  switch (requestStatusName) {
    // New hierarchical-approval BE uses 'Pending' (RequestStatus.Pending = 0)
    // as the initial state. Legacy 'New'/'InReview' are kept for backward
    // compatibility with rows from the pre-cutover workflow.
    case 'Pending':
    case 'New':
    case 'InReview':
      return 'Pending';
    case 'Approved':
    case 'Confirmed':
    case 'Closed':
      return 'Approved';
    case 'Rejected':
      return 'Rejected';
    default:
      leaveLog.warn(
        'mapper',
        `Unknown request status "${requestStatusName}", falling back to 'Pending'`,
      );
      return 'Pending';
  }
};

// BE PermissionTypeEnum: 1=LateAttendance, 2=EarlyLeave
const toPermissionType = (raw: string): PermissionType => {
  switch (raw) {
    case 'LateAttendance':
    case 'Late':
      return 'Late';
    case 'EarlyLeave':
    case 'Early':
      return 'Early';
    case 'MiddleDay':
      return 'MiddleDay';
    case 'HalfDay':
      return 'HalfDay';
    default:
      leaveLog.warn('mapper', `Unknown permissionType "${raw}", falling back to 'Late'`);
      return 'Late';
  }
};

// ── Per-leg approval progress (BE Phase 3) ──────────────────────────────────
// The BE projects the flat columns `Manager/Hr/Ceo ApprovalStatus`,
// `ApprovedById`, `ActedDate` (+ NeedCeoApprove + DecidedBy/DecidedDate)
// onto every Leave/Permission Info row. Mobile renders these via the
// `ApprovalProgress` component on detail screens. When the BE hasn't
// shipped the new projection yet, the per-leg fields are absent —
// toApprovalProgress returns null and the UI hides the section.

/** Shape used by toApprovalProgress — structural so it accepts both
 *  LeaveRequestListItemDto and PermissionRequestDto (the per-leg fields
 *  are identical across the two DTO shapes, just optional). */
interface ApprovalLegDtoShape {
  needCeoApprove?: boolean;
  managerApprovalStatus?: number;
  managerApprovedById?: number | null;
  managerActedDate?: string | null;
  hrApprovalStatus?: number;
  hrApprovedById?: number | null;
  hrActedDate?: string | null;
  ceoApprovalStatus?: number;
  ceoApprovedById?: number | null;
  ceoActedDate?: string | null;
  decidedById?: number | null;
  decidedDate?: string | null;
}

const toApprovalLegStatus = (
  raw: number | undefined | null,
): ApprovalLegStatus => {
  // BE enum: 1=Pending 2=Approved 3=Rejected 4=Superseded.
  switch (raw) {
    case 2:
      return 'Approved';
    case 3:
      return 'Rejected';
    case 4:
      return 'Superseded';
    case 1:
    default:
      return 'Pending';
  }
};

const toApprovalLeg = (
  status: number | undefined | null,
  actorId: number | null | undefined,
  actedAt: string | null | undefined,
): ApprovalLeg => ({
  status: toApprovalLegStatus(status),
  actorId: actorId != null ? String(actorId) : null,
  actedAt: actedAt ?? null,
});

const toApprovalProgress = (
  dto: ApprovalLegDtoShape,
): ApprovalProgress | null => {
  // Detection — the BE either ships the full per-leg trio or none of it
  // (the SQL projection is all-or-nothing). If ANY of the three is
  // missing, treat it as "BE didn't surface the snapshot" and hide the
  // section, instead of rendering misleading defaults during a partial
  // / mid-flight deploy.
  if (
    dto.managerApprovalStatus === undefined ||
    dto.hrApprovalStatus === undefined ||
    dto.ceoApprovalStatus === undefined
  ) {
    return null;
  }
  return {
    decisiveLevel: dto.needCeoApprove ? 'Ceo' : 'HrManager',
    manager: toApprovalLeg(
      dto.managerApprovalStatus,
      dto.managerApprovedById,
      dto.managerActedDate,
    ),
    hr: toApprovalLeg(
      dto.hrApprovalStatus,
      dto.hrApprovedById,
      dto.hrActedDate,
    ),
    ceo: toApprovalLeg(
      dto.ceoApprovalStatus,
      dto.ceoApprovedById,
      dto.ceoActedDate,
    ),
    decidedBy: dto.decidedById != null ? String(dto.decidedById) : null,
    decidedAt: dto.decidedDate ?? null,
  };
};

const toPermissionRequestStatus = (raw: string): PermissionRequestStatus => {
  switch (raw) {
    case 'Approved':
    case 'OnGoing':
    case 'Done':
      return 'Approved';
    case 'Pending':
    case 'New':
    case 'InReview':
      return 'Pending';
    case 'Rejected':
      return 'Rejected';
    case 'Canceled':
    case 'Cancelled':
      return 'Cancelled';
    default:
      leaveLog.warn('mapper', `Unknown permission status "${raw}", falling back to 'Pending'`);
      return 'Pending';
  }
};

// ── Date helpers ─────────────────────────────────────────────────────────────

// BE returns DateTime as ISO 8601 — trim to yyyy-MM-dd for screens that
// only care about the date.
const toIsoDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const idx = iso.indexOf('T');
  return idx >= 0 ? iso.slice(0, idx) : iso;
};

// ── Defaults for BE-missing fields ──────────────────────────────────────────

// New project doesn't expose LeaveTypeConfiguration metadata. UI keeps
// rendering; cosmetic fields fall back to empty values. Hardcoded
// per-enum defaults match what the BE applies internally in
// LeaveRequestService.GetRules().
const LEAVE_TYPE_DEFAULTS: Record<number, {
  nameAr: string;
  colorHex: string;
  requiresMedicalCertificate: boolean;
  isOncePerCareer: boolean;
  maxConsecutiveDays: number | null;
}> = {
  1: { nameAr: 'إجازة عاجلة', colorHex: '#FF9800', requiresMedicalCertificate: false, isOncePerCareer: false, maxConsecutiveDays: null },
  2: { nameAr: 'إجازة سنوية', colorHex: '#4CAF50', requiresMedicalCertificate: false, isOncePerCareer: false, maxConsecutiveDays: null },
  3: { nameAr: 'إجازة مرضية', colorHex: '#F44336', requiresMedicalCertificate: true,  isOncePerCareer: false, maxConsecutiveDays: null },
};

const leaveTypeNameAr = (id: number): string => LEAVE_TYPE_DEFAULTS[id]?.nameAr ?? '';
const leaveTypeColor  = (id: number): string => LEAVE_TYPE_DEFAULTS[id]?.colorHex ?? '#9E9E9E';

// ── Leave types ──────────────────────────────────────────────────────────────

export const leaveTypeSummaryDtoToDomain = (dto: LeaveTypeSummaryDto): LeaveTypeMeta => {
  const defaults = LEAVE_TYPE_DEFAULTS[dto.leaveTypeId];
  return {
    id: dto.leaveTypeId,
    nameEn: dto.nameEn,
    nameAr: defaults?.nameAr ?? dto.nameEn,
    colorHex: defaults?.colorHex ?? '#9E9E9E',
    requiresMedicalCertificate: defaults?.requiresMedicalCertificate ?? false,
    isOncePerCareer: defaults?.isOncePerCareer ?? false,
    maxConsecutiveDays: defaults?.maxConsecutiveDays ?? null,
    allowSameDay: dto.allowSameDay,
  };
};

// ── Balances ─────────────────────────────────────────────────────────────────

export const leaveBalanceItemDtoToDomain = (dto: LeaveBalanceItemDto): LeaveBalance => ({
  typeId: dto.leaveTypeId,
  typeName: dto.leaveTypeName,
  colorHex: leaveTypeColor(dto.leaveTypeId),
  isUnlimited: dto.isUnlimited,
  // BE doesn't expose total entitlement or used days separately — only
  // the remaining flat field on AppUser. Synthesise so the progress bar
  // can render something useful (used = 0, remaining = total).
  totalEntitlement: dto.remainingDays,
  usedDays: 0,
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
  id: String(dto.id),
  leaveTypeName: dto.leaveTypeName,
  leaveTypeNameAr: leaveTypeNameAr(dto.leaveTypeId),
  colorHex: leaveTypeColor(dto.leaveTypeId),
  startDate: toIsoDate(dto.fromDate),
  endDate: toIsoDate(dto.toDate ?? dto.fromDate),
  totalDays: dto.period,
  status: toLeaveRequestStatus(dto.requestStatusName, dto.leaveStatusName),
  hasAttendanceConflict: false,  // BE doesn't compute this on list rows
  createdAt: dto.createdDate,
  approvalProgress: toApprovalProgress(dto),
});

export const leaveRequestsPageDtoToDomain = (
  dto: LeaveRequestsPageDto,
): LeaveRequestsPage => ({
  items: dto.data.map(leaveRequestListItemDtoToDomain),
  totalCount: dto.pagination.rowCount,
  page: dto.pagination.currentPage,
  pageSize: dto.pagination.pageSize,
});

export const leaveRequestDetailDtoToDomain = (
  dto: LeaveRequestDetailDto,
): LeaveRequestDetail => ({
  id: String(dto.id),
  leaveTypeName: dto.leaveTypeName,
  leaveTypeNameAr: leaveTypeNameAr(dto.leaveTypeId),
  colorHex: leaveTypeColor(dto.leaveTypeId),
  startDate: toIsoDate(dto.fromDate),
  endDate: toIsoDate(dto.toDate ?? dto.fromDate),
  totalDays: dto.period,
  status: toLeaveRequestStatus(dto.requestStatusName, dto.leaveStatusName),
  notes: null,                    // BE doesn't expose request notes yet
  hasAttendanceConflict: false,
  conflictDetails: null,
  reviewerComment: null,
  reviewedAt: dto.updatedDate ?? null,
  createdAt: dto.createdDate,
  balanceAfterApproval: null,
  conflicts: [],
  balanceImpact: null,
  precedentCount: null,
  cancelledAt: null,
  cancelledBy: null,
  approvalProgress: toApprovalProgress(dto),
});

// ── Submit result ────────────────────────────────────────────────────────────

export const submitLeaveRequestSuccessDtoToDomain = (
  dto: SubmitLeaveRequestSuccessDto,
): SubmitLeaveResult => ({
  leaveRequestId: String(dto.leaveRequestId),
  hasWeekendWarning: dto.hasWeekendWarning,
  // BE doesn't compute attendance-conflict on submit; the field is set
  // server-side only on the legacy Firestore project.
  hasAttendanceConflictWarning: false,
  conflictDetails: dto.conflictingDates,
});

// ── Admin ────────────────────────────────────────────────────────────────────

// BE returns the same LeaveInfoModel shape for admin — the employee-side
// fields (notes, conflict, reviewer comment) aren't on the wire today.
export const adminLeaveRequestListItemDtoToDomain = (
  dto: AdminLeaveRequestListItemDto,
): AdminLeaveRequestListItem => ({
  ...leaveRequestListItemDtoToDomain(dto),
  employeeId: String(dto.employeeId),
  employeeName: dto.employeeName,
  employeeCode: '',               // BE doesn't expose EmpCode on the list row
  notes: null,
  conflictDetails: null,
  reviewerComment: null,
  reviewedAt: dto.updatedDate ?? null,
  reviewerName: dto.updatedBy ?? null,
  cancelledAt: null,
  cancelledBy: null,
  currentAnnualLeaveBalance: dto.currentAnnualLeaveBalance ?? null,
  currentSickLeaveBalance: dto.currentSickLeaveBalance ?? null,
  currentUrgentLeaveBalance: dto.currentUrgentLeaveBalance ?? null,
});

export const adminLeaveRequestsPageDtoToDomain = (
  dto: AdminLeaveRequestsPageDto,
): AdminLeaveRequestsPage => ({
  items: dto.data.map(adminLeaveRequestListItemDtoToDomain),
  totalCount: dto.pagination.rowCount,
  page: dto.pagination.currentPage,
  pageSize: dto.pagination.pageSize,
});

export const adminPermissionRequestListItemDtoToDomain = (
  dto: PermissionRequestDto,
): AdminPermissionRequestListItem => ({
  id: String(dto.id),
  employeeId: String(dto.employeeId),
  employeeName: dto.employeeName,
  permissionTypeName: dto.permissionTypeName,
  startDate: toIsoDate(dto.fromDate),
  endDate: toIsoDate(dto.toDate ?? dto.fromDate),
  periodHours: dto.period, // BE PeriodInHours
  // For permissions, the analogous "child status" is permissionStatusName.
  // toLeaveRequestStatus only checks the 2nd arg for 'Cancelled' detection,
  // which uses the same vocabulary in both child enums.
  status: toLeaveRequestStatus(dto.requestStatusName, dto.permissionStatusName),
  createdAt: dto.createdDate,
  approvalProgress: toApprovalProgress(dto),
});

export const adminPermissionRequestsPageDtoToDomain = (
  dto: PermissionRequestsResponseDto,
): AdminPermissionRequestsPage => ({
  items: dto.data.map(adminPermissionRequestListItemDtoToDomain),
  totalCount: dto.pagination.rowCount,
  page: dto.pagination.currentPage,
  pageSize: dto.pagination.pageSize,
});

// ── Permission ────────────────────────────────────────────────────────────────

// BE stores permissions with FromDate/ToDate (DateTime) and PeriodInHours.
// Mobile UI wants date + startTime + endTime + durationMinutes — derive
// from the FromDate/ToDate pair.
const splitDateTime = (iso: string | null | undefined): { date: string; time: string } => {
  if (!iso) return { date: '', time: '' };
  const idx = iso.indexOf('T');
  if (idx < 0) return { date: iso, time: '' };
  return {
    date: iso.slice(0, idx),
    time: iso.slice(idx + 1, idx + 6),  // HH:mm
  };
};

export const permissionRequestDtoToDomain = (dto: PermissionRequestDto): PermissionRequest => {
  const fromParts = splitDateTime(dto.fromDate);
  const toParts = splitDateTime(dto.toDate);
  return {
    id: String(dto.id),
    permissionType: toPermissionType(dto.permissionTypeName),
    date: fromParts.date,
    startTime: fromParts.time,
    endTime: toParts.time,
    durationMinutes: Math.round(dto.period * 60),
    notes: undefined,
    status: toPermissionRequestStatus(dto.permissionStatusName),
    attachments: [],            // BE doesn't expose permission attachments yet
    approvalProgress: toApprovalProgress(dto),
  };
};

export const permissionRequestsResponseDtoToDomain = (
  dto: PermissionRequestsResponseDto,
): PermissionRequestsPage => ({
  items: dto.data.map(permissionRequestDtoToDomain),
  // BE is page-based, mobile UI was cursor-based. Encode the next page
  // number as the cursor — null when there's nothing more to load.
  nextCursor:
    dto.pagination.currentPage * dto.pagination.pageSize >= dto.pagination.rowCount
      ? null
      : String(dto.pagination.currentPage + 1),
});

/** Mock quota — kept for the legacy MOCK path; live path uses the BE. */
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

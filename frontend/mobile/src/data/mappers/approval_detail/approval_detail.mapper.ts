import type {
  ApprovalDetail,
  ApprovalStatus,
} from '@/domain/entities';
import type { ApprovalDetailDto } from '@/data/dtos/approval_detail';

// Structural passthrough — every *Label is server-formatted and rendered
// verbatim (contract §3.5); the only guard is the status union.

const VALID_STATUSES: readonly ApprovalStatus[] = [
  'Pending',
  'Approved',
  'Rejected',
];

const toStatus = (raw: string): ApprovalStatus =>
  (VALID_STATUSES as readonly string[]).includes(raw)
    ? (raw as ApprovalStatus)
    : 'Pending';

export const approvalDetailDtoToDomain = (
  d: ApprovalDetailDto,
): ApprovalDetail => ({
  requestId: d.requestId,
  status: toStatus(d.status),
  employee: {
    name: d.employee.name,
    avatarInitials: d.employee.avatarInitials,
    avatarColorHex: d.employee.avatarColorHex,
    roleTitle: d.employee.roleTitle,
    departmentName: d.employee.departmentName,
    attendanceRecordUrl: d.employee.attendanceRecordUrl,
  },
  request: {
    typeEn: d.request.typeEn,
    typeAr: d.request.typeAr,
    datesLabel: d.request.datesLabel,
    durationLabel: d.request.durationLabel,
    submittedLabel: d.request.submittedLabel,
    note: d.request.note,
  },
  balanceImpact: d.balanceImpact
    ? {
        leaveTypeLabel: d.balanceImpact.leaveTypeLabel,
        beforeLabel: d.balanceImpact.beforeLabel,
        afterLabel: d.balanceImpact.afterLabel,
      }
    : null,
  conflict: d.conflict
    ? { title: d.conflict.title, rows: d.conflict.rows }
    : null,
  precedentLabel: d.precedentLabel,
});

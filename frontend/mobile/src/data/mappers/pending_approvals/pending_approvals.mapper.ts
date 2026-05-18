import type {
  PendingApprovalItem,
  PendingApprovalSection,
  PendingApprovalSectionKey,
  PendingApprovalsPage,
} from '@/domain/entities';
import type {
  PendingApprovalItemDto,
  PendingApprovalSectionDto,
  PendingApprovalsPageDto,
} from '@/data/dtos/pending_approvals';

// Structural passthrough — every *Label is server-formatted and rendered
// verbatim (contract §3.4); the only guard is the section-key union.

const VALID_KEYS: readonly PendingApprovalSectionKey[] = [
  'overdue',
  'today',
  'thisWeek',
];

const toSectionKey = (raw: string): PendingApprovalSectionKey =>
  (VALID_KEYS as readonly string[]).includes(raw)
    ? (raw as PendingApprovalSectionKey)
    : 'today';

const itemDtoToDomain = (
  d: PendingApprovalItemDto,
): PendingApprovalItem => ({
  requestId: d.requestId,
  employeeName: d.employeeName,
  avatarInitials: d.avatarInitials,
  avatarColorHex: d.avatarColorHex,
  unread: d.unread,
  leaveTypeEn: d.leaveTypeEn,
  leaveTypeAr: d.leaveTypeAr,
  dateRangeLabel: d.dateRangeLabel,
  submittedAgoLabel: d.submittedAgoLabel,
  submittedAt: d.submittedAt,
});

const sectionDtoToDomain = (
  d: PendingApprovalSectionDto,
): PendingApprovalSection => ({
  key: toSectionKey(d.key),
  title: d.title,
  items: d.items.map(itemDtoToDomain),
});

export const pendingApprovalsPageDtoToDomain = (
  dto: PendingApprovalsPageDto,
): PendingApprovalsPage => ({
  pendingCount: dto.pendingCount,
  sections: dto.sections.map(sectionDtoToDomain),
  page: dto.page,
  pageSize: dto.pageSize,
  totalCount: dto.totalCount,
});

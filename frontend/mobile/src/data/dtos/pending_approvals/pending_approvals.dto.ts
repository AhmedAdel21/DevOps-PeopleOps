// Wire shapes for the grouped pending-approvals aggregation
// (docs/team-api-contract.md §3.4). All *Label fields are server-formatted
// and rendered verbatim; the mapper is a structural passthrough.

export interface PendingApprovalItemDto {
  requestId: string;
  employeeName: string;
  avatarInitials: string;
  avatarColorHex: string | null;
  unread: boolean;
  leaveTypeEn: string;
  leaveTypeAr: string;
  dateRangeLabel: string;
  submittedAgoLabel: string;
  submittedAt: string;
}

export interface PendingApprovalSectionDto {
  key: string; // 'overdue' | 'today' | 'thisWeek'
  title: string;
  items: PendingApprovalItemDto[];
}

export interface PendingApprovalsPageDto {
  pendingCount: number;
  sections: PendingApprovalSectionDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/**
 * Entities for the Team tab's Approvals segment (designs QosTu populated /
 * vZ5G0 empty). This is the "grouped pending approvals" aggregation from
 * docs/team-api-contract.md §3.4 — the server buckets requests into
 * Overdue / Today / This-week sections and pre-formats every label so the
 * client renders verbatim.
 *
 * Approve / Reject are NOT here — they reuse the existing leave-admin
 * use cases (`adminApproveLeaveRequest` / `adminRejectLeaveRequest`),
 * keyed by `requestId`.
 */

/** Filter chip values from the design (All / Today / This week / This month). */
export type PendingApprovalRange = 'all' | 'today' | 'week' | 'month';

export type PendingApprovalSectionKey = 'overdue' | 'today' | 'thisWeek';

export interface PendingApprovalItem {
  /** Same id the reused approve/reject endpoints take. */
  readonly requestId: string;
  readonly employeeName: string;
  readonly avatarInitials: string;
  readonly avatarColorHex: string | null;
  /** Drives the unread dot on the card. */
  readonly unread: boolean;
  readonly leaveTypeEn: string;
  /** Arabic leave-type name, rendered next to the EN one ("· إجازة مرضية"). */
  readonly leaveTypeAr: string;
  /** Server-formatted, rendered verbatim ("5 Apr – 7 Apr · 3 days"). */
  readonly dateRangeLabel: string;
  /** Server-formatted, rendered verbatim ("Submitted 5 days ago"). */
  readonly submittedAgoLabel: string;
  /** ISO 8601 — kept for sorting / future relative recompute. */
  readonly submittedAt: string;
}

export interface PendingApprovalSection {
  readonly key: PendingApprovalSectionKey;
  /** Server-formatted section title ("Overdue (> 3 days)"). */
  readonly title: string;
  readonly items: readonly PendingApprovalItem[];
}

export interface PendingApprovalsPage {
  /** Header count badge. */
  readonly pendingCount: number;
  readonly sections: readonly PendingApprovalSection[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
}

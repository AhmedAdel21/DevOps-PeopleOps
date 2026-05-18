/**
 * Enriched approval detail for the Team tab's Approval Detail screen
 * (designs ynfPj default / UirUR confirm-approve). The
 * docs/team-api-contract.md §3.5 superset of the leave-request detail
 * with three team-only blocks: attendance conflict, balance impact,
 * precedent. Every `*Label` is server-formatted and rendered verbatim.
 *
 * Approve/Reject are NOT here — they reuse the existing leave-admin
 * use cases keyed by `requestId` (reject carries the reason from the
 * uAdAe sheet). The "confirm approve" UirUR state is client-only.
 */

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ApprovalEmployee {
  readonly name: string;
  readonly avatarInitials: string;
  readonly avatarColorHex: string | null;
  readonly roleTitle: string;
  readonly departmentName: string;
  /** Backs "View attendance record →"; null hides the link. */
  readonly attendanceRecordUrl: string | null;
}

export interface ApprovalRequestInfo {
  readonly typeEn: string;
  readonly typeAr: string;
  readonly datesLabel: string;
  readonly durationLabel: string;
  readonly submittedLabel: string;
  readonly note: string | null;
}

export interface ApprovalBalanceImpact {
  readonly leaveTypeLabel: string;
  readonly beforeLabel: string;
  readonly afterLabel: string;
}

/** Nullable — design hides the whole section when there's no conflict. */
export interface ApprovalConflict {
  readonly title: string;
  readonly rows: readonly string[];
}

export interface ApprovalDetail {
  readonly requestId: string;
  readonly employee: ApprovalEmployee;
  readonly status: ApprovalStatus;
  readonly request: ApprovalRequestInfo;
  readonly balanceImpact: ApprovalBalanceImpact | null;
  readonly conflict: ApprovalConflict | null;
  readonly precedentLabel: string | null;
}

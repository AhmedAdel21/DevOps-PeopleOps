import type {
  PendingApprovalRange,
  PendingApprovalsPage,
} from '@/domain/entities';

/**
 * Read-side repository for the Approvals segment (designs QosTu / vZ5G0).
 * The grouped/enriched aggregation from docs/team-api-contract.md §3.4.
 * Scope is BE-driven from the token (a Manager sees only their team).
 *
 * Approve / Reject are intentionally absent — they reuse the existing
 * `LeaveRepository.adminApproveLeaveRequest` / `adminRejectLeaveRequest`.
 */

export interface GetPendingApprovalsParams {
  /** Filter chip; defaults to 'all'. */
  readonly range?: PendingApprovalRange;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface PendingApprovalsRepository {
  getPendingApprovals(
    params: GetPendingApprovalsParams,
  ): Promise<PendingApprovalsPage>;
}

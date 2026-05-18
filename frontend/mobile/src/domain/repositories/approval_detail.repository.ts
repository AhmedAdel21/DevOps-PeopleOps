import type { ApprovalDetail } from '@/domain/entities';

/**
 * Read-side repository for the Approval Detail screen (designs ynfPj /
 * UirUR) — the enriched aggregation from docs/team-api-contract.md §3.5.
 * Scope is BE-driven; approve/reject reuse the leave-admin use cases.
 */

export interface GetApprovalDetailParams {
  readonly requestId: string;
}

export interface ApprovalDetailRepository {
  getApprovalDetail(
    params: GetApprovalDetailParams,
  ): Promise<ApprovalDetail>;
}

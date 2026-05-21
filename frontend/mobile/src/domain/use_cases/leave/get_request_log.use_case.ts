import { UseCase } from '@/domain/use_cases/use_case.base';
import type { RequestLogEntry } from '@/domain/entities';
import type { LeaveRepository } from '@/domain/repositories';
import { leaveLog } from '@/core/logger';

export interface GetRequestLogInput {
  kind: 'leave' | 'permission';
  id: string;
}

/**
 * Fetch the chronological activity log for one of the current user's
 * own requests. BE endpoints are requester-scoped — return 404 when
 * the id belongs to a different employee. Used by the mobile detail
 * screens (Phase 4f.4) to surface reviewer comments + status changes
 * + attachments in a unified timeline.
 */
export class GetRequestLogUseCase extends UseCase<
  GetRequestLogInput,
  RequestLogEntry[]
> {
  constructor(private readonly repo: LeaveRepository) {
    super();
  }

  async execute(input: GetRequestLogInput): Promise<RequestLogEntry[]> {
    leaveLog.info(
      'use_case',
      `GetRequestLogUseCase.execute → kind=${input.kind}, id=${input.id}`,
    );
    try {
      const entries = await this.repo.getRequestLog(input);
      leaveLog.info(
        'use_case',
        `GetRequestLogUseCase completed → ${entries.length} entries`,
      );
      return entries;
    } catch (e) {
      leaveLog.error('use_case', 'GetRequestLogUseCase threw (rethrowing)', e);
      throw e;
    }
  }
}

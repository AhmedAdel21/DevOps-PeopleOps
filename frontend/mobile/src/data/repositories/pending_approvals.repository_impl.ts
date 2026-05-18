import type { PendingApprovalsPage } from '@/domain/entities';
import type {
  GetPendingApprovalsParams,
  PendingApprovalsRepository,
} from '@/domain/repositories';
import { PendingApprovalsRemoteDataSource } from '@/data/data_sources/pending_approvals';
import { pendingApprovalsPageDtoToDomain } from '@/data/mappers/pending_approvals';
import { mapHttpErrorToManagement } from '@/data/mappers/team_attendance';
import { managementLog } from '@/core/logger';

export class PendingApprovalsRepositoryImpl
  implements PendingApprovalsRepository
{
  constructor(private readonly ds: PendingApprovalsRemoteDataSource) {}

  async getPendingApprovals(
    params: GetPendingApprovalsParams,
  ): Promise<PendingApprovalsPage> {
    managementLog.info(
      'repository',
      `getPendingApprovals (range=${params.range ?? 'all'}, page=${
        params.page ?? 1
      })`,
    );
    try {
      const dto = await this.ds.getPendingApprovals({
        range: params.range,
        page: params.page,
        pageSize: params.pageSize,
      });
      const result = pendingApprovalsPageDtoToDomain(dto);
      managementLog.info(
        'repository',
        `getPendingApprovals → ${result.pendingCount} pending in ${result.sections.length} sections`,
      );
      return result;
    } catch (e) {
      const mapped = mapHttpErrorToManagement(e);
      managementLog.error(
        'repository',
        `getPendingApprovals failed (code=${mapped.mgmtCode})`,
      );
      throw mapped;
    }
  }
}

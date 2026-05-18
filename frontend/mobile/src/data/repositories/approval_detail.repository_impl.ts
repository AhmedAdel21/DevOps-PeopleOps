import type { ApprovalDetail } from '@/domain/entities';
import type {
  ApprovalDetailRepository,
  GetApprovalDetailParams,
} from '@/domain/repositories';
import { ApprovalDetailRemoteDataSource } from '@/data/data_sources/approval_detail';
import { approvalDetailDtoToDomain } from '@/data/mappers/approval_detail';
import { mapHttpErrorToManagement } from '@/data/mappers/team_attendance';
import { managementLog } from '@/core/logger';

export class ApprovalDetailRepositoryImpl
  implements ApprovalDetailRepository
{
  constructor(private readonly ds: ApprovalDetailRemoteDataSource) {}

  async getApprovalDetail(
    params: GetApprovalDetailParams,
  ): Promise<ApprovalDetail> {
    managementLog.info(
      'repository',
      `getApprovalDetail (requestId=${params.requestId})`,
    );
    try {
      const dto = await this.ds.getApprovalDetail(params.requestId);
      const result = approvalDetailDtoToDomain(dto);
      managementLog.info(
        'repository',
        `getApprovalDetail → status=${result.status}, conflict=${
          result.conflict ? 'yes' : 'no'
        }`,
      );
      return result;
    } catch (e) {
      const mapped = mapHttpErrorToManagement(e);
      managementLog.error(
        'repository',
        `getApprovalDetail failed (code=${mapped.mgmtCode})`,
      );
      throw mapped;
    }
  }
}

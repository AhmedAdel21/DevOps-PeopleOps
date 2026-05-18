import { UseCase } from '@/domain/use_cases/use_case.base';
import type { TeamAttendanceHistoryPage } from '@/domain/entities';
import type {
  GetTeamAttendanceHistoryParams,
  TeamAttendanceRepository,
} from '@/domain/repositories';
import { managementLog } from '@/core/logger';

export class GetTeamAttendanceHistoryUseCase extends UseCase<
  GetTeamAttendanceHistoryParams,
  TeamAttendanceHistoryPage
> {
  constructor(private readonly repo: TeamAttendanceRepository) {
    super();
  }

  async execute(
    input: GetTeamAttendanceHistoryParams,
  ): Promise<TeamAttendanceHistoryPage> {
    managementLog.info(
      'use_case',
      `GetTeamAttendanceHistoryUseCase.execute → ${input.startDate}..${input.endDate}`,
    );
    try {
      const result = await this.repo.getTeamAttendanceHistory(input);
      managementLog.info(
        'use_case',
        `GetTeamAttendanceHistoryUseCase completed → ${result.items.length} days`,
      );
      return result;
    } catch (e) {
      managementLog.error(
        'use_case',
        'GetTeamAttendanceHistoryUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

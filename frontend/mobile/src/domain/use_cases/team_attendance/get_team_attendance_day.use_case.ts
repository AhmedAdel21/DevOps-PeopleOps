import { UseCase } from '@/domain/use_cases/use_case.base';
import type { TeamAttendanceDay } from '@/domain/entities';
import type {
  GetTeamAttendanceDayParams,
  TeamAttendanceRepository,
} from '@/domain/repositories';
import { managementLog } from '@/core/logger';

export class GetTeamAttendanceDayUseCase extends UseCase<
  GetTeamAttendanceDayParams,
  TeamAttendanceDay
> {
  constructor(private readonly repo: TeamAttendanceRepository) {
    super();
  }

  async execute(
    input: GetTeamAttendanceDayParams,
  ): Promise<TeamAttendanceDay> {
    managementLog.info(
      'use_case',
      `GetTeamAttendanceDayUseCase.execute → date=${input.date ?? 'today'}`,
    );
    try {
      const result = await this.repo.getTeamAttendanceDay(input);
      managementLog.info(
        'use_case',
        `GetTeamAttendanceDayUseCase completed → ${result.rows.length} rows`,
      );
      return result;
    } catch (e) {
      managementLog.error(
        'use_case',
        'GetTeamAttendanceDayUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

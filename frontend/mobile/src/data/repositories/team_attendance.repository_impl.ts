import type { TeamAttendanceDay } from '@/domain/entities';
import type {
  GetTeamAttendanceDayParams,
  TeamAttendanceRepository,
} from '@/domain/repositories';
import { TeamAttendanceRemoteDataSource } from '@/data/data_sources/team_attendance';
import { attendanceHistoryToTeamDay } from '@/data/mappers/team_attendance';
import { mapHttpErrorToLeave } from '@/data/mappers/leave';
import { managementLog } from '@/core/logger';

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export class TeamAttendanceRepositoryImpl implements TeamAttendanceRepository {
  constructor(private readonly ds: TeamAttendanceRemoteDataSource) {}

  async getTeamAttendanceDay(
    params: GetTeamAttendanceDayParams,
  ): Promise<TeamAttendanceDay> {
    const date = params.date ?? todayIso();
    managementLog.info('repository', `getTeamAttendanceDay (date=${date})`);
    try {
      // No per-day endpoint — request a single-day range and derive.
      const dto = await this.ds.getAttendanceHistory({ from: date, to: date });
      const result = attendanceHistoryToTeamDay(dto, date);
      managementLog.info(
        'repository',
        `getTeamAttendanceDay → ${result.rows.length} rows`,
      );
      return result;
    } catch (e) {
      // Reuse the leave error mapping — same `/management` backend, same
      // BaseResponseObj/403 shape (mapHttpErrorToManagement removed).
      const mapped = mapHttpErrorToLeave(e);
      managementLog.error(
        'repository',
        `getTeamAttendanceDay failed (${mapped.code})`,
      );
      throw mapped;
    }
  }
}

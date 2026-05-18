import type {
  TeamAttendanceDay,
  TeamAttendanceHistoryPage,
} from '@/domain/entities';
import type {
  GetTeamAttendanceDayParams,
  GetTeamAttendanceHistoryParams,
  TeamAttendanceRepository,
} from '@/domain/repositories';
import { TeamAttendanceRemoteDataSource } from '@/data/data_sources/team_attendance';
import {
  mapHttpErrorToManagement,
  teamAttendanceDayDtoToDomain,
  teamAttendanceHistoryPageDtoToDomain,
} from '@/data/mappers/team_attendance';
import { managementLog } from '@/core/logger';

export class TeamAttendanceRepositoryImpl implements TeamAttendanceRepository {
  constructor(private readonly ds: TeamAttendanceRemoteDataSource) {}

  async getTeamAttendanceDay(
    params: GetTeamAttendanceDayParams,
  ): Promise<TeamAttendanceDay> {
    managementLog.info(
      'repository',
      `getTeamAttendanceDay (date=${params.date ?? 'today'}, dept=${
        params.departmentId ?? '—'
      }, filter=${params.filter ?? 'All'})`,
    );
    try {
      const dto = await this.ds.getTeamAttendanceDay({
        date: params.date,
        departmentId: params.departmentId,
        filter: params.filter,
      });
      const result = teamAttendanceDayDtoToDomain(dto);
      managementLog.info(
        'repository',
        `getTeamAttendanceDay → ${result.rows.length} rows`,
      );
      return result;
    } catch (e) {
      throw mapAndLog(e, 'getTeamAttendanceDay');
    }
  }

  async getTeamAttendanceHistory(
    params: GetTeamAttendanceHistoryParams,
  ): Promise<TeamAttendanceHistoryPage> {
    managementLog.info(
      'repository',
      `getTeamAttendanceHistory (${params.startDate}..${params.endDate}, page=${
        params.page ?? 1
      })`,
    );
    try {
      const dto = await this.ds.getTeamAttendanceHistory({
        startDate: params.startDate,
        endDate: params.endDate,
        departmentId: params.departmentId,
        filter: params.filter,
        page: params.page,
        pageSize: params.pageSize,
      });
      const result = teamAttendanceHistoryPageDtoToDomain(dto);
      managementLog.info(
        'repository',
        `getTeamAttendanceHistory → ${result.items.length} days`,
      );
      return result;
    } catch (e) {
      throw mapAndLog(e, 'getTeamAttendanceHistory');
    }
  }
}

const mapAndLog = (e: unknown, label: string) => {
  const mapped = mapHttpErrorToManagement(e);
  managementLog.error('repository', `${label} failed (code=${mapped.mgmtCode})`);
  return mapped;
};

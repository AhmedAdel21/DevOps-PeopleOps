import { UseCase } from '@/domain/use_cases/use_case.base';
import type { Attendance } from '@/domain/entities';
import type { AttendanceRepository } from '@/domain/repositories';
import { attendanceLog } from '@/core/logger';

export class GetAttendanceStatusUseCase extends UseCase<void, Attendance> {
  constructor(private readonly repo: AttendanceRepository) {
    super();
  }

  async execute(): Promise<Attendance> {
    attendanceLog.info('use_case', 'GetAttendanceStatusUseCase.execute →');
    try {
      const result = await this.repo.getCurrentStatus();
      attendanceLog.info(
        'use_case',
        `GetAttendanceStatusUseCase completed → status=${result.status}`,
      );
      return result;
    } catch (e) {
      attendanceLog.error(
        'use_case',
        'GetAttendanceStatusUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

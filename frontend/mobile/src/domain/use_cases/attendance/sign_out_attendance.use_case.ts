import { UseCase } from '@/domain/use_cases/use_case.base';
import type { Attendance } from '@/domain/entities';
import type { AttendanceRepository } from '@/domain/repositories';
import { attendanceLog } from '@/core/logger';

export class SignOutAttendanceUseCase extends UseCase<void, Attendance> {
  constructor(private readonly repo: AttendanceRepository) {
    super();
  }

  async execute(): Promise<Attendance> {
    attendanceLog.info('use_case', 'SignOutAttendanceUseCase.execute →');
    try {
      const result = await this.repo.signOut();
      attendanceLog.info(
        'use_case',
        `SignOutAttendanceUseCase completed → status=${result.status}`,
      );
      return result;
    } catch (e) {
      attendanceLog.error(
        'use_case',
        'SignOutAttendanceUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

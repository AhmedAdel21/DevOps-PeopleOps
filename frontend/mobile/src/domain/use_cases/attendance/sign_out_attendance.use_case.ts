import { UseCase } from '@/domain/use_cases/use_case.base';
import type { Attendance } from '@/domain/entities';
import type { AttendanceRepository } from '@/domain/repositories';
import type { Coordinates } from '@/core/location';
import { attendanceLog } from '@/core/logger';

export interface SignOutAttendanceInput {
  /** Foreground GPS coords captured by the screen before dispatch. */
  coordinates: Coordinates;
}

export class SignOutAttendanceUseCase extends UseCase<
  SignOutAttendanceInput,
  Attendance
> {
  constructor(private readonly repo: AttendanceRepository) {
    super();
  }

  async execute({ coordinates }: SignOutAttendanceInput): Promise<Attendance> {
    attendanceLog.info(
      'use_case',
      `SignOutAttendanceUseCase.execute → lat=${coordinates.latitude.toFixed(5)}, lng=${coordinates.longitude.toFixed(5)}`,
    );
    try {
      const result = await this.repo.signOut(coordinates);
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

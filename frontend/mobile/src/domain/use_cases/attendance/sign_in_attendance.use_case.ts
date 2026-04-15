import { UseCase } from '@/domain/use_cases/use_case.base';
import type { Attendance, AttendancePlace } from '@/domain/entities';
import type { AttendanceRepository } from '@/domain/repositories';
import { attendanceLog } from '@/core/logger';

export interface SignInAttendanceInput {
  place: AttendancePlace;
}

export class SignInAttendanceUseCase extends UseCase<
  SignInAttendanceInput,
  Attendance
> {
  constructor(private readonly repo: AttendanceRepository) {
    super();
  }

  async execute({ place }: SignInAttendanceInput): Promise<Attendance> {
    attendanceLog.info(
      'use_case',
      `SignInAttendanceUseCase.execute → place=${place}`,
    );
    try {
      const result = await this.repo.signIn(place);
      attendanceLog.info(
        'use_case',
        `SignInAttendanceUseCase completed → status=${result.status}`,
      );
      return result;
    } catch (e) {
      attendanceLog.error(
        'use_case',
        'SignInAttendanceUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}

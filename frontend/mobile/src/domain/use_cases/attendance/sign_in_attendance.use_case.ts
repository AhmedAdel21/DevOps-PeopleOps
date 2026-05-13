import { UseCase } from '@/domain/use_cases/use_case.base';
import type { Attendance, AttendancePlace } from '@/domain/entities';
import type { AttendanceRepository } from '@/domain/repositories';
import type { Coordinates } from '@/core/location';
import { attendanceLog } from '@/core/logger';

export interface SignInAttendanceInput {
  place: AttendancePlace;
  /** Foreground GPS coords captured by the screen before dispatch. */
  coordinates: Coordinates;
  /** Device-local moment the user confirmed sign-in. Optional; BE falls
   * back to server time when omitted. */
  signedInAt?: Date;
}

export class SignInAttendanceUseCase extends UseCase<
  SignInAttendanceInput,
  Attendance
> {
  constructor(private readonly repo: AttendanceRepository) {
    super();
  }

  async execute({
    place,
    coordinates,
    signedInAt,
  }: SignInAttendanceInput): Promise<Attendance> {
    attendanceLog.info(
      'use_case',
      `SignInAttendanceUseCase.execute → place=${place}, signedInAt=${signedInAt?.toISOString() ?? 'none'}, lat=${coordinates.latitude.toFixed(5)}, lng=${coordinates.longitude.toFixed(5)}`,
    );
    try {
      const result = await this.repo.signIn(place, coordinates, signedInAt);
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

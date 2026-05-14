import type {
  Attendance,
  AttendancePlace,
  AttendanceHistoryPage,
} from '@/domain/entities';
import type { AttendanceRepository } from '@/domain/repositories';
import type { Coordinates } from '@/core/location';
import { AttendanceRemoteDataSource } from '@/data/data_sources/attendance';
import { HttpError } from '@/data/data_sources/http';
import {
  employeeStatusDtoToDomain,
  mapHttpErrorToAttendance,
  placeToDto,
  attendanceHistoryResponseDtoToDomain,
} from '@/data/mappers/attendance';
import { attendanceLog } from '@/core/logger';

// BE returns 404 with no body when the caller has no row in today's
// snapshot. A 404 with `code: "employee_not_linked"` is a different,
// genuine error — keep that one throwing via the standard mapper.
const isNoCurrentRow404 = (e: unknown): boolean => {
  if (!(e instanceof HttpError) || e.status !== 404) return false;
  const body = e.body as { code?: unknown } | null;
  return body?.code !== 'employee_not_linked';
};

export class AttendanceRepositoryImpl implements AttendanceRepository {
  constructor(private readonly ds: AttendanceRemoteDataSource) {}

  async getCurrentStatus(): Promise<Attendance | null> {
    attendanceLog.info('repository', 'getCurrentStatus called');
    try {
      const dto = await this.ds.getCurrentStatus();
      const entity = employeeStatusDtoToDomain(dto);
      attendanceLog.info(
        'repository',
        `getCurrentStatus → status=${entity.status}`,
      );
      return entity;
    } catch (e) {
      if (isNoCurrentRow404(e)) {
        attendanceLog.info(
          'repository',
          'getCurrentStatus → 404 (no row for today, treating as not-signed-in)',
        );
        return null;
      }
      const mapped = mapHttpErrorToAttendance(e);
      attendanceLog.error(
        'repository',
        `getCurrentStatus failed (code=${mapped.attendanceCode})`,
      );
      throw mapped;
    }
  }

  async signIn(
    place: AttendancePlace,
    coordinates: Coordinates,
    signedInAt?: Date,
  ): Promise<Attendance> {
    attendanceLog.info(
      'repository',
      `signIn called (place=${place}, signedInAt=${signedInAt?.toISOString() ?? 'none'}, lat=${coordinates.latitude.toFixed(5)}, lng=${coordinates.longitude.toFixed(5)})`,
    );
    try {
      const dto = await this.ds.signIn(
        placeToDto(place),
        coordinates,
        signedInAt?.toISOString(),
      );
      const entity = employeeStatusDtoToDomain(dto);
      attendanceLog.info(
        'repository',
        `signIn succeeded → status=${entity.status}`,
      );
      return entity;
    } catch (e) {
      const mapped = mapHttpErrorToAttendance(e);
      attendanceLog.error(
        'repository',
        `signIn failed (code=${mapped.attendanceCode})`,
      );
      throw mapped;
    }
  }

  async signOut(coordinates: Coordinates): Promise<Attendance> {
    attendanceLog.info(
      'repository',
      `signOut called (lat=${coordinates.latitude.toFixed(5)}, lng=${coordinates.longitude.toFixed(5)})`,
    );
    try {
      const dto = await this.ds.signOut(coordinates);
      const entity = employeeStatusDtoToDomain(dto);
      attendanceLog.info(
        'repository',
        `signOut succeeded → status=${entity.status}`,
      );
      return entity;
    } catch (e) {
      const mapped = mapHttpErrorToAttendance(e);
      attendanceLog.error(
        'repository',
        `signOut failed (code=${mapped.attendanceCode})`,
      );
      throw mapped;
    }
  }

  async getHistory(params: { before?: string; pageSize?: number }): Promise<AttendanceHistoryPage> {
    attendanceLog.info(
      'repository',
      `getHistory called (before=${params.before ?? 'none'}, pageSize=${params.pageSize ?? 'default'})`,
    );
    try {
      const dto = await this.ds.getHistory(params);
      const page = attendanceHistoryResponseDtoToDomain(dto);
      attendanceLog.info('repository', `getHistory → ${page.items.length} items, nextCursor=${page.nextCursor ?? 'none'}`);
      return page;
    } catch (e) {
      const mapped = mapHttpErrorToAttendance(e);
      attendanceLog.error('repository', `getHistory failed (code=${mapped.attendanceCode})`);
      throw mapped;
    }
  }
}

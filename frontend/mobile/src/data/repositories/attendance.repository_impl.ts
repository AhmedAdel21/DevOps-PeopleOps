import type {
  Attendance,
  AttendancePlace,
  AttendanceHistoryPage,
} from '@/domain/entities';
import type { AttendanceRepository } from '@/domain/repositories';
import { AttendanceRemoteDataSource } from '@/data/data_sources/attendance';
import {
  employeeStatusDtoToDomain,
  mapHttpErrorToAttendance,
  placeToDto,
  attendanceHistoryResponseDtoToDomain,
} from '@/data/mappers/attendance';
import { attendanceLog } from '@/core/logger';

export class AttendanceRepositoryImpl implements AttendanceRepository {
  constructor(private readonly ds: AttendanceRemoteDataSource) {}

  async getCurrentStatus(): Promise<Attendance> {
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
      const mapped = mapHttpErrorToAttendance(e);
      attendanceLog.error(
        'repository',
        `getCurrentStatus failed (code=${mapped.attendanceCode})`,
      );
      throw mapped;
    }
  }

  async signIn(place: AttendancePlace): Promise<Attendance> {
    attendanceLog.info('repository', `signIn called (place=${place})`);
    try {
      const dto = await this.ds.signIn(placeToDto(place));
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

  async signOut(): Promise<Attendance> {
    attendanceLog.info('repository', 'signOut called');
    try {
      const dto = await this.ds.signOut();
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

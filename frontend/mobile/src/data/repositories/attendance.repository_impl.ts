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

  async getHistory(_params: { before?: string; pageSize?: number }): Promise<AttendanceHistoryPage> {
    // TODO: implement in data layer task
    throw new Error('AttendanceRepositoryImpl.getHistory not yet implemented');
  }
}

import type { AttendanceRecord, AttendanceHistoryPage, AttendanceRecordStatus, AttendanceRecordPlace } from '@/domain/entities';
import type { AttendanceRecordDto, AttendanceHistoryResponseDto } from '@/data/dtos/attendance';

const toDomainStatus = (raw: string): AttendanceRecordStatus => {
  switch (raw) {
    case 'InOffice':    return 'in_office';
    case 'Wfh':         return 'wfh';
    case 'SignedOut':   return 'signed_out';
    case 'Vacation':    return 'vacation';
    case 'Absent':      return 'absent';
    default:            return 'not_checked_in';
  }
};

const toDomainPlace = (raw: string | null): AttendanceRecordPlace | null => {
  if (raw === 'InOffice') return 'in_office';
  if (raw === 'Wfh')      return 'wfh';
  return null;
};

export const attendanceRecordDtoToDomain = (dto: AttendanceRecordDto): AttendanceRecord => ({
  date: dto.date,
  status: toDomainStatus(dto.status),
  place: toDomainPlace(dto.place),
  signInAt: dto.signInTime ? new Date(dto.signInTime) : null,
  signOutAt: dto.signOutTime ? new Date(dto.signOutTime) : null,
  workedMinutes: dto.workedMinutes,
});

export const attendanceHistoryResponseDtoToDomain = (
  dto: AttendanceHistoryResponseDto,
): AttendanceHistoryPage => ({
  items: dto.items.map(attendanceRecordDtoToDomain),
  nextCursor: dto.nextCursor,
});

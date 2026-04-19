import {
  attendanceRecordDtoToDomain,
  attendanceHistoryResponseDtoToDomain,
} from '../src/data/mappers/attendance/attendance_history.mapper';
import type { AttendanceRecordDto, AttendanceHistoryResponseDto } from '../src/data/dtos/attendance/attendance_history.dto';

test('maps InOffice record with all fields', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-15',
    status: 'InOffice',
    place: 'InOffice',
    signInTime: '2026-04-15T08:00:00Z',
    signOutTime: '2026-04-15T17:00:00Z',
    workedMinutes: 540,
  };
  const record = attendanceRecordDtoToDomain(dto);
  expect(record.date).toBe('2026-04-15');
  expect(record.status).toBe('in_office');
  expect(record.place).toBe('in_office');
  expect(record.signInAt).toEqual(new Date('2026-04-15T08:00:00Z'));
  expect(record.signOutAt).toEqual(new Date('2026-04-15T17:00:00Z'));
  expect(record.workedMinutes).toBe(540);
});

test('maps Wfh record', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-14',
    status: 'Wfh',
    place: 'Wfh',
    signInTime: '2026-04-14T09:00:00Z',
    signOutTime: null,
    workedMinutes: null,
  };
  const record = attendanceRecordDtoToDomain(dto);
  expect(record.status).toBe('wfh');
  expect(record.place).toBe('wfh');
  expect(record.signOutAt).toBeNull();
  expect(record.workedMinutes).toBeNull();
});

test('maps NotCheckedIn record with all nulls', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-13',
    status: 'NotCheckedIn',
    place: null,
    signInTime: null,
    signOutTime: null,
    workedMinutes: null,
  };
  const record = attendanceRecordDtoToDomain(dto);
  expect(record.status).toBe('not_checked_in');
  expect(record.place).toBeNull();
  expect(record.signInAt).toBeNull();
});

test('maps SignedOut status', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-12',
    status: 'SignedOut',
    place: 'InOffice',
    signInTime: '2026-04-12T08:00:00Z',
    signOutTime: '2026-04-12T16:00:00Z',
    workedMinutes: 480,
  };
  expect(attendanceRecordDtoToDomain(dto).status).toBe('signed_out');
});

test('maps Vacation status', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-11',
    status: 'Vacation',
    place: null,
    signInTime: null,
    signOutTime: null,
    workedMinutes: null,
  };
  expect(attendanceRecordDtoToDomain(dto).status).toBe('vacation');
});

test('maps Absent status', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-10',
    status: 'Absent',
    place: null,
    signInTime: null,
    signOutTime: null,
    workedMinutes: null,
  };
  expect(attendanceRecordDtoToDomain(dto).status).toBe('absent');
});

test('maps full history response with nextCursor', () => {
  const response: AttendanceHistoryResponseDto = {
    items: [
      { date: '2026-04-15', status: 'InOffice', place: 'InOffice', signInTime: '2026-04-15T08:00:00Z', signOutTime: '2026-04-15T17:00:00Z', workedMinutes: 540 },
      { date: '2026-04-14', status: 'NotCheckedIn', place: null, signInTime: null, signOutTime: null, workedMinutes: null },
    ],
    nextCursor: '2026-04-11',
  };
  const page = attendanceHistoryResponseDtoToDomain(response);
  expect(page.items).toHaveLength(2);
  expect(page.nextCursor).toBe('2026-04-11');
});

test('maps history response with null nextCursor (last page)', () => {
  const response: AttendanceHistoryResponseDto = {
    items: [],
    nextCursor: null,
  };
  const page = attendanceHistoryResponseDtoToDomain(response);
  expect(page.items).toHaveLength(0);
  expect(page.nextCursor).toBeNull();
});

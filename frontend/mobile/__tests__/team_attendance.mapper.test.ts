/**
 * Team Attendance mapper. The backend (`GET /api/v1/management/attendance/
 * history?from&to`) returns `AttendanceHistoryDto` — a range bundle, not the
 * per-day roster the design (EfKE5/dcnNd) shows. Deriving the day's summary
 * chips + per-employee rows (status, late, "Since 8:30 AM" / "· 8h worked")
 * from that bundle is real logic → unit-tested. DTO field copying / repath
 * is structural and not tested (per the established line).
 */
import {
  formatTeamStatusLabel,
  formatHoursWorked,
  attendanceHistoryToTeamDay,
} from '../src/data/mappers/team_attendance/team_attendance.mapper';
import type {
  AttendanceHistoryDto,
  EmployeeDayRecordDto,
} from '../src/data/dtos/team_attendance';

// ── formatHoursWorked ───────────────────────────────────────────────────────
// Backend `hoursWorked` is a float (.NET hours-as-decimal); render h/m.
describe('formatHoursWorked', () => {
  it('whole vs fractional hours', () => {
    expect(formatHoursWorked(8)).toBe('8h');
    expect(formatHoursWorked(8.5)).toBe('8h 30m');
    expect(formatHoursWorked(7.25)).toBe('7h 15m');
    expect(formatHoursWorked(0)).toBe('0h');
  });
});

// ── formatTeamStatusLabel ───────────────────────────────────────────────────
describe('formatTeamStatusLabel', () => {
  it('Office / Remote show the sign-in clock', () => {
    expect(
      formatTeamStatusLabel('Office', false, '2026-04-08T08:30:00+03:00', null),
    ).toBe('Office · Since 8:30 AM');
    expect(
      formatTeamStatusLabel('Remote', false, '2026-04-08T09:15:00+03:00', null),
    ).toBe('Remote · Since 9:15 AM');
  });

  it('SignedOut prefers backend hoursWorked over a timestamp diff', () => {
    expect(
      formatTeamStatusLabel(
        'SignedOut',
        false,
        '2026-04-08T10:00:00+03:00',
        '2026-04-08T18:00:00+03:00',
        8,
      ),
    ).toBe('Signed out at 6:00 PM · 8h worked');
    expect(
      formatTeamStatusLabel(
        'SignedOut',
        false,
        '2026-04-08T09:00:00+03:00',
        '2026-04-08T16:30:00+03:00',
        7.5,
      ),
    ).toBe('Signed out at 4:30 PM · 7h 30m worked');
  });

  it('SignedOut falls back to the timestamp diff when hoursWorked is null', () => {
    expect(
      formatTeamStatusLabel(
        'SignedOut',
        false,
        '2026-04-08T10:00:00+03:00',
        '2026-04-08T18:00:00+03:00',
        null,
      ),
    ).toBe('Signed out at 6:00 PM · 8h worked');
  });

  it('fixed copy for Absent / OnLeave; midnight & noon clock', () => {
    expect(formatTeamStatusLabel('Absent', false, null, null)).toBe(
      'Absent today',
    );
    expect(formatTeamStatusLabel('OnLeave', false, null, null)).toBe(
      'On leave',
    );
    expect(
      formatTeamStatusLabel('Office', false, '2026-04-08T00:00:00+00:00', null),
    ).toContain('12:00 AM');
    expect(
      formatTeamStatusLabel('Office', false, '2026-04-08T12:00:00+00:00', null),
    ).toContain('12:00 PM');
  });
});

// ── attendanceHistoryToTeamDay ──────────────────────────────────────────────
const DATE = '2026-04-08';

const day = (over: Partial<EmployeeDayRecordDto>): EmployeeDayRecordDto => ({
  date: DATE,
  status: 'InOffice',
  place: null,
  signIn: '2026-04-08T08:30:00+03:00',
  signOut: null,
  hoursWorked: null,
  permissionType: null,
  permissionMarkedBy: null,
  permissionMinutes: 0,
  vacationMarkedBy: null,
  expectedWorkMinutes: 480,
  unexcusedLateMinutes: 0,
  unexcusedEarlyLeaveMinutes: 0,
  ...over,
});

const baseEmp = (slackUserId: string, displayName: string) => ({
  slackUserId,
  displayName,
  avatarUrl: null,
  departmentId: 'd_eng',
  totalDays: 1,
  daysInOffice: 1,
  daysWfh: 0,
  daysSignedOut: 0,
  daysAbsent: 0,
  avgHoursWorked: null,
  excusedLateDays: 0,
  excusedLateMinutes: 0,
  excusedEarlyLeaveDays: 0,
  excusedEarlyLeaveMinutes: 0,
  unexcusedLateDays: 0,
  unexcusedLateMinutes: 0,
  unexcusedEarlyLeaveDays: 0,
  unexcusedEarlyLeaveMinutes: 0,
  fulfillmentRate: null,
  days: [] as EmployeeDayRecordDto[],
});

const dto: AttendanceHistoryDto = {
  workingDates: [DATE],
  dailyStats: [
    {
      date: DATE,
      inOffice: 9,
      wfh: 2,
      absent: 1,
      total: 12,
      permissionCount: 0,
      lateMinutes: 12,
      earlyLeaveMinutes: 0,
    },
  ],
  employees: [
    { ...baseEmp('U_AHMED', 'Ahmed El-Sayed'), days: [day({ status: 'InOffice' })] },
    {
      ...baseEmp('U_NOUR', 'Nour Khaled'),
      days: [day({ status: 'Wfh', signIn: '2026-04-08T09:15:00+03:00' })],
    },
    {
      ...baseEmp('U_OMAR', 'Omar Mostafa'),
      days: [
        day({
          status: 'InOffice',
          signIn: '2026-04-08T09:45:00+03:00',
          unexcusedLateMinutes: 15,
        }),
      ],
    },
    {
      ...baseEmp('U_YOUSSEF', 'Youssef Samir'),
      days: [
        day({
          status: 'SignedOut',
          signIn: '2026-04-08T10:00:00+03:00',
          signOut: '2026-04-08T18:00:00+03:00',
          hoursWorked: 8,
        }),
      ],
    },
    {
      ...baseEmp('U_LAYLA', 'Layla Hassan'),
      days: [day({ status: 'Vacation', signIn: null })],
    },
    // No day record for DATE → synthesized Absent row.
    { ...baseEmp('U_HANA', 'Hana Ali'), days: [] },
  ],
};

describe('attendanceHistoryToTeamDay', () => {
  it('derives the day summary from dailyStats + employee day records', () => {
    const result = attendanceHistoryToTeamDay(dto, DATE);
    expect(result.date).toBe(DATE);
    expect(result.summary).toEqual({
      inOffice: 9, // dailyStats.inOffice
      remote: 2, // dailyStats.wfh
      absent: 1, // dailyStats.absent
      late: 1, // Omar: unexcusedLateMinutes > 0
      notSignedIn: 0, // backend has no NotSignedIn — folded into Absent
      onLeave: 1, // Layla: status === 'Vacation'
    });
  });

  it('zeroes the summary when no dailyStats entry exists for the date', () => {
    const result = attendanceHistoryToTeamDay(dto, '2026-04-09');
    expect(result.summary).toEqual({
      inOffice: 0,
      remote: 0,
      absent: 0,
      late: 0,
      notSignedIn: 0,
      onLeave: 0,
    });
  });

  it('maps every wire status; unknown → Absent; isLate from late minutes', () => {
    const rows = attendanceHistoryToTeamDay(dto, DATE).rows;
    const byId = Object.fromEntries(rows.map(r => [r.userId, r]));
    expect(byId.U_AHMED.status).toBe('Office');
    expect(byId.U_NOUR.status).toBe('Remote');
    expect(byId.U_OMAR.status).toBe('Office');
    expect(byId.U_OMAR.isLate).toBe(true);
    expect(byId.U_YOUSSEF.status).toBe('SignedOut');
    expect(byId.U_LAYLA.status).toBe('OnLeave');

    const weird = attendanceHistoryToTeamDay(
      {
        ...dto,
        employees: [
          { ...baseEmp('U_X', 'X Y'), days: [day({ status: 'Teleporting' })] },
        ],
      },
      DATE,
    );
    expect(weird.rows[0].status).toBe('Absent');
  });

  it('synthesizes an Absent row for an employee with no record that day', () => {
    const hana = attendanceHistoryToTeamDay(dto, DATE).rows.find(
      r => r.userId === 'U_HANA',
    )!;
    expect(hana.status).toBe('Absent');
    expect(hana.isLate).toBe(false);
    expect(hana.signedInAt).toBeNull();
    expect(hana.statusLabel).toBe('Absent today');
  });

  it('derives avatar initials and collapses userId → slackUserId', () => {
    const ahmed = attendanceHistoryToTeamDay(dto, DATE).rows.find(
      r => r.userId === 'U_AHMED',
    )!;
    expect(ahmed.userId).toBe('U_AHMED');
    expect(ahmed.slackUserId).toBe('U_AHMED');
    expect(ahmed.avatarInitials).toBe('AE');
    expect(ahmed.statusLabel).toBe('Office · Since 8:30 AM');
  });

  it('uses backend hoursWorked for the SignedOut worked-time suffix', () => {
    const y = attendanceHistoryToTeamDay(dto, DATE).rows.find(
      r => r.userId === 'U_YOUSSEF',
    )!;
    expect(y.statusLabel).toBe('Signed out at 6:00 PM · 8h worked');
  });
});

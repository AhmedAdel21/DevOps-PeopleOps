/**
 * Team Attendance mapper. The backend (`GET /api/v1/management/attendance/
 * team-day?date=…`) returns a slim per-day shape — one record per
 * employee, no nested day arrays, no aggregate counters the mobile screen
 * doesn't render. The mapper translates wire status/place strings into
 * the domain enum + formats the row sub-text label. That formatting +
 * mapping is real logic and unit-tested here.
 */
import {
  formatTeamStatusLabel,
  formatHoursWorked,
  teamDayDtoToTeamDay,
} from '../src/data/mappers/team_attendance/team_attendance.mapper';
import type {
  TeamDayDto,
  TeamDayEmployeeDto,
} from '../src/data/dtos/team_attendance';

// ── formatHoursWorked ───────────────────────────────────────────────────────
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
  it('Office / Remote show the sign-in clock; Remote reads as "Home"', () => {
    expect(
      formatTeamStatusLabel('Office', false, '2026-04-08T08:30:00+03:00', null),
    ).toBe('Office · Since 8:30 AM');
    expect(
      formatTeamStatusLabel('Remote', false, '2026-04-08T09:15:00+03:00', null),
    ).toBe('Home · Since 9:15 AM');
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

  it('fixed copy for OnLeave / NotSignedIn; midnight & noon clock', () => {
    expect(formatTeamStatusLabel('OnLeave', false, null, null)).toBe('On leave');
    expect(formatTeamStatusLabel('NotSignedIn', false, null, null)).toBe(
      'Not checked in',
    );
    expect(
      formatTeamStatusLabel('Office', false, '2026-04-08T00:00:00+00:00', null),
    ).toContain('12:00 AM');
    expect(
      formatTeamStatusLabel('Office', false, '2026-04-08T12:00:00+00:00', null),
    ).toContain('12:00 PM');
  });
});

// ── teamDayDtoToTeamDay ─────────────────────────────────────────────────────
const DATE = '2026-04-08';

const emp = (over: Partial<TeamDayEmployeeDto>): TeamDayEmployeeDto => ({
  empCode: 'E_X',
  displayName: 'X Y',
  avatarUrl: null,
  departmentId: 'd_eng',
  status: 'office',
  place: null,
  signIn: '2026-04-08T08:30:00+03:00',
  signOut: null,
  hoursWorked: null,
  isLate: false,
  ...over,
});

const dto: TeamDayDto = {
  date: DATE,
  summary: {
    office: 2,
    home: 1,
    vacation: 1,
    notCheckedIn: 1,
    signedOut: 1,
    late: 1,
    total: 6,
  },
  employees: [
    emp({ empCode: 'E_AHMED', displayName: 'Ahmed El-Sayed',
          status: 'office', place: 'office' }),
    emp({ empCode: 'E_NOUR', displayName: 'Nour Khaled',
          status: 'home', place: 'home',
          signIn: '2026-04-08T09:15:00+03:00' }),
    emp({ empCode: 'E_OMAR', displayName: 'Omar Mostafa',
          status: 'office', place: 'office',
          signIn: '2026-04-08T09:45:00+03:00', isLate: true }),
    emp({ empCode: 'E_YOUSSEF', displayName: 'Youssef Samir',
          status: 'signedOut', place: 'office',
          signIn: '2026-04-08T10:00:00+03:00',
          signOut: '2026-04-08T18:00:00+03:00', hoursWorked: 8 }),
    emp({ empCode: 'E_LAYLA', displayName: 'Layla Hassan',
          status: 'vacation', place: null, signIn: null }),
    emp({ empCode: 'E_HANA', displayName: 'Hana Ali',
          status: 'notCheckedIn', place: null, signIn: null,
          avatarUrl: 'https://example.test/hana.jpg' }),
  ],
};

describe('teamDayDtoToTeamDay', () => {
  it('routes summary counters into the domain shape (notCheckedIn → notSignedIn, vacation → onLeave)', () => {
    const result = teamDayDtoToTeamDay(dto);
    expect(result.date).toBe(DATE);
    expect(result.summary).toEqual({
      inOffice: 2,        // summary.office
      remote: 1,          // summary.home
      absent: 0,          // legacy domain field, no wire counterpart
      late: 1,            // summary.late
      notSignedIn: 1,     // summary.notCheckedIn
      onLeave: 1,         // summary.vacation
    });
  });

  it('maps every wire status; unknown → NotSignedIn; isLate passes through', () => {
    const rows = teamDayDtoToTeamDay(dto).rows;
    const byId = Object.fromEntries(rows.map(r => [r.userId, r]));
    expect(byId.U_AHMED.status).toBe('Office');
    expect(byId.U_NOUR.status).toBe('Remote');
    expect(byId.U_OMAR.status).toBe('Office');
    expect(byId.U_OMAR.isLate).toBe(true);
    expect(byId.U_YOUSSEF.status).toBe('SignedOut');
    expect(byId.U_LAYLA.status).toBe('OnLeave');
    expect(byId.U_HANA.status).toBe('NotSignedIn');

    const weird = teamDayDtoToTeamDay({
      ...dto,
      employees: [emp({ status: 'Teleporting' })],
    });
    expect(weird.rows[0].status).toBe('NotSignedIn');
  });

  it('maps an explicit notCheckedIn record to NotSignedIn with the new label', () => {
    const hana = teamDayDtoToTeamDay(dto).rows.find(
      r => r.userId === 'E_HANA',
    )!;
    expect(hana.status).toBe('NotSignedIn');
    expect(hana.isLate).toBe(false);
    expect(hana.signedInAt).toBeNull();
    expect(hana.statusLabel).toBe('Not checked in');
    expect(hana.place).toBeNull();
  });

  it('preserves place across a SignedOut collapse so the chip can still render Office/Home', () => {
    const d: TeamDayDto = {
      ...dto,
      employees: [
        emp({ empCode: 'E_OFFICE', status: 'office', place: 'office' }),
        emp({ empCode: 'E_HOME',   status: 'home',   place: 'home' }),
        emp({ empCode: 'E_SO_OFF', status: 'signedOut', place: 'office',
              signOut: '2026-04-08T18:00:00+03:00', hoursWorked: 8 }),
        emp({ empCode: 'E_SO_HOM', status: 'signedOut', place: 'home',
              signOut: '2026-04-08T17:00:00+03:00', hoursWorked: 7 }),
        emp({ empCode: 'E_NCI',    status: 'notCheckedIn', place: null,
              signIn: null }),
        emp({ empCode: 'U_WEIRD',  status: 'office', place: 'Teleporting' }),
      ],
    };
    const byId = Object.fromEntries(
      teamDayDtoToTeamDay(d).rows.map(r => [r.userId, r]),
    );
    expect(byId.U_OFFICE.place).toBe('Office');
    expect(byId.U_HOME.place).toBe('Remote');
    expect(byId.U_SO_OFF.status).toBe('SignedOut');
    expect(byId.U_SO_OFF.place).toBe('Office');
    expect(byId.U_SO_HOM.status).toBe('SignedOut');
    expect(byId.U_SO_HOM.place).toBe('Remote');
    expect(byId.U_NCI.place).toBeNull();
    expect(byId.U_WEIRD.place).toBeNull(); // unknown wire place → null
  });

  it('pipes avatarUrl through unchanged and derives initials from displayName', () => {
    const rows = teamDayDtoToTeamDay(dto).rows;
    const ahmed = rows.find(r => r.userId === 'E_AHMED')!;
    const hana = rows.find(r => r.userId === 'E_HANA')!;
    expect(ahmed.avatarUrl).toBeNull();
    expect(ahmed.avatarInitials).toBe('AE');
    expect(hana.avatarUrl).toBe('https://example.test/hana.jpg');
    expect(hana.avatarInitials).toBe('HA');
  });

  it('uses backend hoursWorked for the SignedOut worked-time suffix', () => {
    const y = teamDayDtoToTeamDay(dto).rows.find(
      r => r.userId === 'E_YOUSSEF',
    )!;
    expect(y.statusLabel).toBe('Signed out at 6:00 PM · 8h worked');
  });
});

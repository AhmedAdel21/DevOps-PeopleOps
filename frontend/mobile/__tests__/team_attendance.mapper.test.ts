/**
 * Team Attendance mapper — the status-label formatter is real logic
 * (time formatting, worked-hours math, per-status copy that must match the
 * design verbatim), so it is unit-tested. DTO→entity field copying is
 * structural and only smoke-checked.
 */
import {
  formatTeamStatusLabel,
  teamAttendanceDayDtoToDomain,
} from '../src/data/mappers/team_attendance/team_attendance.mapper';
import type { TeamAttendanceDayDto } from '../src/data/dtos/team_attendance';

describe('formatTeamStatusLabel', () => {
  it('Office → "Office · Since 8:30 AM"', () => {
    expect(
      formatTeamStatusLabel('Office', false, '2026-04-08T08:30:00+03:00', null),
    ).toBe('Office · Since 8:30 AM');
  });

  it('Remote → "Remote · Since 9:15 AM"', () => {
    expect(
      formatTeamStatusLabel('Remote', false, '2026-04-08T09:15:00+03:00', null),
    ).toBe('Remote · Since 9:15 AM');
  });

  it('SignedOut → "Signed out at 6:00 PM · 8h worked"', () => {
    expect(
      formatTeamStatusLabel(
        'SignedOut',
        false,
        '2026-04-08T10:00:00+03:00',
        '2026-04-08T18:00:00+03:00',
      ),
    ).toBe('Signed out at 6:00 PM · 8h worked');
  });

  it('SignedOut with a partial hour → "7h 30m worked"', () => {
    expect(
      formatTeamStatusLabel(
        'SignedOut',
        false,
        '2026-04-08T09:00:00+03:00',
        '2026-04-08T16:30:00+03:00',
      ),
    ).toBe('Signed out at 4:30 PM · 7h 30m worked');
  });

  it('Absent / NotSignedIn / OnLeave use fixed copy', () => {
    expect(formatTeamStatusLabel('Absent', false, null, null)).toBe('Absent today');
    expect(formatTeamStatusLabel('NotSignedIn', false, null, null)).toBe('Not signed in');
    expect(formatTeamStatusLabel('OnLeave', false, null, null)).toBe('On leave');
  });

  it('midnight formats as 12:00 AM, noon as 12:00 PM', () => {
    expect(
      formatTeamStatusLabel('Office', false, '2026-04-08T00:00:00+00:00', null),
    ).toContain('12:00 AM');
    expect(
      formatTeamStatusLabel('Office', false, '2026-04-08T12:00:00+00:00', null),
    ).toContain('12:00 PM');
  });
});

describe('teamAttendanceDayDtoToDomain', () => {
  const dto: TeamAttendanceDayDto = {
    date: '2026-04-08',
    summary: { inOffice: 9, remote: 2, absent: 1, late: 0, notSignedIn: 0, onLeave: 0 },
    rows: [
      {
        userId: 'u1', slackUserId: null, displayName: 'Hana Ali',
        avatarInitials: 'HA', avatarColorHex: null,
        departmentId: 'd_eng', departmentName: 'Engineering',
        status: 'NotSignedIn', isLate: false,
        signedInAt: null, signedOutAt: null,
        // no statusLabel → mapper must derive it
      },
      {
        userId: 'u2', slackUserId: 'U1', displayName: 'Omar M',
        avatarInitials: 'OM', avatarColorHex: '#5559D6',
        departmentId: 'd_eng', departmentName: 'Engineering',
        status: 'Office', isLate: true,
        signedInAt: '2026-04-08T09:45:00+03:00', signedOutAt: null,
        statusLabel: 'Office · Since 9:45 AM', // BE-provided → used verbatim
      },
    ],
  };

  it('copies fields, derives missing labels, keeps BE label, validates status', () => {
    const day = teamAttendanceDayDtoToDomain(dto);
    expect(day.date).toBe('2026-04-08');
    expect(day.summary.inOffice).toBe(9);
    expect(day.rows[0].statusLabel).toBe('Not signed in'); // derived
    expect(day.rows[1].statusLabel).toBe('Office · Since 9:45 AM'); // verbatim
    expect(day.rows[1].isLate).toBe(true);
    expect(day.rows[0].status).toBe('NotSignedIn');
  });

  it('falls back to NotSignedIn for an unknown BE status string', () => {
    const weird = {
      ...dto,
      rows: [{ ...dto.rows[0], status: 'Teleporting' }],
    };
    expect(teamAttendanceDayDtoToDomain(weird).rows[0].status).toBe('NotSignedIn');
  });
});

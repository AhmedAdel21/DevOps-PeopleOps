import type {
  TeamAttendanceDay,
  TeamAttendanceRow,
  TeamAttendanceStatus,
} from '@/domain/entities';
import type {
  TeamDayDto,
  TeamDayEmployeeDto,
} from '@/data/dtos/team_attendance';

/**
 * The mobile-only endpoint `/api/v1/management/attendance/team-day?date=…`
 * returns a per-day shape with one record per employee — no working-dates
 * array, no nested per-employee days, no aggregate counters the screen
 * doesn't render. Mapping is now a straight 1-to-1 translation of wire
 * values into the domain entity. Real logic — status/place mapping,
 * status-label formatting — is unit-tested in
 * `__tests__/team_attendance.mapper.test.ts`.
 */

// ── Status mapping (wire → domain) ──────────────────────────────────────────
// Wire vocabulary (lowercase, mirrors the web dashboard):
//   office | home | signedOut | vacation | notCheckedIn.
const STATUS_MAP: Record<string, TeamAttendanceStatus> = {
  office: 'Office',
  home: 'Remote',
  signedOut: 'SignedOut',
  vacation: 'OnLeave',
  notCheckedIn: 'NotSignedIn',
};

const toStatus = (raw: string | null | undefined): TeamAttendanceStatus =>
  (raw && STATUS_MAP[raw]) || 'NotSignedIn';

// Wire `place` is lowercase too (`office | home | null`). Kept separate
// from STATUS_MAP because `place` survives a SignedOut status collapse.
const PLACE_MAP: Record<string, 'Office' | 'Remote'> = {
  office: 'Office',
  home: 'Remote',
};

const toPlace = (
  raw: string | null | undefined,
): 'Office' | 'Remote' | null => (raw && PLACE_MAP[raw]) || null;

const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

/**
 * Wall-clock "h:mm AM/PM" from an ISO string. The BE writes the literal
 * HH:mm in the offset-bearing string, so we read it textually rather than
 * via `Date.getHours()` — keeps the label stable regardless of the JS
 * runtime timezone (jest/node).
 */
const clockFromIso = (iso: string): string => {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return '';
  const h = Number(m[1]);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${period}`;
};

/** Decimal hours → "8h" / "8h 30m" (backend `hoursWorked` is a float). */
export function formatHoursWorked(hours: number): string {
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Worked-time label from two ISO timestamps (offset-aware fallback when
 *  the backend doesn't supply `hoursWorked`). */
const workedLabelFromTimestamps = (
  signedInAt: string,
  signedOutAt: string,
): string => {
  const mins = Math.max(
    0,
    Math.round((Date.parse(signedOutAt) - Date.parse(signedInAt)) / 60000),
  );
  return `${formatHoursWorked(mins / 60)} worked`;
};

/**
 * Per-status label matching the designs verbatim (EfKE5/dcnNd). `isLate`
 * is intentionally NOT reflected here — the design shows a separate red
 * "Late" badge. For SignedOut rows the backend `hoursWorked` is preferred;
 * the timestamp diff is only a fallback when it's absent.
 */
export function formatTeamStatusLabel(
  status: TeamAttendanceStatus,
  _isLate: boolean,
  signedInAt: string | null,
  signedOutAt: string | null,
  hoursWorked?: number | null,
): string {
  switch (status) {
    case 'Office':
      return signedInAt
        ? `Office · Since ${clockFromIso(signedInAt)}`
        : 'Office';
    case 'Remote':
      // Domain status stays `Remote` for back-compat, but the row label
      // reads "Home" per the four-badge spec (Office / Home / Vacation /
      // Not Checked In). i18n labels for the chip badge are updated too.
      return signedInAt
        ? `Home · Since ${clockFromIso(signedInAt)}`
        : 'Home';
    case 'SignedOut': {
      if (!signedOutAt) return 'Signed out';
      const worked =
        hoursWorked != null
          ? `${formatHoursWorked(hoursWorked)} worked`
          : signedInAt
            ? workedLabelFromTimestamps(signedInAt, signedOutAt)
            : null;
      return worked
        ? `Signed out at ${clockFromIso(signedOutAt)} · ${worked}`
        : `Signed out at ${clockFromIso(signedOutAt)}`;
    }
    case 'Absent':
      return 'Absent today';
    case 'OnLeave':
      return 'On leave';
    case 'NotSignedIn':
    default:
      return 'Not checked in';
  }
}

// ── TeamDayDto → domain ─────────────────────────────────────────────────────

const employeeToRow = (emp: TeamDayEmployeeDto): TeamAttendanceRow => {
  const status = toStatus(emp.status);
  return {
    empCode: emp.empCode,
    displayName: emp.displayName,
    avatarUrl: emp.avatarUrl,
    avatarInitials: initials(emp.displayName),
    avatarColorHex: null,
    departmentId: emp.departmentId,
    departmentName: null, // no name source — dcnNd dept sub-label trimmed
    status,
    place: toPlace(emp.place),
    isLate: emp.isLate,
    signedInAt: emp.signIn,
    signedOutAt: emp.signOut,
    statusLabel: formatTeamStatusLabel(
      status,
      emp.isLate,
      emp.signIn,
      emp.signOut,
      emp.hoursWorked,
    ),
  };
};

/**
 * Turn a `TeamDayDto` from the slim mobile endpoint into the domain
 * `TeamAttendanceDay` the screen renders. Summary chips read straight off
 * the BE-computed counters — no client-side re-counting needed.
 */
export const teamDayDtoToTeamDay = (dto: TeamDayDto): TeamAttendanceDay => ({
  date: dto.date,
  summary: {
    inOffice: dto.summary.office,
    remote: dto.summary.home,
    // `absent` is kept on the domain entity for back-compat but the BE no
    // longer emits an "absent" bucket — route the new counter to
    // `notSignedIn` and zero `absent`.
    absent: 0,
    late: dto.summary.late,
    notSignedIn: dto.summary.notCheckedIn,
    onLeave: dto.summary.vacation,
  },
  rows: dto.employees.map(employeeToRow),
});

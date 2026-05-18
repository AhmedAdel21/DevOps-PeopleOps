import type {
  TeamAttendanceDay,
  TeamAttendanceRow,
  TeamAttendanceStatus,
} from '@/domain/entities';
import type {
  AttendanceHistoryDto,
  EmployeeDayRecordDto,
  EmployeeSummaryDto,
} from '@/data/dtos/team_attendance';

/**
 * The backend returns `AttendanceHistoryDto` for a *date range* — never the
 * per-day, per-employee roster the design (EfKE5/dcnNd) needs. The Team tab
 * queries `from=to=selectedDate`; everything the screen renders (summary
 * chips, per-row status pill, "Since 8:30 AM" / "· 8h worked", Late badge)
 * is derived here. Real logic → unit-tested
 * (`__tests__/team_attendance.mapper.test.ts`).
 */

// ── Status mapping (wire → domain) ──────────────────────────────────────────
// Backend statuses: InOffice | Wfh | SignedOut | Absent | Vacation.
// The backend has no "NotSignedIn" — a not-yet-signed-in employee is Absent.
const STATUS_MAP: Record<string, TeamAttendanceStatus> = {
  InOffice: 'Office',
  Wfh: 'Remote',
  SignedOut: 'SignedOut',
  Absent: 'Absent',
  Vacation: 'OnLeave',
};

const toStatus = (raw: string | null | undefined): TeamAttendanceStatus =>
  (raw && STATUS_MAP[raw]) || 'Absent';

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
      return signedInAt
        ? `Remote · Since ${clockFromIso(signedInAt)}`
        : 'Remote';
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
      return 'Not signed in';
  }
}

// ── AttendanceHistoryDto → one day's roster ─────────────────────────────────

const employeeDayToRow = (
  emp: EmployeeSummaryDto,
  rec: EmployeeDayRecordDto | undefined,
): TeamAttendanceRow => {
  const status = rec ? toStatus(rec.status) : 'Absent';
  const isLate = (rec?.unexcusedLateMinutes ?? 0) > 0;
  const signedInAt = rec?.signIn ?? null;
  const signedOutAt = rec?.signOut ?? null;
  return {
    // Backend exposes only `slackUserId`; the row entity carries both a
    // `userId` and `slackUserId` — collapse them onto the same value.
    userId: emp.slackUserId,
    slackUserId: emp.slackUserId,
    displayName: emp.displayName,
    avatarInitials: initials(emp.displayName),
    avatarColorHex: null,
    departmentId: emp.departmentId,
    departmentName: null, // no name source — dcnNd dept sub-label trimmed
    status,
    isLate,
    signedInAt,
    signedOutAt,
    statusLabel: formatTeamStatusLabel(
      status,
      isLate,
      signedInAt,
      signedOutAt,
      rec?.hoursWorked ?? null,
    ),
  };
};

/**
 * Derive the design's per-day roster for `date` from the range bundle.
 * Summary chips come from `dailyStats[date]`; Late/OnLeave are counted
 * from the employees' day records; rows are one per employee (a missing
 * record for `date` → an Absent row).
 */
export const attendanceHistoryToTeamDay = (
  dto: AttendanceHistoryDto,
  date: string,
): TeamAttendanceDay => {
  const stats = dto.dailyStats.find(s => s.date === date) ?? null;

  const dayRecOf = (emp: EmployeeSummaryDto) =>
    emp.days.find(d => d.date === date);

  let late = 0;
  let onLeave = 0;
  const rows = dto.employees.map(emp => {
    const rec = dayRecOf(emp);
    if (rec) {
      if ((rec.unexcusedLateMinutes ?? 0) > 0) late += 1;
      if (rec.status === 'Vacation') onLeave += 1;
    }
    return employeeDayToRow(emp, rec);
  });

  return {
    date,
    summary: {
      inOffice: stats?.inOffice ?? 0,
      remote: stats?.wfh ?? 0,
      absent: stats?.absent ?? 0,
      late,
      // Backend has no NotSignedIn status — folded into Absent.
      notSignedIn: 0,
      onLeave,
    },
    rows,
  };
};

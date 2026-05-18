import type {
  TeamAttendanceDay,
  TeamAttendanceHistoryPage,
  TeamAttendanceRow,
  TeamAttendanceStatus,
} from '@/domain/entities';
import type {
  TeamAttendanceDayDto,
  TeamAttendanceHistoryPageDto,
  TeamAttendanceRowDto,
} from '@/data/dtos/team_attendance';

const VALID_STATUSES: readonly TeamAttendanceStatus[] = [
  'Office',
  'Remote',
  'Absent',
  'SignedOut',
  'NotSignedIn',
  'OnLeave',
];

const toStatus = (raw: string): TeamAttendanceStatus =>
  (VALID_STATUSES as readonly string[]).includes(raw)
    ? (raw as TeamAttendanceStatus)
    : 'NotSignedIn';

/**
 * Wall-clock "h:mm AM/PM" from an ISO string. The BE already converts to
 * the viewer's TZ (contract §1), so we read the literal HH:mm written in
 * the string rather than `Date.getHours()` — that keeps the label stable
 * regardless of the JS runtime timezone (jest/node).
 */
const clockFromIso = (iso: string): string => {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return '';
  const h = Number(m[1]);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${period}`;
};

/** Inclusive worked-time label from two ISO timestamps (offset-aware). */
const workedLabel = (signedInAt: string, signedOutAt: string): string => {
  const mins = Math.max(
    0,
    Math.round((Date.parse(signedOutAt) - Date.parse(signedInAt)) / 60000),
  );
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hm = m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${hm} worked`;
};

/**
 * Per-status label matching the designs verbatim (EfKE5/dcnNd). Used only
 * when the BE doesn't supply `statusLabel`. `isLate` is intentionally NOT
 * reflected here — the design shows a separate red "Late" badge.
 */
export function formatTeamStatusLabel(
  status: TeamAttendanceStatus,
  _isLate: boolean,
  signedInAt: string | null,
  signedOutAt: string | null,
): string {
  switch (status) {
    case 'Office':
      return signedInAt ? `Office · Since ${clockFromIso(signedInAt)}` : 'Office';
    case 'Remote':
      return signedInAt ? `Remote · Since ${clockFromIso(signedInAt)}` : 'Remote';
    case 'SignedOut':
      if (signedOutAt && signedInAt) {
        return `Signed out at ${clockFromIso(signedOutAt)} · ${workedLabel(
          signedInAt,
          signedOutAt,
        )}`;
      }
      return signedOutAt
        ? `Signed out at ${clockFromIso(signedOutAt)}`
        : 'Signed out';
    case 'Absent':
      return 'Absent today';
    case 'OnLeave':
      return 'On leave';
    case 'NotSignedIn':
    default:
      return 'Not signed in';
  }
}

export const teamAttendanceRowDtoToDomain = (
  dto: TeamAttendanceRowDto,
): TeamAttendanceRow => {
  const status = toStatus(dto.status);
  const beLabel = dto.statusLabel?.trim();
  return {
    userId: dto.userId,
    slackUserId: dto.slackUserId,
    displayName: dto.displayName,
    avatarInitials: dto.avatarInitials,
    avatarColorHex: dto.avatarColorHex,
    departmentId: dto.departmentId,
    departmentName: dto.departmentName,
    status,
    isLate: dto.isLate,
    signedInAt: dto.signedInAt,
    signedOutAt: dto.signedOutAt,
    statusLabel:
      beLabel && beLabel.length > 0
        ? beLabel
        : formatTeamStatusLabel(
            status,
            dto.isLate,
            dto.signedInAt,
            dto.signedOutAt,
          ),
  };
};

export const teamAttendanceDayDtoToDomain = (
  dto: TeamAttendanceDayDto,
): TeamAttendanceDay => ({
  date: dto.date,
  summary: {
    inOffice: dto.summary.inOffice,
    remote: dto.summary.remote,
    absent: dto.summary.absent,
    late: dto.summary.late,
    notSignedIn: dto.summary.notSignedIn,
    onLeave: dto.summary.onLeave,
  },
  rows: dto.rows.map(teamAttendanceRowDtoToDomain),
});

export const teamAttendanceHistoryPageDtoToDomain = (
  dto: TeamAttendanceHistoryPageDto,
): TeamAttendanceHistoryPage => ({
  items: dto.items.map(teamAttendanceDayDtoToDomain),
  totalCount: dto.totalCount,
  page: dto.page,
  pageSize: dto.pageSize,
});

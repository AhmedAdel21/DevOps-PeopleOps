import type {
  SerializablePendingApprovalItem,
  SerializablePendingApprovalSection,
} from './team.slice';

/**
 * The backend `/management/requests/leaves` returns a flat paged list.
 * The Approvals design (QosTu) needs Overdue/Today/This-week sections +
 * "submitted N ago" + a date-range label, all client-derived. Pure +
 * unit-tested (`__tests__/team_approvals_mapping.test.ts`).
 */

/** Minimal structural input — maps from the leave-admin domain item. */
export interface ApprovalSource {
  id: string;
  employeeName: string;
  leaveTypeName: string;
  leaveTypeNameAr: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  totalDays: number;
  createdAt: string; // ISO 8601
  status: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** UTC date-part day number — deterministic regardless of the JS TZ. */
const dayNum = (isoOrDate: string): number => {
  const d = new Date(isoOrDate);
  const part = isNaN(d.getTime())
    ? isoOrDate.slice(0, 10)
    : d.toISOString().slice(0, 10);
  return Math.floor(Date.parse(`${part}T00:00:00Z`) / 86_400_000);
};

const daysAgo = (createdAtIso: string, now: number): number =>
  dayNum(new Date(now).toISOString()) - dayNum(createdAtIso);

const dmy = (yyyyMmDd: string): string => {
  const d = new Date(`${yyyyMmDd}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

const unit = (n: number): string => (n === 1 ? 'day' : 'days');

export const dateRangeLabel = (
  startDate: string,
  endDate: string,
  totalDays: number,
): string =>
  startDate === endDate || totalDays <= 1
    ? `${dmy(startDate)} · ${totalDays} ${unit(totalDays)}`
    : `${dmy(startDate)} – ${dmy(endDate)} · ${totalDays} ${unit(totalDays)}`;

export const submittedAgoLabel = (
  createdAtIso: string,
  now: number,
): string => {
  const n = daysAgo(createdAtIso, now);
  if (n <= 0) return 'Submitted today';
  if (n === 1) return 'Submitted yesterday';
  return `Submitted ${n} days ago`;
};

export type ApprovalSectionKey = 'overdue' | 'today' | 'thisWeek';

export const sectionKeyFor = (
  createdAtIso: string,
  now: number,
): ApprovalSectionKey => {
  const n = daysAgo(createdAtIso, now);
  if (n > 3) return 'overdue';
  if (n <= 0) return 'today';
  return 'thisWeek';
};

const SECTION_ORDER: ApprovalSectionKey[] = ['overdue', 'today', 'thisWeek'];
const SECTION_TITLE: Record<ApprovalSectionKey, string> = {
  overdue: 'Overdue (> 3 days)',
  today: "Today's requests",
  thisWeek: 'This week',
};

const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

export const groupPendingApprovals = (
  items: readonly ApprovalSource[],
  now: number = Date.now(),
): SerializablePendingApprovalSection[] => {
  const buckets: Record<ApprovalSectionKey, SerializablePendingApprovalItem[]> =
    { overdue: [], today: [], thisWeek: [] };

  for (const it of items) {
    buckets[sectionKeyFor(it.createdAt, now)].push({
      requestId: it.id,
      employeeName: it.employeeName,
      avatarInitials: initials(it.employeeName),
      avatarColorHex: null,
      unread: it.status === 'Pending',
      leaveTypeEn: it.leaveTypeName,
      leaveTypeAr: it.leaveTypeNameAr,
      dateRangeLabel: dateRangeLabel(it.startDate, it.endDate, it.totalDays),
      submittedAgoLabel: submittedAgoLabel(it.createdAt, now),
      submittedAt: it.createdAt,
    });
  }

  return SECTION_ORDER.filter(k => buckets[k].length > 0).map(k => ({
    key: k,
    title: SECTION_TITLE[k],
    items: buckets[k],
  }));
};

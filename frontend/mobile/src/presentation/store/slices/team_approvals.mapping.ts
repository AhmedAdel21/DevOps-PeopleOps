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

/** Minimal structural input — maps from the leave- or permission-admin
 *  domain item. Leaves derive the date-range label from the day span;
 *  permissions supply `dateRangeLabelOverride` (an hours-based label). */
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
  /** When set, used verbatim instead of the computed day-range label. */
  dateRangeLabelOverride?: string;
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

// ── Permission helpers (Approvals — Permissions tab) ────────────────────────
// `period` on a permission is HOURS (a float). Local h/m formatter — kept
// here rather than importing the data-layer `formatHoursWorked` so this
// presentation helper stays layer-clean (trivial duplication).
const hoursLabel = (hours: number): string => {
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/** Card sub-label for a permission row, e.g. "2h 30m · 5 Apr". The
 *  permission type is rendered separately (see permissionTypeLabels). */
export const formatPermissionPeriodLabel = (
  hours: number,
  fromDate: string,
): string => `${hoursLabel(hours)} · ${dmy(fromDate)}`;

const PERMISSION_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  LateAttendance: { en: 'Late attendance', ar: 'تأخير حضور' },
  EarlyLeave: { en: 'Early leave', ar: 'انصراف مبكر' },
};

/** BE `permissionTypeName` → bilingual display labels. Unknown types fall
 *  back to the raw name for both languages (BE sends single-language). */
export const permissionTypeLabels = (
  beTypeName: string,
): { en: string; ar: string } =>
  PERMISSION_TYPE_LABELS[beTypeName] ?? { en: beTypeName, ar: beTypeName };

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

// ── Balance impact (Approval Detail — design ynfPj) ─────────────────────────
// The backend `LeaveInfoModel` carries the employee's *current* Annual/Sick/
// Urgent balances. The design's "18 days → 13 days" block is derived: pick
// the balance matching the leave type, subtract the request period. Types
// with no tracked balance (Unpaid, etc.) → the block is hidden.

export interface LeaveBalanceInputs {
  leaveTypeName: string;
  totalDays: number;
  annual: number | null;
  sick: number | null;
  urgent: number | null;
}

export interface BalanceImpactView {
  leaveTypeLabel: string;
  beforeLabel: string;
  afterLabel: string;
}

const daysLabel = (n: number): string => `${n} ${Math.abs(n) === 1 ? 'day' : 'days'}`;

export const deriveBalanceImpact = (
  i: LeaveBalanceInputs,
): BalanceImpactView | null => {
  // Matches the BE's English `leaveTypeName` (LeaveInfoModel sends it
  // single-language; the AR name is a client map keyed by leaveTypeId).
  // If the BE ever localizes this field, switch to leaveTypeId matching —
  // otherwise the block silently disappears rather than mis-mapping.
  const name = i.leaveTypeName.toLowerCase();
  const before = name.includes('annual')
    ? i.annual
    : name.includes('sick')
      ? i.sick
      : name.includes('urgent')
        ? i.urgent
        : null;
  if (before == null) return null;
  return {
    leaveTypeLabel: i.leaveTypeName,
    beforeLabel: daysLabel(before),
    afterLabel: daysLabel(before - i.totalDays),
  };
};

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
      dateRangeLabel:
        it.dateRangeLabelOverride ??
        dateRangeLabel(it.startDate, it.endDate, it.totalDays),
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

/**
 * Client-side grouping/formatting for the Approvals segment. The backend
 * (/management/requests/leaves) returns a flat paged list — the design's
 * Overdue/Today/This-week sections, "submitted N ago", and date-range
 * labels are derived here. Real logic (date bucketing + relative time)
 * → unit-tested.
 */
import {
  dateRangeLabel,
  submittedAgoLabel,
  sectionKeyFor,
  groupPendingApprovals,
  deriveBalanceImpact,
  type ApprovalSource,
} from '../src/presentation/store/slices/team_approvals.mapping';

const NOW = Date.parse('2026-04-10T12:00:00+03:00');

describe('submittedAgoLabel', () => {
  it('today / yesterday / N days', () => {
    expect(submittedAgoLabel('2026-04-10T08:00:00+03:00', NOW)).toBe(
      'Submitted today',
    );
    expect(submittedAgoLabel('2026-04-09T08:00:00+03:00', NOW)).toBe(
      'Submitted yesterday',
    );
    expect(submittedAgoLabel('2026-04-05T08:00:00+03:00', NOW)).toBe(
      'Submitted 5 days ago',
    );
  });
});

describe('dateRangeLabel', () => {
  it('single day vs range', () => {
    expect(dateRangeLabel('2026-04-22', '2026-04-22', 1)).toBe(
      '22 Apr · 1 day',
    );
    expect(dateRangeLabel('2026-04-05', '2026-04-07', 3)).toBe(
      '5 Apr – 7 Apr · 3 days',
    );
  });
});

describe('sectionKeyFor', () => {
  it('overdue >3 days, else today/thisWeek', () => {
    expect(sectionKeyFor('2026-04-05T08:00:00+03:00', NOW)).toBe('overdue');
    expect(sectionKeyFor('2026-04-10T08:00:00+03:00', NOW)).toBe('today');
    expect(sectionKeyFor('2026-04-08T08:00:00+03:00', NOW)).toBe('thisWeek');
  });
});

describe('groupPendingApprovals', () => {
  const item = (over: Partial<ApprovalSource>): ApprovalSource => ({
    id: '1',
    employeeName: 'Mariam Abbas',
    leaveTypeName: 'Sick Leave',
    leaveTypeNameAr: 'إجازة مرضية',
    startDate: '2026-04-05',
    endDate: '2026-04-07',
    totalDays: 3,
    createdAt: '2026-04-05T10:00:00+03:00',
    status: 'Pending',
    ...over,
  });

  it('buckets into ordered non-empty sections with formatted items', () => {
    const sections = groupPendingApprovals(
      [
        item({ id: '1', createdAt: '2026-04-05T10:00:00+03:00' }), // overdue
        item({ id: '2', createdAt: '2026-04-10T09:00:00+03:00' }), // today
        item({ id: '3', createdAt: '2026-04-08T09:00:00+03:00' }), // thisWeek
      ],
      NOW,
    );
    expect(sections.map(s => s.key)).toEqual(['overdue', 'today', 'thisWeek']);
    const od = sections[0];
    expect(od.title).toBe('Overdue (> 3 days)');
    expect(od.items[0]).toMatchObject({
      requestId: '1',
      employeeName: 'Mariam Abbas',
      avatarInitials: 'MA',
      leaveTypeEn: 'Sick Leave',
      leaveTypeAr: 'إجازة مرضية',
      dateRangeLabel: '5 Apr – 7 Apr · 3 days',
      submittedAgoLabel: 'Submitted 5 days ago',
    });
  });

  it('omits empty sections and returns [] for no items', () => {
    expect(groupPendingApprovals([], NOW)).toEqual([]);
    const onlyToday = groupPendingApprovals(
      [item({ createdAt: '2026-04-10T09:00:00+03:00' })],
      NOW,
    );
    expect(onlyToday.map(s => s.key)).toEqual(['today']);
  });
});

describe('deriveBalanceImpact', () => {
  const base = {
    totalDays: 5,
    annual: 18,
    sick: 10,
    urgent: 3,
  };

  it('maps the leave type to its balance and subtracts the period', () => {
    expect(
      deriveBalanceImpact({ ...base, leaveTypeName: 'Annual Leave' }),
    ).toEqual({
      leaveTypeLabel: 'Annual Leave',
      beforeLabel: '18 days',
      afterLabel: '13 days',
    });
    expect(
      deriveBalanceImpact({ ...base, leaveTypeName: 'Sick Leave' }),
    ).toMatchObject({ beforeLabel: '10 days', afterLabel: '5 days' });
    expect(
      deriveBalanceImpact({ ...base, leaveTypeName: 'Urgent Leave' }),
    ).toMatchObject({ beforeLabel: '3 days', afterLabel: '-2 days' });
  });

  it('singularises a one-day balance', () => {
    expect(
      deriveBalanceImpact({
        ...base,
        leaveTypeName: 'Urgent',
        totalDays: 1,
        urgent: 1,
      }),
    ).toMatchObject({ beforeLabel: '1 day', afterLabel: '0 days' });
  });

  it('returns null when the type has no tracked balance', () => {
    expect(
      deriveBalanceImpact({ ...base, leaveTypeName: 'Unpaid Leave' }),
    ).toBeNull();
  });

  it('returns null when the matched balance is unknown (null)', () => {
    expect(
      deriveBalanceImpact({
        ...base,
        leaveTypeName: 'Sick Leave',
        sick: null,
      }),
    ).toBeNull();
  });
});

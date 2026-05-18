import type { HttpClient } from '@/data/data_sources/http';
import type {
  PendingApprovalSectionDto,
  PendingApprovalsPageDto,
} from '@/data/dtos/pending_approvals';
import { managementLog } from '@/core/logger';
import { AppConfig } from '@/di/config';

// ── Path (docs/team-api-contract.md §3.4) ───────────────────────────────────

const PENDING_APPROVALS = '/api/v1/admin/approvals/pending';

export type PendingApprovalRangeParam = 'all' | 'today' | 'week' | 'month';

export interface GetPendingApprovalsQuery {
  range?: PendingApprovalRangeParam;
  page?: number;
  pageSize?: number;
}

// ── Mock ────────────────────────────────────────────────────────────────────

/** Per contract §5 the aggregation rides `USE_MOCK_TEAM_ATTENDANCE` until
 *  the BE ships it (approve/reject already use the live leave-admin path). */
const useMock = (): boolean => AppConfig.USE_MOCK_TEAM_ATTENDANCE;

const mockDelay = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, AppConfig.MOCK_DELAY_MS));

/** Sample queue from design QosTu. Server-formatted labels verbatim. */
const MOCK_SECTIONS: PendingApprovalSectionDto[] = [
  {
    key: 'overdue',
    title: 'Overdue (> 3 days)',
    items: [
      {
        requestId: 'v_5001',
        employeeName: 'Mariam Abbas',
        avatarInitials: 'MA',
        avatarColorHex: '#D14545',
        unread: true,
        leaveTypeEn: 'Sick Leave',
        leaveTypeAr: 'إجازة مرضية',
        dateRangeLabel: '5 Apr – 7 Apr · 3 days',
        submittedAgoLabel: 'Submitted 5 days ago',
        submittedAt: '2026-04-05T10:12:00+03:00',
      },
    ],
  },
  {
    key: 'today',
    title: "Today's requests",
    items: [
      {
        requestId: 'v_5002',
        employeeName: 'Hassan Kamal',
        avatarInitials: 'HK',
        avatarColorHex: '#1F9D74',
        unread: true,
        leaveTypeEn: 'Annual Leave',
        leaveTypeAr: 'إجازة سنوية',
        dateRangeLabel: '20 Apr – 24 Apr · 5 days',
        submittedAgoLabel: 'Submitted 2 hours ago',
        submittedAt: '2026-04-08T07:30:00+03:00',
      },
      {
        requestId: 'v_5003',
        employeeName: 'Rania Adel',
        avatarInitials: 'RA',
        avatarColorHex: '#787CF2',
        unread: false,
        leaveTypeEn: 'Casual Leave',
        leaveTypeAr: 'إجازة عارضة',
        dateRangeLabel: '22 Apr · 1 day',
        submittedAgoLabel: 'Submitted yesterday',
        submittedAt: '2026-04-07T14:00:00+03:00',
      },
    ],
  },
  {
    key: 'thisWeek',
    title: 'This week',
    items: [
      {
        requestId: 'v_5004',
        employeeName: 'Salma Tawfik',
        avatarInitials: 'ST',
        avatarColorHex: '#D98A00',
        unread: false,
        leaveTypeEn: 'Annual Leave',
        leaveTypeAr: 'إجازة سنوية',
        dateRangeLabel: '28 Apr – 30 Apr · 3 days',
        submittedAgoLabel: 'Submitted 3 days ago',
        submittedAt: '2026-04-05T09:00:00+03:00',
      },
    ],
  },
];

// Mock-only bucketing. `week`/`month` intentionally equal `all` here —
// the fixtures have nothing past "this week", and the real BE owns the
// date-window logic (contract Q2). The map is total over the typed union;
// the `?? all` below is defensive only.
const SECTION_KEYS_FOR_RANGE: Record<
  PendingApprovalRangeParam,
  string[]
> = {
  all: ['overdue', 'today', 'thisWeek'],
  today: ['today'],
  week: ['overdue', 'today', 'thisWeek'],
  month: ['overdue', 'today', 'thisWeek'],
};

const mockPage = (
  range: PendingApprovalRangeParam,
  page: number,
  pageSize: number,
): PendingApprovalsPageDto => {
  const allowed = SECTION_KEYS_FOR_RANGE[range] ?? SECTION_KEYS_FOR_RANGE.all;
  const sections = MOCK_SECTIONS.filter(s => allowed.includes(s.key));
  const count = sections.reduce((n, s) => n + s.items.length, 0);
  return { pendingCount: count, sections, page, pageSize, totalCount: count };
};

// ── Data source ──────────────────────────────────────────────────────────────

export class PendingApprovalsRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async getPendingApprovals(
    query: GetPendingApprovalsQuery,
  ): Promise<PendingApprovalsPageDto> {
    const range = query.range ?? 'all';
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? AppConfig.PAGE_SIZE;
    if (useMock()) {
      managementLog.info(
        'data_source',
        `[MOCK] GET ${PENDING_APPROVALS}?range=${range}&page=${page}`,
      );
      await mockDelay();
      return mockPage(range, page, pageSize);
    }
    const params = new URLSearchParams({
      range,
      page: String(page),
      pageSize: String(pageSize),
    });
    const path = `${PENDING_APPROVALS}?${params.toString()}`;
    managementLog.info('data_source', `GET ${path}`);
    return this.http.get<PendingApprovalsPageDto>(path);
  }
}

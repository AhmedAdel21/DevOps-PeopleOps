import type { HttpClient } from '@/data/data_sources/http';
import type { ApprovalDetailDto } from '@/data/dtos/approval_detail';
import { managementLog } from '@/core/logger';
import { AppConfig } from '@/di/config';

// ── Path (docs/team-api-contract.md §3.5) ───────────────────────────────────

const APPROVAL_DETAIL = '/api/v1/admin/approvals';

// ── Mock ────────────────────────────────────────────────────────────────────

/** Same flag as the pending aggregation (contract §5) — rides
 *  `USE_MOCK_TEAM_ATTENDANCE` until the BE ships it. */
const useMock = (): boolean => AppConfig.USE_MOCK_TEAM_ATTENDANCE;

const mockDelay = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, AppConfig.MOCK_DELAY_MS));

/** Per-request fixtures keyed to the pending-list mock (v_5001..v_5004).
 *  v_5001 carries a conflict to exercise the nullable section; the rest
 *  don't. Unknown ids fall back to the ynfPj design example. */
const MOCK_DETAILS: Record<string, ApprovalDetailDto> = {
  v_5001: {
    requestId: 'v_5001',
    employee: {
      name: 'Mariam Abbas',
      avatarInitials: 'MA',
      avatarColorHex: '#D14545',
      roleTitle: 'QA Engineer',
      departmentName: 'Engineering',
      attendanceRecordUrl: null,
    },
    status: 'Pending',
    request: {
      typeEn: 'Sick Leave',
      typeAr: 'إجازة مرضية',
      datesLabel: '5 Apr – 7 Apr 2026',
      durationLabel: '3 days',
      submittedLabel: '5 Apr 2026',
      note: 'Medical certificate attached',
    },
    balanceImpact: {
      leaveTypeLabel: 'Sick Leave',
      beforeLabel: 'Unlimited',
      afterLabel: 'Unlimited',
    },
    conflict: {
      title: 'Attendance conflict detected',
      rows: [
        'Mon 5 Apr — Office · 9:02–18:15',
        'Tue 6 Apr — No record',
        'Wed 7 Apr — No record',
      ],
    },
    precedentLabel: 'Mariam has taken Sick Leave 1 time previously.',
  },
  v_5002: {
    requestId: 'v_5002',
    employee: {
      name: 'Hassan Kamal',
      avatarInitials: 'HK',
      avatarColorHex: '#1F9D74',
      roleTitle: 'Backend Developer',
      departmentName: 'Engineering',
      attendanceRecordUrl: null,
    },
    status: 'Pending',
    request: {
      typeEn: 'Annual Leave',
      typeAr: 'إجازة سنوية',
      datesLabel: '20 Apr – 24 Apr 2026',
      durationLabel: '5 days',
      submittedLabel: '8 Apr 2026',
      note: 'Family trip',
    },
    balanceImpact: {
      leaveTypeLabel: 'Annual Leave',
      beforeLabel: '21 days',
      afterLabel: '16 days',
    },
    conflict: null,
    precedentLabel: 'Hassan has taken Annual Leave 3 times previously.',
  },
  v_5003: {
    requestId: 'v_5003',
    employee: {
      name: 'Rania Adel',
      avatarInitials: 'RA',
      avatarColorHex: '#787CF2',
      roleTitle: 'Product Designer',
      departmentName: 'Marketing',
      attendanceRecordUrl: null,
    },
    status: 'Pending',
    request: {
      typeEn: 'Casual Leave',
      typeAr: 'إجازة عارضة',
      datesLabel: '22 Apr 2026',
      durationLabel: '1 day',
      submittedLabel: '7 Apr 2026',
      note: null,
    },
    balanceImpact: {
      leaveTypeLabel: 'Casual Leave',
      beforeLabel: '6 days',
      afterLabel: '5 days',
    },
    conflict: null,
    precedentLabel: null,
  },
  v_5004: {
    requestId: 'v_5004',
    employee: {
      name: 'Salma Tawfik',
      avatarInitials: 'ST',
      avatarColorHex: '#D98A00',
      roleTitle: 'Finance Analyst',
      departmentName: 'Finance',
      attendanceRecordUrl: null,
    },
    status: 'Pending',
    request: {
      typeEn: 'Annual Leave',
      typeAr: 'إجازة سنوية',
      datesLabel: '28 Apr – 30 Apr 2026',
      durationLabel: '3 days',
      submittedLabel: '5 Apr 2026',
      note: 'Personal',
    },
    balanceImpact: {
      leaveTypeLabel: 'Annual Leave',
      beforeLabel: '14 days',
      afterLabel: '11 days',
    },
    conflict: null,
    precedentLabel: 'Salma has taken Annual Leave 1 time previously.',
  },
};

const defaultDetail = (requestId: string): ApprovalDetailDto => ({
  requestId,
  employee: {
    name: 'Ahmed Adel',
    avatarInitials: 'AA',
    avatarColorHex: '#5559D6',
    roleTitle: 'Senior Developer',
    departmentName: 'Engineering',
    attendanceRecordUrl: null,
  },
  status: 'Pending',
  request: {
    typeEn: 'Annual Leave',
    typeAr: 'إجازة سنوية',
    datesLabel: '14–18 Apr 2026',
    durationLabel: '5 days',
    submittedLabel: '10 Apr 2026',
    note: 'Family vacation',
  },
  balanceImpact: {
    leaveTypeLabel: 'Annual Leave',
    beforeLabel: '18 days',
    afterLabel: '13 days',
  },
  conflict: null,
  precedentLabel: 'Ahmed has taken Annual Leave 2 times previously.',
});

export class ApprovalDetailRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async getApprovalDetail(requestId: string): Promise<ApprovalDetailDto> {
    if (useMock()) {
      managementLog.info(
        'data_source',
        `[MOCK] GET ${APPROVAL_DETAIL}/${requestId}`,
      );
      await mockDelay();
      return MOCK_DETAILS[requestId] ?? defaultDetail(requestId);
    }
    const path = `${APPROVAL_DETAIL}/${encodeURIComponent(requestId)}`;
    managementLog.info('data_source', `GET ${path}`);
    return this.http.get<ApprovalDetailDto>(path);
  }
}

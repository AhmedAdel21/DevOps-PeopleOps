import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { ServiceLocator } from '@/di';
import { DiKeys } from '@/core/keys/di.key';
import type {
  AdminLeaveRequestListItem,
  AdminPermissionRequestListItem,
  TeamAttendanceDay,
  TeamAttendanceFilter,
  TeamAttendanceStatus,
} from '@/domain/entities';
import type {
  GetLeaveRequestsParams,
  GetTeamAttendanceDayParams,
} from '@/domain/repositories';
import {
  AdminGetLeaveRequestsUseCase,
  AdminGetPermissionRequestsUseCase,
  GetTeamAttendanceDayUseCase,
} from '@/domain/use_cases';

/** Client-only Approvals time filter (backend filters by status, not
 *  time — this drives the design's chips, applied client-side). */
export type ApprovalRange = 'all' | 'today' | 'week' | 'month';
import {
  dateRangeLabel,
  deriveBalanceImpact,
  formatPermissionPeriodLabel,
  groupPendingApprovals,
  permissionTypeLabels,
} from './team_approvals.mapping';
import { DomainError, ManagementError } from '@/domain/errors';
import { managementLog } from '@/core/logger';
import type { SerializableDomainError } from '../hooks';

// ── Serializable domain error (management-specific fields) ───────────────────

export interface SerializableManagementError extends SerializableDomainError {
  mgmtCode: string;
  serverCode: string | null;
}

const serializeManagementError = (
  e: unknown,
): SerializableManagementError => {
  // The Team feature reuses the leave-admin + attendance `/management`
  // paths, which throw `LeaveError` via `mapHttpErrorToLeave`. Any
  // `DomainError` carries a serializable code/message; only
  // `ManagementError` adds the coarse mgmtCode/serverCode.
  if (e instanceof DomainError) {
    return {
      code: e.code,
      message: e.message,
      mgmtCode: e instanceof ManagementError ? e.mgmtCode : 'unknown',
      serverCode: e instanceof ManagementError ? e.serverCode : null,
    };
  }
  return {
    code: 'management/unknown',
    message: 'Team operation failed',
    mgmtCode: 'unknown',
    serverCode: null,
  };
};

// ── Statuses ────────────────────────────────────────────────────────────────

type FetchStatus = 'idle' | 'pending' | 'loaded' | 'error';

// ── Serializable projections ────────────────────────────────────────────────

export interface SerializableTeamRow {
  /** Canonical HR identifier (BE `AppUser.EmpCode`). FlatList key on the
   *  team screen. */
  empCode: string;
  displayName: string;
  /** Remote avatar URL — when present the row renders an Image, otherwise
   *  falls back to the initials chip. */
  avatarUrl: string | null;
  avatarInitials: string;
  avatarColorHex: string | null;
  departmentId: string | null;
  departmentName: string | null;
  status: TeamAttendanceStatus;
  place: 'Office' | 'Remote' | null;
  isLate: boolean;
  signedInAt: string | null;
  signedOutAt: string | null;
  statusLabel: string;
}

export interface SerializableTeamSummary {
  inOffice: number;
  remote: number;
  absent: number;
  late: number;
  notSignedIn: number;
  onLeave: number;
}

export interface SerializableTeamDay {
  date: string;
  summary: SerializableTeamSummary;
  rows: SerializableTeamRow[];
}

export interface SerializablePendingApprovalItem {
  requestId: string;
  employeeName: string;
  avatarInitials: string;
  avatarColorHex: string | null;
  unread: boolean;
  leaveTypeEn: string;
  leaveTypeAr: string;
  dateRangeLabel: string;
  submittedAgoLabel: string;
  submittedAt: string;
}

export interface SerializablePendingApprovalSection {
  key: string;
  title: string;
  items: SerializablePendingApprovalItem[];
}

export interface SerializableApprovalDetail {
  requestId: string;
  status: string;
  employee: {
    name: string;
    avatarInitials: string;
    avatarColorHex: string | null;
    roleTitle: string;
    departmentName: string;
    attendanceRecordUrl: string | null;
  };
  request: {
    typeEn: string;
    typeAr: string;
    datesLabel: string;
    durationLabel: string;
    submittedLabel: string;
    note: string | null;
  };
  balanceImpact: {
    leaveTypeLabel: string;
    beforeLabel: string;
    afterLabel: string;
  } | null;
  conflict: { title: string; rows: string[] } | null;
  precedentLabel: string | null;
}

// Approvals + detail now reuse the live leave-admin domain
// (/api/v1/management/requests/leaves); the design's sections/labels are
// derived client-side — see team_approvals.mapping (unit-tested).
const adminItemToSource = (i: AdminLeaveRequestListItem) => ({
  id: i.id,
  employeeName: i.employeeName,
  leaveTypeName: i.leaveTypeName,
  leaveTypeNameAr: i.leaveTypeNameAr,
  startDate: i.startDate,
  endDate: i.endDate,
  totalDays: i.totalDays,
  createdAt: i.createdAt,
  status: i.status,
});

// Permissions feed the SAME ApprovalSource shape (so groupPendingApprovals
// is reused, not forked). The type → bilingual label and the hours-based
// period label are the unit-tested pure helpers.
const permissionAdminItemToSource = (i: AdminPermissionRequestListItem) => {
  const labels = permissionTypeLabels(i.permissionTypeName);
  return {
    id: i.id,
    employeeName: i.employeeName,
    leaveTypeName: labels.en,
    leaveTypeNameAr: labels.ar,
    startDate: i.startDate,
    endDate: i.endDate,
    totalDays: 0, // permissions are intra-day; period is hours
    createdAt: i.createdAt,
    status: i.status,
    dateRangeLabelOverride: formatPermissionPeriodLabel(
      i.periodHours,
      i.startDate,
    ),
  };
};

const toSerializableDay = (d: TeamAttendanceDay): SerializableTeamDay => ({
  date: d.date,
  summary: { ...d.summary },
  rows: d.rows.map(r => ({
    empCode: r.empCode,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    avatarInitials: r.avatarInitials,
    avatarColorHex: r.avatarColorHex,
    departmentId: r.departmentId,
    departmentName: r.departmentName,
    status: r.status,
    place: r.place,
    isLate: r.isLate,
    signedInAt: r.signedInAt,
    signedOutAt: r.signedOutAt,
    statusLabel: r.statusLabel,
  })),
});

// ── State ───────────────────────────────────────────────────────────────────

export type TeamSegment = 'attendance' | 'approvals';

/** Inner tab inside the Approvals segment. Backend splits leave and
 *  permission requests into separate endpoints. */
export type PendingApprovalsTab = 'leaves' | 'permissions';

export interface TeamState {
  segment: TeamSegment;

  // Attendance segment
  selectedDate: string; // yyyy-MM-dd
  activeFilter: TeamAttendanceFilter;
  day: SerializableTeamDay | null;
  dayFetchStatus: FetchStatus;
  dayFetchError: SerializableManagementError | null;

  // Approvals segment
  pendingTab: PendingApprovalsTab;
  approvalsRange: ApprovalRange;
  pendingCount: number;
  approvalSections: SerializablePendingApprovalSection[];
  approvalsFetchStatus: FetchStatus;
  approvalsFetchError: SerializableManagementError | null;

  // Approvals — Permissions inner tab (lazy-fetched on first switch)
  permissionPendingCount: number;
  permissionApprovalSections: SerializablePendingApprovalSection[];
  permissionApprovalsFetchStatus: FetchStatus;
  permissionApprovalsFetchError: SerializableManagementError | null;

  // Approval detail (cached by requestId)
  approvalDetailsById: Record<string, SerializableApprovalDetail>;
  approvalDetailFetchStatus: FetchStatus;
  approvalDetailFetchError: SerializableManagementError | null;
}

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const initialState: TeamState = {
  segment: 'attendance',
  selectedDate: todayIso(),
  activeFilter: 'All',
  day: null,
  dayFetchStatus: 'idle',
  dayFetchError: null,

  pendingTab: 'leaves',
  approvalsRange: 'all',
  pendingCount: 0,
  approvalSections: [],
  approvalsFetchStatus: 'idle',
  approvalsFetchError: null,

  permissionPendingCount: 0,
  permissionApprovalSections: [],
  permissionApprovalsFetchStatus: 'idle',
  permissionApprovalsFetchError: null,

  approvalDetailsById: {},
  approvalDetailFetchStatus: 'idle',
  approvalDetailFetchError: null,
};

// ── Thunks ──────────────────────────────────────────────────────────────────

export const fetchTeamAttendanceDay = createAsyncThunk<
  SerializableTeamDay,
  GetTeamAttendanceDayParams,
  { rejectValue: SerializableManagementError }
>('team/fetchAttendanceDay', async (params, { rejectWithValue }) => {
  managementLog.info(
    'slice',
    `fetchTeamAttendanceDay thunk → date=${params.date ?? 'today'}`,
  );
  try {
    const useCase = ServiceLocator.get<GetTeamAttendanceDayUseCase>(
      DiKeys.GET_TEAM_ATTENDANCE_DAY_USE_CASE,
    );
    const result = await useCase.execute(params);
    return toSerializableDay(result);
  } catch (e) {
    return rejectWithValue(serializeManagementError(e));
  }
});

export interface FetchPendingApprovalsPayload {
  pendingCount: number;
  sections: SerializablePendingApprovalSection[];
}

export const fetchPendingApprovals = createAsyncThunk<
  FetchPendingApprovalsPayload,
  { range?: ApprovalRange },
  { rejectValue: SerializableManagementError }
>('team/fetchPendingApprovals', async (_params, { rejectWithValue }) => {
  managementLog.info('slice', 'fetchPendingApprovals → admin leaves (Pending)');
  try {
    // Reuse the live leave-admin endpoint (now /management/requests/leaves):
    // Pending = New|InReview server-side. Sections/labels derived client-side.
    const useCase = ServiceLocator.get<AdminGetLeaveRequestsUseCase>(
      DiKeys.ADMIN_GET_LEAVE_REQUESTS_USE_CASE,
    );
    const page = await useCase.execute({
      status: 'Pending',
      page: 1,
      pageSize: 50,
    } as GetLeaveRequestsParams);
    const sections = groupPendingApprovals(
      page.items.map(adminItemToSource),
    );
    const pendingCount = sections.reduce((n, s) => n + s.items.length, 0);
    return { pendingCount, sections };
  } catch (e) {
    return rejectWithValue(serializeManagementError(e));
  }
});

export const fetchPendingPermissionApprovals = createAsyncThunk<
  FetchPendingApprovalsPayload,
  { range?: ApprovalRange },
  { rejectValue: SerializableManagementError }
>(
  'team/fetchPendingPermissionApprovals',
  async (_params, { rejectWithValue }) => {
    managementLog.info(
      'slice',
      'fetchPendingPermissionApprovals → admin permissions (Pending)',
    );
    try {
      // /management/requests/permissions, Pending = New|InReview server-side.
      const useCase = ServiceLocator.get<AdminGetPermissionRequestsUseCase>(
        DiKeys.ADMIN_GET_PERMISSION_REQUESTS_USE_CASE,
      );
      const page = await useCase.execute({
        status: 'Pending',
        page: 1,
        pageSize: 50,
      } as GetLeaveRequestsParams);
      const sections = groupPendingApprovals(
        page.items.map(permissionAdminItemToSource),
      );
      const pendingCount = sections.reduce(
        (n, s) => n + s.items.length,
        0,
      );
      return { pendingCount, sections };
    } catch (e) {
      return rejectWithValue(serializeManagementError(e));
    }
  },
);


export const fetchApprovalDetail = createAsyncThunk<
  SerializableApprovalDetail,
  { requestId: string },
  { rejectValue: SerializableManagementError }
>('team/fetchApprovalDetail', async ({ requestId }, { rejectWithValue }) => {
  managementLog.info('slice', `fetchApprovalDetail → ${requestId}`);
  try {
    // No dedicated detail endpoint — render from the leave-admin list item
    // (LeaveInfoModel). Balance impact is derived from the employee's
    // current balances; conflict comes from conflictDetails if present;
    // precedent has no backend source → null (screen hides the block).
    const useCase = ServiceLocator.get<AdminGetLeaveRequestsUseCase>(
      DiKeys.ADMIN_GET_LEAVE_REQUESTS_USE_CASE,
    );
    const page = await useCase.execute({
      status: 'Pending',
      page: 1,
      pageSize: 50,
    } as GetLeaveRequestsParams);
    const it = page.items.find(r => r.id === requestId);
    if (!it) {
      return rejectWithValue({
        code: 'management/not-found',
        message: 'Request not found',
        mgmtCode: 'not-found',
        serverCode: null,
      });
    }
    const initials = it.employeeName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() ?? '')
      .join('');
    const detail: SerializableApprovalDetail = {
      requestId: it.id,
      status: it.status,
      employee: {
        name: it.employeeName,
        avatarInitials: initials,
        avatarColorHex: null,
        roleTitle: it.employeeCode,
        departmentName: '',
        attendanceRecordUrl: null,
      },
      request: {
        typeEn: it.leaveTypeName,
        typeAr: it.leaveTypeNameAr,
        datesLabel: dateRangeLabel(it.startDate, it.endDate, it.totalDays),
        durationLabel: `${it.totalDays} ${it.totalDays === 1 ? 'day' : 'days'}`,
        submittedLabel: it.createdAt.slice(0, 10),
        note: it.notes,
      },
      balanceImpact: deriveBalanceImpact({
        leaveTypeName: it.leaveTypeName,
        totalDays: it.totalDays,
        annual: it.currentAnnualLeaveBalance,
        sick: it.currentSickLeaveBalance,
        urgent: it.currentUrgentLeaveBalance,
      }),
      conflict: it.conflictDetails
        ? {
            title: 'Attendance conflict detected',
            rows: [it.conflictDetails],
          }
        : null,
      precedentLabel: null,
    };
    return detail;
  } catch (e) {
    return rejectWithValue(serializeManagementError(e));
  }
});

// ── Slice ───────────────────────────────────────────────────────────────────

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setTeamSegment(state, action: PayloadAction<TeamSegment>) {
      state.segment = action.payload;
    },
    setTeamFilter(state, action: PayloadAction<TeamAttendanceFilter>) {
      state.activeFilter = action.payload;
    },
    setTeamSelectedDate(state, action: PayloadAction<string>) {
      state.selectedDate = action.payload;
    },
    setApprovalsRange(state, action: PayloadAction<ApprovalRange>) {
      state.approvalsRange = action.payload;
    },
    setPendingTab(state, action: PayloadAction<PendingApprovalsTab>) {
      state.pendingTab = action.payload;
    },
    clearTeamErrors(state) {
      state.dayFetchError = null;
      if (state.dayFetchStatus === 'error') state.dayFetchStatus = 'idle';
      state.approvalsFetchError = null;
      if (state.approvalsFetchStatus === 'error') {
        state.approvalsFetchStatus = 'idle';
      }
      state.permissionApprovalsFetchError = null;
      if (state.permissionApprovalsFetchStatus === 'error') {
        state.permissionApprovalsFetchStatus = 'idle';
      }
      state.approvalDetailFetchError = null;
      if (state.approvalDetailFetchStatus === 'error') {
        state.approvalDetailFetchStatus = 'idle';
      }
    },
    resetTeamState() {
      return initialState;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTeamAttendanceDay.pending, state => {
        state.dayFetchStatus = 'pending';
        state.dayFetchError = null;
      })
      .addCase(fetchTeamAttendanceDay.fulfilled, (state, action) => {
        state.dayFetchStatus = 'loaded';
        state.day = action.payload;
      })
      .addCase(fetchTeamAttendanceDay.rejected, (state, action) => {
        state.dayFetchStatus = 'error';
        state.dayFetchError =
          action.payload ?? {
            code: 'management/unknown',
            message: 'Failed to load team attendance',
            mgmtCode: 'unknown',
            serverCode: null,
          };
      })
      .addCase(fetchPendingApprovals.pending, state => {
        state.approvalsFetchStatus = 'pending';
        state.approvalsFetchError = null;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.approvalsFetchStatus = 'loaded';
        state.pendingCount = action.payload.pendingCount;
        state.approvalSections = action.payload.sections;
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.approvalsFetchStatus = 'error';
        state.approvalsFetchError =
          action.payload ?? {
            code: 'management/unknown',
            message: 'Failed to load pending approvals',
            mgmtCode: 'unknown',
            serverCode: null,
          };
      })
      .addCase(fetchPendingPermissionApprovals.pending, state => {
        state.permissionApprovalsFetchStatus = 'pending';
        state.permissionApprovalsFetchError = null;
      })
      .addCase(
        fetchPendingPermissionApprovals.fulfilled,
        (state, action) => {
          state.permissionApprovalsFetchStatus = 'loaded';
          state.permissionPendingCount = action.payload.pendingCount;
          state.permissionApprovalSections = action.payload.sections;
        },
      )
      .addCase(
        fetchPendingPermissionApprovals.rejected,
        (state, action) => {
          state.permissionApprovalsFetchStatus = 'error';
          state.permissionApprovalsFetchError =
            action.payload ?? {
              code: 'management/unknown',
              message: 'Failed to load pending permission approvals',
              mgmtCode: 'unknown',
              serverCode: null,
            };
        },
      )
      .addCase(fetchApprovalDetail.pending, state => {
        state.approvalDetailFetchStatus = 'pending';
        state.approvalDetailFetchError = null;
      })
      .addCase(fetchApprovalDetail.fulfilled, (state, action) => {
        state.approvalDetailFetchStatus = 'loaded';
        state.approvalDetailsById[action.payload.requestId] =
          action.payload;
      })
      .addCase(fetchApprovalDetail.rejected, (state, action) => {
        state.approvalDetailFetchStatus = 'error';
        state.approvalDetailFetchError =
          action.payload ?? {
            code: 'management/unknown',
            message: 'Failed to load approval detail',
            mgmtCode: 'unknown',
            serverCode: null,
          };
      });
  },
});

export const {
  setTeamSegment,
  setTeamFilter,
  setTeamSelectedDate,
  setApprovalsRange,
  setPendingTab,
  clearTeamErrors,
  resetTeamState,
} = teamSlice.actions;

export default teamSlice.reducer;

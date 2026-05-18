import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { ServiceLocator } from '@/di';
import { DiKeys } from '@/core/keys/di.key';
import type {
  ApprovalDetail,
  Department,
  PendingApprovalRange,
  PendingApprovalsPage,
  TeamAttendanceDay,
  TeamAttendanceFilter,
  TeamAttendanceStatus,
} from '@/domain/entities';
import type {
  GetApprovalDetailParams,
  GetPendingApprovalsParams,
  GetTeamAttendanceDayParams,
} from '@/domain/repositories';
import {
  GetApprovalDetailUseCase,
  GetPendingApprovalsUseCase,
  GetTeamAttendanceDayUseCase,
  ListDepartmentsUseCase,
} from '@/domain/use_cases';
import { ManagementError } from '@/domain/errors';
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
  if (e instanceof ManagementError) {
    return {
      code: e.code,
      message: e.message,
      mgmtCode: e.mgmtCode,
      serverCode: e.serverCode,
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
  userId: string;
  slackUserId: string | null;
  displayName: string;
  avatarInitials: string;
  avatarColorHex: string | null;
  departmentId: string | null;
  departmentName: string | null;
  status: TeamAttendanceStatus;
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

export interface SerializableDepartment {
  id: string;
  nameEn: string;
  nameAr: string | null;
  memberCount: number;
  managerEmployeeId: string | null;
  managerName: string | null;
}

const toSerializableDepartment = (d: Department): SerializableDepartment => ({
  id: d.id,
  nameEn: d.nameEn,
  nameAr: d.nameAr,
  memberCount: d.memberCount,
  managerEmployeeId: d.managerEmployeeId,
  managerName: d.managerName,
});

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

const toSerializableApprovalDetail = (
  d: ApprovalDetail,
): SerializableApprovalDetail => ({
  requestId: d.requestId,
  status: d.status,
  employee: { ...d.employee },
  request: { ...d.request },
  balanceImpact: d.balanceImpact ? { ...d.balanceImpact } : null,
  conflict: d.conflict
    ? { title: d.conflict.title, rows: [...d.conflict.rows] }
    : null,
  precedentLabel: d.precedentLabel,
});

const toSerializablePendingSections = (
  page: PendingApprovalsPage,
): SerializablePendingApprovalSection[] =>
  page.sections.map(s => ({
    key: s.key,
    title: s.title,
    items: s.items.map(i => ({
      requestId: i.requestId,
      employeeName: i.employeeName,
      avatarInitials: i.avatarInitials,
      avatarColorHex: i.avatarColorHex,
      unread: i.unread,
      leaveTypeEn: i.leaveTypeEn,
      leaveTypeAr: i.leaveTypeAr,
      dateRangeLabel: i.dateRangeLabel,
      submittedAgoLabel: i.submittedAgoLabel,
      submittedAt: i.submittedAt,
    })),
  }));

const toSerializableDay = (d: TeamAttendanceDay): SerializableTeamDay => ({
  date: d.date,
  summary: { ...d.summary },
  rows: d.rows.map(r => ({
    userId: r.userId,
    slackUserId: r.slackUserId,
    displayName: r.displayName,
    avatarInitials: r.avatarInitials,
    avatarColorHex: r.avatarColorHex,
    departmentId: r.departmentId,
    departmentName: r.departmentName,
    status: r.status,
    isLate: r.isLate,
    signedInAt: r.signedInAt,
    signedOutAt: r.signedOutAt,
    statusLabel: r.statusLabel,
  })),
});

// ── State ───────────────────────────────────────────────────────────────────

export type TeamSegment = 'attendance' | 'approvals';

export interface TeamState {
  segment: TeamSegment;

  // Attendance segment
  selectedDate: string; // yyyy-MM-dd
  activeFilter: TeamAttendanceFilter;
  selectedDepartmentId: string | null;
  day: SerializableTeamDay | null;
  dayFetchStatus: FetchStatus;
  dayFetchError: SerializableManagementError | null;

  // Approvals segment
  approvalsRange: PendingApprovalRange;
  pendingCount: number;
  approvalSections: SerializablePendingApprovalSection[];
  approvalsFetchStatus: FetchStatus;
  approvalsFetchError: SerializableManagementError | null;

  // Departments (HR dept selector)
  departments: SerializableDepartment[];
  departmentsFetchStatus: FetchStatus;
  departmentsFetchError: SerializableManagementError | null;

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
  selectedDepartmentId: null,
  day: null,
  dayFetchStatus: 'idle',
  dayFetchError: null,

  approvalsRange: 'all',
  pendingCount: 0,
  approvalSections: [],
  approvalsFetchStatus: 'idle',
  approvalsFetchError: null,

  departments: [],
  departmentsFetchStatus: 'idle',
  departmentsFetchError: null,

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
    `fetchTeamAttendanceDay thunk → date=${params.date ?? 'today'}, ` +
      `dept=${params.departmentId ?? '—'}, filter=${params.filter ?? 'All'}`,
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
  GetPendingApprovalsParams,
  { rejectValue: SerializableManagementError }
>('team/fetchPendingApprovals', async (params, { rejectWithValue }) => {
  managementLog.info(
    'slice',
    `fetchPendingApprovals thunk → range=${params.range ?? 'all'}`,
  );
  try {
    const useCase = ServiceLocator.get<GetPendingApprovalsUseCase>(
      DiKeys.GET_PENDING_APPROVALS_USE_CASE,
    );
    const result = await useCase.execute(params);
    return {
      pendingCount: result.pendingCount,
      sections: toSerializablePendingSections(result),
    };
  } catch (e) {
    return rejectWithValue(serializeManagementError(e));
  }
});

export const fetchDepartments = createAsyncThunk<
  SerializableDepartment[],
  void,
  { rejectValue: SerializableManagementError }
>('team/fetchDepartments', async (_, { rejectWithValue }) => {
  managementLog.info('slice', 'fetchDepartments thunk');
  try {
    const useCase = ServiceLocator.get<ListDepartmentsUseCase>(
      DiKeys.LIST_DEPARTMENTS_USE_CASE,
    );
    const result = await useCase.execute();
    return result.map(toSerializableDepartment);
  } catch (e) {
    return rejectWithValue(serializeManagementError(e));
  }
});

export const fetchApprovalDetail = createAsyncThunk<
  SerializableApprovalDetail,
  GetApprovalDetailParams,
  { rejectValue: SerializableManagementError }
>('team/fetchApprovalDetail', async (params, { rejectWithValue }) => {
  managementLog.info(
    'slice',
    `fetchApprovalDetail thunk → ${params.requestId}`,
  );
  try {
    const useCase = ServiceLocator.get<GetApprovalDetailUseCase>(
      DiKeys.GET_APPROVAL_DETAIL_USE_CASE,
    );
    const result = await useCase.execute(params);
    return toSerializableApprovalDetail(result);
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
    setTeamSelectedDepartment(
      state,
      action: PayloadAction<string | null>,
    ) {
      state.selectedDepartmentId = action.payload;
    },
    setApprovalsRange(state, action: PayloadAction<PendingApprovalRange>) {
      state.approvalsRange = action.payload;
    },
    clearTeamErrors(state) {
      state.dayFetchError = null;
      if (state.dayFetchStatus === 'error') state.dayFetchStatus = 'idle';
      state.approvalsFetchError = null;
      if (state.approvalsFetchStatus === 'error') {
        state.approvalsFetchStatus = 'idle';
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
      .addCase(fetchDepartments.pending, state => {
        state.departmentsFetchStatus = 'pending';
        state.departmentsFetchError = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departmentsFetchStatus = 'loaded';
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.departmentsFetchStatus = 'error';
        state.departmentsFetchError =
          action.payload ?? {
            code: 'management/unknown',
            message: 'Failed to load departments',
            mgmtCode: 'unknown',
            serverCode: null,
          };
      })
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
  setTeamSelectedDepartment,
  setApprovalsRange,
  clearTeamErrors,
  resetTeamState,
} = teamSlice.actions;

export default teamSlice.reducer;

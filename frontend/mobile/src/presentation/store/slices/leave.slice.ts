import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { ServiceLocator } from '@/di';
import { DiKeys } from '@/core/keys/di.key';
import { AppConfig } from '@/di/config';
import type {
  AdminLeaveRequestListItem,
  AdminLeaveRequestsPage,
  LeaveBalance,
  LeaveBalancesSummary,
  LeaveRequestDetail,
  LeaveRequestListItem,
  LeaveRequestStatus,
  LeaveRequestsPage,
  LeaveTypeMeta,
  PermissionQuota,
  PermissionRequest,
  PermissionRequestStatus,
  PermissionRequestsPage,
  PermissionType,
  SubmitLeaveResult,
} from '@/domain/entities';
import type {
  CancelLeaveRequestParams,
  GetAvailableLeaveTypesParams,
  GetLeaveBalancesParams,
  GetLeaveRequestDetailParams,
  GetLeaveRequestsParams,
  RequestPermissionParams,
  ReviewLeaveRequestParams,
  SubmitLeaveRequestParams,
} from '@/domain/repositories';
import {
  AdminGetLeaveRequestsUseCase,
  ApproveLeaveRequestUseCase,
  CancelLeaveRequestUseCase,
  GetAvailableLeaveTypesUseCase,
  GetLeaveBalancesUseCase,
  GetLeaveRequestDetailUseCase,
  GetLeaveRequestsUseCase,
  GetPermissionQuotaUseCase,
  GetPermissionRequestsUseCase,
  RejectLeaveRequestUseCase,
  RequestPermissionUseCase,
  SubmitLeaveRequestUseCase,
} from '@/domain/use_cases';
import { LeaveError, type LeaveErrorCode } from '@/domain/errors';
import { leaveLog } from '@/core/logger';
import type { SerializableDomainError } from '../hooks';

// ── Serializable domain error (leave-specific fields) ───────────────────────

export interface SerializableLeaveError extends SerializableDomainError {
  leaveCode: LeaveErrorCode;
  remainingBalance?: number | null;
  conflictingDates?: string | null;
}

const serializeLeaveError = (e: unknown): SerializableLeaveError => {
  if (e instanceof LeaveError) {
    return {
      code: e.code,
      message: e.message,
      leaveCode: e.leaveCode,
      remainingBalance: e.remainingBalance ?? null,
      conflictingDates: e.conflictingDates ?? null,
    };
  }
  return {
    code: 'leave/unknown',
    message: 'Leave operation failed',
    leaveCode: 'unknown',
  };
};

// ── Statuses ────────────────────────────────────────────────────────────────

type FetchStatus = 'idle' | 'pending' | 'loaded' | 'error';
type ActionStatus = 'idle' | 'pending' | 'error';

// ── Serializable projections ────────────────────────────────────────────────

export interface SerializableLeaveType {
  id: number;
  nameEn: string;
  nameAr: string;
  colorHex: string;
  requiresMedicalCertificate: boolean;
  isOncePerCareer: boolean;
  maxConsecutiveDays: number | null;
  allowSameDay: boolean;
}

export interface SerializableLeaveBalance {
  typeId: number;
  typeName: string;
  colorHex: string;
  isUnlimited: boolean;
  totalEntitlement: number;
  usedDays: number;
  remainingDays: number;
}

export interface SerializableLeaveRequest {
  id: string;
  leaveTypeName: string;
  leaveTypeNameAr: string;
  colorHex: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: LeaveRequestStatus;
  hasAttendanceConflict: boolean;
  createdAt: string;
}

export interface SerializableLeaveRequestDetail extends SerializableLeaveRequest {
  notes: string | null;
  conflictDetails: string | null;
  reviewerComment: string | null;
  reviewedAt: string | null;
  balanceAfterApproval: number | null;
}

export interface SerializableAdminLeaveRequest extends SerializableLeaveRequest {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  notes: string | null;
  conflictDetails: string | null;
  reviewerComment: string | null;
  reviewedAt: string | null;
}

export interface SerializableSubmitLeaveResult {
  leaveRequestId: string;
  hasWeekendWarning: boolean;
  hasAttendanceConflictWarning: boolean;
  conflictDetails: string | null;
}

export interface SerializablePermissionRequest {
  id: string;
  permissionType: PermissionType;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: PermissionRequestStatus;
}

export interface SerializablePermissionQuota {
  permissionsUsed: number;
  permissionsAllowed: number;
  monthResetsAt: string;
}

// ── Mappers domain → serializable ───────────────────────────────────────────

const toSerializableType = (t: LeaveTypeMeta): SerializableLeaveType => ({
  id: t.id,
  nameEn: t.nameEn,
  nameAr: t.nameAr,
  colorHex: t.colorHex,
  requiresMedicalCertificate: t.requiresMedicalCertificate,
  isOncePerCareer: t.isOncePerCareer,
  maxConsecutiveDays: t.maxConsecutiveDays,
  allowSameDay: t.allowSameDay,
});

const toSerializableBalance = (b: LeaveBalance): SerializableLeaveBalance => ({
  typeId: b.typeId,
  typeName: b.typeName,
  colorHex: b.colorHex,
  isUnlimited: b.isUnlimited,
  totalEntitlement: b.totalEntitlement,
  usedDays: b.usedDays,
  remainingDays: b.remainingDays,
});

const toSerializableRequest = (r: LeaveRequestListItem): SerializableLeaveRequest => ({
  id: r.id,
  leaveTypeName: r.leaveTypeName,
  leaveTypeNameAr: r.leaveTypeNameAr,
  colorHex: r.colorHex,
  startDate: r.startDate,
  endDate: r.endDate,
  totalDays: r.totalDays,
  status: r.status,
  hasAttendanceConflict: r.hasAttendanceConflict,
  createdAt: r.createdAt,
});

const toSerializableDetail = (r: LeaveRequestDetail): SerializableLeaveRequestDetail => ({
  ...toSerializableRequest({
    id: r.id,
    leaveTypeName: r.leaveTypeName,
    leaveTypeNameAr: r.leaveTypeNameAr,
    colorHex: r.colorHex,
    startDate: r.startDate,
    endDate: r.endDate,
    totalDays: r.totalDays,
    status: r.status,
    hasAttendanceConflict: r.hasAttendanceConflict,
    createdAt: r.createdAt,
  }),
  notes: r.notes,
  conflictDetails: r.conflictDetails,
  reviewerComment: r.reviewerComment,
  reviewedAt: r.reviewedAt,
  balanceAfterApproval: r.balanceAfterApproval,
});

const toSerializableAdmin = (r: AdminLeaveRequestListItem): SerializableAdminLeaveRequest => ({
  ...toSerializableRequest(r),
  employeeId: r.employeeId,
  employeeName: r.employeeName,
  employeeCode: r.employeeCode,
  notes: r.notes,
  conflictDetails: r.conflictDetails,
  reviewerComment: r.reviewerComment,
  reviewedAt: r.reviewedAt,
});

const toSerializableSubmitResult = (r: SubmitLeaveResult): SerializableSubmitLeaveResult => ({
  leaveRequestId: r.leaveRequestId,
  hasWeekendWarning: r.hasWeekendWarning,
  hasAttendanceConflictWarning: r.hasAttendanceConflictWarning,
  conflictDetails: r.conflictDetails,
});

const toSerializablePermissionRequest = (r: PermissionRequest): SerializablePermissionRequest => ({
  id: r.id,
  permissionType: r.permissionType,
  date: r.date,
  startTime: r.startTime,
  endTime: r.endTime,
  durationMinutes: r.durationMinutes,
  status: r.status,
});

const toSerializableQuota = (q: PermissionQuota): SerializablePermissionQuota => ({
  permissionsUsed: q.permissionsUsed,
  permissionsAllowed: q.permissionsAllowed,
  monthResetsAt: q.monthResetsAt,
});

// ── State ───────────────────────────────────────────────────────────────────

export type LeaveFilter = LeaveRequestStatus | 'All';

export interface LeaveState {
  // Balances
  balancesYear: number | null;
  balances: SerializableLeaveBalance[];
  balancesFetchStatus: FetchStatus;
  balancesFetchError: SerializableLeaveError | null;

  // Available leave types (for submit screen)
  availableTypes: SerializableLeaveType[];
  availableTypesStartDate: string | null;
  availableTypesFetchStatus: FetchStatus;
  availableTypesFetchError: SerializableLeaveError | null;

  // My requests
  requests: SerializableLeaveRequest[];
  requestsFilter: LeaveFilter;
  requestsPage: number;
  requestsPageSize: number;
  requestsTotalCount: number;
  requestsFetchStatus: FetchStatus;
  requestsFetchError: SerializableLeaveError | null;

  // Request detail cache
  requestDetailsById: Record<string, SerializableLeaveRequestDetail>;
  requestDetailFetchStatus: FetchStatus;
  requestDetailFetchError: SerializableLeaveError | null;

  // Submit
  submitStatus: ActionStatus;
  submitError: SerializableLeaveError | null;
  lastSubmitResult: SerializableSubmitLeaveResult | null;

  // Cancel
  cancelStatus: ActionStatus;
  cancelError: SerializableLeaveError | null;

  // Admin list
  adminRequests: SerializableAdminLeaveRequest[];
  adminFilter: LeaveFilter;
  adminPage: number;
  adminPageSize: number;
  adminTotalCount: number;
  adminFetchStatus: FetchStatus;
  adminFetchError: SerializableLeaveError | null;

  // Admin review (approve/reject share a status)
  reviewStatus: ActionStatus;
  reviewError: SerializableLeaveError | null;

  // Permissions (mock)
  permissionQuota: SerializablePermissionQuota | null;
  permissionRequests: SerializablePermissionRequest[];
  permissionRequestsNextCursor: string | null;
  permissionRequestsHasMore: boolean;
  permissionRequestsFetchStatus: FetchStatus;
  permissionRequestsFetchError: SerializableDomainError | null;

  requestPermissionStatus: ActionStatus;
  requestPermissionError: SerializableDomainError | null;
}

const initialState: LeaveState = {
  balancesYear: null,
  balances: [],
  balancesFetchStatus: 'idle',
  balancesFetchError: null,

  availableTypes: [],
  availableTypesStartDate: null,
  availableTypesFetchStatus: 'idle',
  availableTypesFetchError: null,

  requests: [],
  requestsFilter: 'All',
  requestsPage: 1,
  requestsPageSize: AppConfig.PAGE_SIZE,
  requestsTotalCount: 0,
  requestsFetchStatus: 'idle',
  requestsFetchError: null,

  requestDetailsById: {},
  requestDetailFetchStatus: 'idle',
  requestDetailFetchError: null,

  submitStatus: 'idle',
  submitError: null,
  lastSubmitResult: null,

  cancelStatus: 'idle',
  cancelError: null,

  adminRequests: [],
  adminFilter: 'All',
  adminPage: 1,
  adminPageSize: AppConfig.PAGE_SIZE,
  adminTotalCount: 0,
  adminFetchStatus: 'idle',
  adminFetchError: null,

  reviewStatus: 'idle',
  reviewError: null,

  permissionQuota: null,
  permissionRequests: [],
  permissionRequestsNextCursor: null,
  permissionRequestsHasMore: false,
  permissionRequestsFetchStatus: 'idle',
  permissionRequestsFetchError: null,

  requestPermissionStatus: 'idle',
  requestPermissionError: null,
};

// ── Thunks ──────────────────────────────────────────────────────────────────

export interface FetchBalancesPayload {
  year: number;
  balances: SerializableLeaveBalance[];
}

export const fetchLeaveBalances = createAsyncThunk<
  FetchBalancesPayload,
  GetLeaveBalancesParams | void,
  { rejectValue: SerializableLeaveError }
>('leave/fetchBalances', async (params, { rejectWithValue }) => {
  leaveLog.info('slice', `fetchLeaveBalances thunk → year=${params?.year ?? 'current'}`);
  try {
    const useCase = ServiceLocator.get<GetLeaveBalancesUseCase>(
      DiKeys.GET_LEAVE_BALANCES_USE_CASE,
    );
    const result: LeaveBalancesSummary = await useCase.execute(params ?? {});
    return {
      year: result.year,
      balances: result.balances.map(toSerializableBalance),
    };
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

export interface FetchAvailableTypesPayload {
  startDate: string;
  types: SerializableLeaveType[];
}

export const fetchAvailableLeaveTypes = createAsyncThunk<
  FetchAvailableTypesPayload,
  GetAvailableLeaveTypesParams,
  { rejectValue: SerializableLeaveError }
>('leave/fetchAvailableTypes', async (params, { rejectWithValue }) => {
  leaveLog.info('slice', `fetchAvailableLeaveTypes thunk → startDate=${params.startDate}`);
  try {
    const useCase = ServiceLocator.get<GetAvailableLeaveTypesUseCase>(
      DiKeys.GET_AVAILABLE_LEAVE_TYPES_USE_CASE,
    );
    const result = await useCase.execute(params);
    return {
      startDate: params.startDate,
      types: result.map(toSerializableType),
    };
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

export interface FetchRequestsPayload {
  items: SerializableLeaveRequest[];
  totalCount: number;
  page: number;
  pageSize: number;
  filter: LeaveFilter;
}

export const fetchLeaveRequests = createAsyncThunk<
  FetchRequestsPayload,
  GetLeaveRequestsParams & { filter?: LeaveFilter },
  { rejectValue: SerializableLeaveError }
>('leave/fetchRequests', async ({ filter = 'All', ...params }, { rejectWithValue }) => {
  leaveLog.info(
    'slice',
    `fetchLeaveRequests thunk → filter=${filter}, page=${params.page ?? 1}`,
  );
  try {
    const useCase = ServiceLocator.get<GetLeaveRequestsUseCase>(
      DiKeys.GET_LEAVE_REQUESTS_USE_CASE,
    );
    const page: LeaveRequestsPage = await useCase.execute(params);
    return {
      items: page.items.map(toSerializableRequest),
      totalCount: page.totalCount,
      page: page.page,
      pageSize: page.pageSize,
      filter,
    };
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

export const fetchLeaveRequestDetail = createAsyncThunk<
  SerializableLeaveRequestDetail,
  GetLeaveRequestDetailParams,
  { rejectValue: SerializableLeaveError }
>('leave/fetchRequestDetail', async (params, { rejectWithValue }) => {
  leaveLog.info('slice', `fetchLeaveRequestDetail thunk → id=${params.leaveRequestId}`);
  try {
    const useCase = ServiceLocator.get<GetLeaveRequestDetailUseCase>(
      DiKeys.GET_LEAVE_REQUEST_DETAIL_USE_CASE,
    );
    const result = await useCase.execute(params);
    return toSerializableDetail(result);
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

export const submitLeaveRequest = createAsyncThunk<
  SerializableSubmitLeaveResult,
  SubmitLeaveRequestParams,
  { rejectValue: SerializableLeaveError }
>('leave/submitRequest', async (params, { rejectWithValue, dispatch, getState }) => {
  leaveLog.info(
    'slice',
    `submitLeaveRequest thunk → typeId=${params.leaveTypeId}, ${params.startDate}→${params.endDate}`,
  );
  try {
    const useCase = ServiceLocator.get<SubmitLeaveRequestUseCase>(
      DiKeys.SUBMIT_LEAVE_REQUEST_USE_CASE,
    );
    const result = await useCase.execute(params);
    // Refresh balances + list so the UI reflects the new pending request.
    // Preserve the user's current filter rather than snapping back to 'All'.
    const state = (getState as () => { leave: LeaveState })().leave;
    dispatch(fetchLeaveBalances());
    dispatch(fetchLeaveRequests({
      filter: state.requestsFilter,
      status: state.requestsFilter === 'All' ? undefined : state.requestsFilter,
      page: 1,
    }));
    return toSerializableSubmitResult(result);
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

export const cancelLeaveRequest = createAsyncThunk<
  string, // cancelled id
  CancelLeaveRequestParams,
  { rejectValue: SerializableLeaveError }
>('leave/cancelRequest', async (params, { rejectWithValue, dispatch, getState }) => {
  leaveLog.info('slice', `cancelLeaveRequest thunk → id=${params.leaveRequestId}`);
  try {
    const useCase = ServiceLocator.get<CancelLeaveRequestUseCase>(
      DiKeys.CANCEL_LEAVE_REQUEST_USE_CASE,
    );
    await useCase.execute(params);
    // Refresh list using the active filter.
    const state = (getState as () => { leave: LeaveState })().leave;
    dispatch(fetchLeaveRequests({
      filter: state.requestsFilter,
      status: state.requestsFilter === 'All' ? undefined : state.requestsFilter,
      page: state.requestsPage,
    }));
    dispatch(fetchLeaveBalances());
    return params.leaveRequestId;
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

export interface FetchAdminRequestsPayload {
  items: SerializableAdminLeaveRequest[];
  totalCount: number;
  page: number;
  pageSize: number;
  filter: LeaveFilter;
}

export const fetchAdminLeaveRequests = createAsyncThunk<
  FetchAdminRequestsPayload,
  GetLeaveRequestsParams & { filter?: LeaveFilter },
  { rejectValue: SerializableLeaveError }
>('leave/fetchAdminRequests', async ({ filter = 'All', ...params }, { rejectWithValue }) => {
  leaveLog.info(
    'slice',
    `fetchAdminLeaveRequests thunk → filter=${filter}, page=${params.page ?? 1}`,
  );
  try {
    const useCase = ServiceLocator.get<AdminGetLeaveRequestsUseCase>(
      DiKeys.ADMIN_GET_LEAVE_REQUESTS_USE_CASE,
    );
    const page: AdminLeaveRequestsPage = await useCase.execute(params);
    return {
      items: page.items.map(toSerializableAdmin),
      totalCount: page.totalCount,
      page: page.page,
      pageSize: page.pageSize,
      filter,
    };
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

export const approveLeaveRequest = createAsyncThunk<
  string,
  ReviewLeaveRequestParams,
  { rejectValue: SerializableLeaveError }
>('leave/approveRequest', async (params, { rejectWithValue, dispatch, getState }) => {
  leaveLog.info('slice', `approveLeaveRequest thunk → id=${params.leaveRequestId}`);
  try {
    const useCase = ServiceLocator.get<ApproveLeaveRequestUseCase>(
      DiKeys.APPROVE_LEAVE_REQUEST_USE_CASE,
    );
    await useCase.execute(params);
    const state = (getState as () => { leave: LeaveState })().leave;
    dispatch(fetchAdminLeaveRequests({
      filter: state.adminFilter,
      status: state.adminFilter === 'All' ? undefined : state.adminFilter,
      page: state.adminPage,
    }));
    return params.leaveRequestId;
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

export const rejectLeaveRequest = createAsyncThunk<
  string,
  ReviewLeaveRequestParams,
  { rejectValue: SerializableLeaveError }
>('leave/rejectRequest', async (params, { rejectWithValue, dispatch, getState }) => {
  leaveLog.info('slice', `rejectLeaveRequest thunk → id=${params.leaveRequestId}`);
  try {
    const useCase = ServiceLocator.get<RejectLeaveRequestUseCase>(
      DiKeys.REJECT_LEAVE_REQUEST_USE_CASE,
    );
    await useCase.execute(params);
    const state = (getState as () => { leave: LeaveState })().leave;
    dispatch(fetchAdminLeaveRequests({
      filter: state.adminFilter,
      status: state.adminFilter === 'All' ? undefined : state.adminFilter,
      page: state.adminPage,
    }));
    return params.leaveRequestId;
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

// ── Permissions (mock) ──────────────────────────────────────────────────────

export const fetchPermissionQuota = createAsyncThunk<
  SerializablePermissionQuota | null,
  void,
  { rejectValue: SerializableDomainError }
>('leave/fetchPermissionQuota', async (_, { rejectWithValue }) => {
  try {
    const useCase = ServiceLocator.get<GetPermissionQuotaUseCase>(
      DiKeys.GET_PERMISSION_QUOTA_USE_CASE,
    );
    const result = await useCase.execute();
    return result ? toSerializableQuota(result) : null;
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

export const fetchPermissionRequests = createAsyncThunk<
  { items: SerializablePermissionRequest[]; nextCursor: string | null; append: boolean },
  { cursor?: string; pageSize?: number; append: boolean },
  { rejectValue: SerializableDomainError }
>('leave/fetchPermissions', async ({ append, ...params }, { rejectWithValue }) => {
  try {
    const useCase = ServiceLocator.get<GetPermissionRequestsUseCase>(
      DiKeys.GET_PERMISSION_REQUESTS_USE_CASE,
    );
    const page: PermissionRequestsPage = await useCase.execute(params);
    return {
      items: page.items.map(toSerializablePermissionRequest),
      nextCursor: page.nextCursor,
      append,
    };
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

export const submitPermissionRequest = createAsyncThunk<
  SerializablePermissionRequest,
  RequestPermissionParams,
  { rejectValue: SerializableDomainError }
>('leave/submitPermission', async (params, { rejectWithValue }) => {
  try {
    const useCase = ServiceLocator.get<RequestPermissionUseCase>(
      DiKeys.REQUEST_PERMISSION_USE_CASE,
    );
    const result = await useCase.execute(params);
    return toSerializablePermissionRequest(result);
  } catch (e) {
    return rejectWithValue(serializeLeaveError(e));
  }
});

// ── Slice ───────────────────────────────────────────────────────────────────

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    clearLeaveErrors(state) {
      state.balancesFetchError = null;
      state.availableTypesFetchError = null;
      state.requestsFetchError = null;
      state.requestDetailFetchError = null;
      state.submitError = null;
      state.cancelError = null;
      state.adminFetchError = null;
      state.reviewError = null;
      state.permissionRequestsFetchError = null;
      state.requestPermissionError = null;
      if (state.balancesFetchStatus === 'error')         state.balancesFetchStatus = 'idle';
      if (state.availableTypesFetchStatus === 'error')   state.availableTypesFetchStatus = 'idle';
      if (state.requestsFetchStatus === 'error')         state.requestsFetchStatus = 'idle';
      if (state.requestDetailFetchStatus === 'error')    state.requestDetailFetchStatus = 'idle';
      if (state.submitStatus === 'error')                state.submitStatus = 'idle';
      if (state.cancelStatus === 'error')                state.cancelStatus = 'idle';
      if (state.adminFetchStatus === 'error')            state.adminFetchStatus = 'idle';
      if (state.reviewStatus === 'error')                state.reviewStatus = 'idle';
      if (state.permissionRequestsFetchStatus === 'error') state.permissionRequestsFetchStatus = 'idle';
      if (state.requestPermissionStatus === 'error')     state.requestPermissionStatus = 'idle';
    },
    setRequestsFilter(state, action: PayloadAction<LeaveFilter>) {
      state.requestsFilter = action.payload;
      state.requestsPage = 1;
    },
    setAdminFilter(state, action: PayloadAction<LeaveFilter>) {
      state.adminFilter = action.payload;
      state.adminPage = 1;
    },
    clearLastSubmitResult(state) {
      state.lastSubmitResult = null;
    },
    resetLeaveState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchLeaveBalances
      .addCase(fetchLeaveBalances.pending, (state) => {
        state.balancesFetchStatus = 'pending';
        state.balancesFetchError = null;
      })
      .addCase(fetchLeaveBalances.fulfilled, (state, action) => {
        state.balancesFetchStatus = 'loaded';
        state.balancesYear = action.payload.year;
        state.balances = action.payload.balances;
      })
      .addCase(fetchLeaveBalances.rejected, (state, action) => {
        state.balancesFetchStatus = 'error';
        state.balancesFetchError = action.payload ?? fallbackError('Failed to load balances');
      })

      // fetchAvailableLeaveTypes
      .addCase(fetchAvailableLeaveTypes.pending, (state) => {
        state.availableTypesFetchStatus = 'pending';
        state.availableTypesFetchError = null;
      })
      .addCase(fetchAvailableLeaveTypes.fulfilled, (state, action) => {
        state.availableTypesFetchStatus = 'loaded';
        state.availableTypesStartDate = action.payload.startDate;
        state.availableTypes = action.payload.types;
      })
      .addCase(fetchAvailableLeaveTypes.rejected, (state, action) => {
        state.availableTypesFetchStatus = 'error';
        state.availableTypesFetchError = action.payload ?? fallbackError('Failed to load leave types');
      })

      // fetchLeaveRequests
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.requestsFetchStatus = 'pending';
        state.requestsFetchError = null;
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        const { items, totalCount, page, pageSize, filter } = action.payload;
        state.requestsFetchStatus = 'loaded';
        state.requests = items;
        state.requestsTotalCount = totalCount;
        state.requestsPage = page;
        state.requestsPageSize = pageSize;
        state.requestsFilter = filter;
      })
      .addCase(fetchLeaveRequests.rejected, (state, action) => {
        state.requestsFetchStatus = 'error';
        state.requestsFetchError = action.payload ?? fallbackError('Failed to load requests');
      })

      // fetchLeaveRequestDetail
      .addCase(fetchLeaveRequestDetail.pending, (state) => {
        state.requestDetailFetchStatus = 'pending';
        state.requestDetailFetchError = null;
      })
      .addCase(fetchLeaveRequestDetail.fulfilled, (state, action) => {
        state.requestDetailFetchStatus = 'loaded';
        state.requestDetailsById[action.payload.id] = action.payload;
      })
      .addCase(fetchLeaveRequestDetail.rejected, (state, action) => {
        state.requestDetailFetchStatus = 'error';
        state.requestDetailFetchError = action.payload ?? fallbackError('Failed to load request detail');
      })

      // submitLeaveRequest
      .addCase(submitLeaveRequest.pending, (state) => {
        state.submitStatus = 'pending';
        state.submitError = null;
        state.lastSubmitResult = null;
      })
      .addCase(submitLeaveRequest.fulfilled, (state, action) => {
        state.submitStatus = 'idle';
        state.lastSubmitResult = action.payload;
      })
      .addCase(submitLeaveRequest.rejected, (state, action) => {
        state.submitStatus = 'error';
        state.submitError = action.payload ?? fallbackError('Failed to submit request');
      })

      // cancelLeaveRequest
      .addCase(cancelLeaveRequest.pending, (state) => {
        state.cancelStatus = 'pending';
        state.cancelError = null;
      })
      .addCase(cancelLeaveRequest.fulfilled, (state, action) => {
        state.cancelStatus = 'idle';
        delete state.requestDetailsById[action.payload];
      })
      .addCase(cancelLeaveRequest.rejected, (state, action) => {
        state.cancelStatus = 'error';
        state.cancelError = action.payload ?? fallbackError('Failed to cancel request');
      })

      // fetchAdminLeaveRequests
      .addCase(fetchAdminLeaveRequests.pending, (state) => {
        state.adminFetchStatus = 'pending';
        state.adminFetchError = null;
      })
      .addCase(fetchAdminLeaveRequests.fulfilled, (state, action) => {
        const { items, totalCount, page, pageSize, filter } = action.payload;
        state.adminFetchStatus = 'loaded';
        state.adminRequests = items;
        state.adminTotalCount = totalCount;
        state.adminPage = page;
        state.adminPageSize = pageSize;
        state.adminFilter = filter;
      })
      .addCase(fetchAdminLeaveRequests.rejected, (state, action) => {
        state.adminFetchStatus = 'error';
        state.adminFetchError = action.payload ?? fallbackError('Failed to load admin requests');
      })

      // approve / reject share reviewStatus
      .addCase(approveLeaveRequest.pending, (state) => {
        state.reviewStatus = 'pending';
        state.reviewError = null;
      })
      .addCase(approveLeaveRequest.fulfilled, (state) => {
        state.reviewStatus = 'idle';
      })
      .addCase(approveLeaveRequest.rejected, (state, action) => {
        state.reviewStatus = 'error';
        state.reviewError = action.payload ?? fallbackError('Failed to approve request');
      })
      .addCase(rejectLeaveRequest.pending, (state) => {
        state.reviewStatus = 'pending';
        state.reviewError = null;
      })
      .addCase(rejectLeaveRequest.fulfilled, (state) => {
        state.reviewStatus = 'idle';
      })
      .addCase(rejectLeaveRequest.rejected, (state, action) => {
        state.reviewStatus = 'error';
        state.reviewError = action.payload ?? fallbackError('Failed to reject request');
      })

      // fetchPermissionQuota
      .addCase(fetchPermissionQuota.fulfilled, (state, action) => {
        state.permissionQuota = action.payload;
      })

      // fetchPermissionRequests
      .addCase(fetchPermissionRequests.pending, (state) => {
        state.permissionRequestsFetchStatus = 'pending';
        state.permissionRequestsFetchError = null;
      })
      .addCase(fetchPermissionRequests.fulfilled, (state, action) => {
        const { items, nextCursor, append } = action.payload;
        state.permissionRequests = append ? [...state.permissionRequests, ...items] : items;
        state.permissionRequestsNextCursor = nextCursor;
        state.permissionRequestsHasMore = nextCursor !== null;
        state.permissionRequestsFetchStatus = 'loaded';
      })
      .addCase(fetchPermissionRequests.rejected, (state, action) => {
        state.permissionRequestsFetchStatus = 'error';
        state.permissionRequestsFetchError =
          action.payload ?? { code: 'leave/unknown', message: 'Failed to load permissions' };
      })

      // submitPermissionRequest
      .addCase(submitPermissionRequest.pending, (state) => {
        state.requestPermissionStatus = 'pending';
        state.requestPermissionError = null;
      })
      .addCase(submitPermissionRequest.fulfilled, (state, action) => {
        state.requestPermissionStatus = 'idle';
        state.permissionRequests = [action.payload, ...state.permissionRequests];
      })
      .addCase(submitPermissionRequest.rejected, (state, action) => {
        state.requestPermissionStatus = 'error';
        state.requestPermissionError =
          action.payload ?? { code: 'leave/unknown', message: 'Failed to submit permission' };
      });
  },
});

const fallbackError = (message: string): SerializableLeaveError => ({
  code: 'leave/unknown',
  message,
  leaveCode: 'unknown',
});

export const {
  clearLeaveErrors,
  setRequestsFilter,
  setAdminFilter,
  clearLastSubmitResult,
  resetLeaveState,
} = leaveSlice.actions;

export default leaveSlice.reducer;

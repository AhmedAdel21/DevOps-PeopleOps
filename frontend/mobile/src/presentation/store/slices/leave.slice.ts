import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { ServiceLocator } from '@/di';
import { DiKeys } from '@/core/keys/di.key';
import type {
  LeaveBalance,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveRequestsPage,
  LeaveType,
  PermissionQuota,
  PermissionRequest,
  PermissionRequestStatus,
  PermissionRequestsPage,
  PermissionType,
} from '@/domain/entities';
import type {
  GetLeaveRequestsParams,
  GetPermissionRequestsParams,
  LeaveBalancesResult,
  RequestLeaveParams,
  RequestPermissionParams,
} from '@/domain/repositories';
import {
  GetLeaveBalancesUseCase,
  GetLeaveRequestsUseCase,
  GetPermissionRequestsUseCase,
  RequestLeaveUseCase,
  RequestPermissionUseCase,
} from '@/domain/use_cases';
import { LeaveError } from '@/domain/errors';
import { leaveLog } from '@/core/logger';
import type { SerializableDomainError } from '../hooks';

type FetchStatus = 'idle' | 'pending' | 'loaded' | 'error';
type ActionStatus = 'idle' | 'pending' | 'error';

// All fields are primitives — no Date objects in the store.
export interface SerializableLeaveBalance {
  type: LeaveType;
  remaining: number | null;
  used: number | null;
  total: number | null;
  unlimited?: boolean;
}

export interface SerializablePermissionQuota {
  permissionsUsed: number;
  permissionsAllowed: number;
  monthResetsAt: string;
}

export interface SerializableLeaveRequest {
  id: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  durationDays: number;
  status: LeaveRequestStatus;
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

export interface LeaveState {
  balances: SerializableLeaveBalance[];
  permissionQuota: SerializablePermissionQuota | null;
  balancesFetchStatus: FetchStatus;
  balancesFetchError: SerializableDomainError | null;

  requests: SerializableLeaveRequest[];
  requestsNextCursor: string | null;
  requestsHasMore: boolean;
  requestsFetchStatus: FetchStatus;
  requestsFetchError: SerializableDomainError | null;

  permissionRequests: SerializablePermissionRequest[];
  permissionRequestsNextCursor: string | null;
  permissionRequestsHasMore: boolean;
  permissionRequestsFetchStatus: FetchStatus;
  permissionRequestsFetchError: SerializableDomainError | null;

  requestLeaveStatus: ActionStatus;
  requestLeaveError: SerializableDomainError | null;

  requestPermissionStatus: ActionStatus;
  requestPermissionError: SerializableDomainError | null;
}

const initialState: LeaveState = {
  balances: [],
  permissionQuota: null,
  balancesFetchStatus: 'idle',
  balancesFetchError: null,

  requests: [],
  requestsNextCursor: null,
  requestsHasMore: false,
  requestsFetchStatus: 'idle',
  requestsFetchError: null,

  permissionRequests: [],
  permissionRequestsNextCursor: null,
  permissionRequestsHasMore: false,
  permissionRequestsFetchStatus: 'idle',
  permissionRequestsFetchError: null,

  requestLeaveStatus: 'idle',
  requestLeaveError: null,

  requestPermissionStatus: 'idle',
  requestPermissionError: null,
};

// ── Serialization helpers ────────────────────────────────────────────────────

const toSerializableBalance = (b: LeaveBalance): SerializableLeaveBalance => ({
  type: b.type,
  remaining: b.remaining,
  used: b.used,
  total: b.total,
  unlimited: b.unlimited,
});

const toSerializableQuota = (q: PermissionQuota): SerializablePermissionQuota => ({
  permissionsUsed: q.permissionsUsed,
  permissionsAllowed: q.permissionsAllowed,
  monthResetsAt: q.monthResetsAt,
});

const toSerializableRequest = (r: LeaveRequest): SerializableLeaveRequest => ({
  id: r.id,
  leaveType: r.leaveType,
  fromDate: r.fromDate,
  toDate: r.toDate,
  durationDays: r.durationDays,
  status: r.status,
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

const serializeError = (e: unknown): SerializableDomainError => {
  if (e instanceof LeaveError) {
    return { code: e.code, message: e.message };
  }
  return { code: 'leave/unknown', message: 'Leave operation failed' };
};

// ── Thunks ──────────────────────────────────────────────────────────────────

export interface FetchBalancesResult {
  balances: SerializableLeaveBalance[];
  permissionQuota: SerializablePermissionQuota | null;
}

export const fetchLeaveBalances = createAsyncThunk<
  FetchBalancesResult,
  void,
  { rejectValue: SerializableDomainError }
>('leave/fetchBalances', async (_, { rejectWithValue }) => {
  leaveLog.info('slice', 'fetchLeaveBalances thunk →');
  try {
    const useCase = ServiceLocator.get<GetLeaveBalancesUseCase>(
      DiKeys.GET_LEAVE_BALANCES_USE_CASE,
    );
    const result: LeaveBalancesResult = await useCase.execute();
    return {
      balances: result.balances.map(toSerializableBalance),
      permissionQuota: result.permissionQuota ? toSerializableQuota(result.permissionQuota) : null,
    };
  } catch (e) {
    return rejectWithValue(serializeError(e));
  }
});

export const fetchLeaveRequests = createAsyncThunk<
  { items: SerializableLeaveRequest[]; nextCursor: string | null; append: boolean },
  GetLeaveRequestsParams & { append: boolean },
  { rejectValue: SerializableDomainError }
>('leave/fetchRequests', async ({ append, ...params }, { rejectWithValue }) => {
  leaveLog.info(
    'slice',
    `fetchLeaveRequests thunk → cursor=${params.cursor ?? 'none'}, append=${append}`,
  );
  try {
    const useCase = ServiceLocator.get<GetLeaveRequestsUseCase>(
      DiKeys.GET_LEAVE_REQUESTS_USE_CASE,
    );
    const page: LeaveRequestsPage = await useCase.execute(params);
    return {
      items: page.items.map(toSerializableRequest),
      nextCursor: page.nextCursor,
      append,
    };
  } catch (e) {
    return rejectWithValue(serializeError(e));
  }
});

export const submitLeaveRequest = createAsyncThunk<
  SerializableLeaveRequest,
  RequestLeaveParams,
  { rejectValue: SerializableDomainError }
>('leave/submitRequest', async (params, { rejectWithValue }) => {
  leaveLog.info(
    'slice',
    `submitLeaveRequest thunk → leaveType=${params.leaveType}, from=${params.fromDate}, to=${params.toDate}`,
  );
  try {
    const useCase = ServiceLocator.get<RequestLeaveUseCase>(DiKeys.REQUEST_LEAVE_USE_CASE);
    const result = await useCase.execute(params);
    return toSerializableRequest(result);
  } catch (e) {
    return rejectWithValue(serializeError(e));
  }
});

export const fetchPermissionRequests = createAsyncThunk<
  { items: SerializablePermissionRequest[]; nextCursor: string | null; append: boolean },
  GetPermissionRequestsParams & { append: boolean },
  { rejectValue: SerializableDomainError }
>('leave/fetchPermissions', async ({ append, ...params }, { rejectWithValue }) => {
  leaveLog.info(
    'slice',
    `fetchPermissionRequests thunk → cursor=${params.cursor ?? 'none'}, append=${append}`,
  );
  try {
    const useCase = ServiceLocator.get<GetPermissionRequestsUseCase>(
      DiKeys.GET_PERMISSION_REQUESTS_USE_CASE,
    );
    const page = await useCase.execute(params);
    return {
      items: page.items.map(toSerializablePermissionRequest),
      nextCursor: page.nextCursor,
      append,
    };
  } catch (e) {
    return rejectWithValue(serializeError(e));
  }
});

export const submitPermissionRequest = createAsyncThunk<
  SerializablePermissionRequest,
  RequestPermissionParams,
  { rejectValue: SerializableDomainError }
>('leave/submitPermission', async (params, { rejectWithValue }) => {
  leaveLog.info(
    'slice',
    `submitPermissionRequest thunk → permissionType=${params.permissionType}, date=${params.date}`,
  );
  try {
    const useCase = ServiceLocator.get<RequestPermissionUseCase>(
      DiKeys.REQUEST_PERMISSION_USE_CASE,
    );
    const result = await useCase.execute(params);
    return toSerializablePermissionRequest(result);
  } catch (e) {
    return rejectWithValue(serializeError(e));
  }
});

// ── Slice ────────────────────────────────────────────────────────────────────

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    clearLeaveErrors(state) {
      state.balancesFetchError = null;
      state.requestsFetchError = null;
      state.permissionRequestsFetchError = null;
      state.requestLeaveError = null;
      state.requestPermissionError = null;
      if (state.balancesFetchStatus === 'error') state.balancesFetchStatus = 'idle';
      if (state.requestsFetchStatus === 'error') state.requestsFetchStatus = 'idle';
      if (state.permissionRequestsFetchStatus === 'error') state.permissionRequestsFetchStatus = 'idle';
      if (state.requestLeaveStatus === 'error') state.requestLeaveStatus = 'idle';
      if (state.requestPermissionStatus === 'error') state.requestPermissionStatus = 'idle';
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
      .addCase(
        fetchLeaveBalances.fulfilled,
        (state, action: PayloadAction<FetchBalancesResult>) => {
          state.balancesFetchStatus = 'loaded';
          state.balances = action.payload.balances;
          state.permissionQuota = action.payload.permissionQuota;
        },
      )
      .addCase(fetchLeaveBalances.rejected, (state, action) => {
        state.balancesFetchStatus = 'error';
        state.balancesFetchError =
          action.payload ?? { code: 'leave/unknown', message: 'Failed to load balances' };
      })

      // fetchLeaveRequests
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.requestsFetchStatus = 'pending';
        state.requestsFetchError = null;
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        const { items, nextCursor, append } = action.payload;
        state.requests = append ? [...state.requests, ...items] : items;
        state.requestsNextCursor = nextCursor;
        state.requestsHasMore = nextCursor !== null;
        state.requestsFetchStatus = 'loaded';
      })
      .addCase(fetchLeaveRequests.rejected, (state, action) => {
        state.requestsFetchStatus = 'error';
        state.requestsFetchError =
          action.payload ?? { code: 'leave/unknown', message: 'Failed to load requests' };
      })

      // submitLeaveRequest
      .addCase(submitLeaveRequest.pending, (state) => {
        state.requestLeaveStatus = 'pending';
        state.requestLeaveError = null;
      })
      .addCase(
        submitLeaveRequest.fulfilled,
        (state, action: PayloadAction<SerializableLeaveRequest>) => {
          state.requestLeaveStatus = 'idle';
          state.requests = [action.payload, ...state.requests];
        },
      )
      .addCase(submitLeaveRequest.rejected, (state, action) => {
        state.requestLeaveStatus = 'error';
        state.requestLeaveError =
          action.payload ?? { code: 'leave/unknown', message: 'Failed to submit request' };
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
      .addCase(
        submitPermissionRequest.fulfilled,
        (state, action: PayloadAction<SerializablePermissionRequest>) => {
          state.requestPermissionStatus = 'idle';
          state.permissionRequests = [action.payload, ...state.permissionRequests];
        },
      )
      .addCase(submitPermissionRequest.rejected, (state, action) => {
        state.requestPermissionStatus = 'error';
        state.requestPermissionError =
          action.payload ?? { code: 'leave/unknown', message: 'Failed to submit permission' };
      });
  },
});

export const { clearLeaveErrors, resetLeaveState } = leaveSlice.actions;
export default leaveSlice.reducer;

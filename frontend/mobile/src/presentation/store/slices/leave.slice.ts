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
} from '@/domain/entities';
import type { GetLeaveRequestsParams, RequestLeaveParams } from '@/domain/repositories';
import {
  GetLeaveBalancesUseCase,
  GetLeaveRequestsUseCase,
  RequestLeaveUseCase,
} from '@/domain/use_cases';
import { LeaveError } from '@/domain/errors';
import { leaveLog } from '@/core/logger';
import type { SerializableDomainError } from '../hooks';

type FetchStatus = 'idle' | 'pending' | 'loaded' | 'error';
type ActionStatus = 'idle' | 'pending' | 'error';

// LeaveBalance and LeaveRequest contain only primitives — no Date conversion needed.
export interface SerializableLeaveBalance {
  type: LeaveType;
  remaining: number | null;
  used: number | null;
  total: number | null;
  unlimited?: boolean;
}

export interface SerializableLeaveRequest {
  id: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  durationDays: number;
  status: LeaveRequestStatus;
}

export interface LeaveState {
  balances: SerializableLeaveBalance[];
  balancesFetchStatus: FetchStatus;
  balancesFetchError: SerializableDomainError | null;

  requests: SerializableLeaveRequest[];
  requestsNextCursor: string | null;
  requestsHasMore: boolean;
  requestsFetchStatus: FetchStatus;
  requestsFetchError: SerializableDomainError | null;

  requestLeaveStatus: ActionStatus;
  requestLeaveError: SerializableDomainError | null;
}

const initialState: LeaveState = {
  balances: [],
  balancesFetchStatus: 'idle',
  balancesFetchError: null,

  requests: [],
  requestsNextCursor: null,
  requestsHasMore: false,
  requestsFetchStatus: 'idle',
  requestsFetchError: null,

  requestLeaveStatus: 'idle',
  requestLeaveError: null,
};

const toSerializableBalance = (b: LeaveBalance): SerializableLeaveBalance => ({
  type: b.type,
  remaining: b.remaining,
  used: b.used,
  total: b.total,
  unlimited: b.unlimited,
});

const toSerializableRequest = (r: LeaveRequest): SerializableLeaveRequest => ({
  id: r.id,
  leaveType: r.leaveType,
  fromDate: r.fromDate,
  toDate: r.toDate,
  durationDays: r.durationDays,
  status: r.status,
});

const serializeError = (e: unknown): SerializableDomainError => {
  if (e instanceof LeaveError) {
    return { code: e.code, message: e.message };
  }
  return { code: 'leave/unknown', message: 'Leave request failed' };
};

// ── Thunks ──────────────────────────────────────────────────────────────────

export const fetchLeaveBalances = createAsyncThunk<
  SerializableLeaveBalance[],
  void,
  { rejectValue: SerializableDomainError }
>('leave/fetchBalances', async (_, { rejectWithValue }) => {
  leaveLog.info('slice', 'fetchLeaveBalances thunk →');
  try {
    const useCase = ServiceLocator.get<GetLeaveBalancesUseCase>(
      DiKeys.GET_LEAVE_BALANCES_USE_CASE,
    );
    const result = await useCase.execute();
    return result.map(toSerializableBalance);
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
    const useCase = ServiceLocator.get<RequestLeaveUseCase>(
      DiKeys.REQUEST_LEAVE_USE_CASE,
    );
    const result = await useCase.execute(params);
    return toSerializableRequest(result);
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
      state.requestLeaveError = null;
      if (state.balancesFetchStatus === 'error') state.balancesFetchStatus = 'idle';
      if (state.requestsFetchStatus === 'error') state.requestsFetchStatus = 'idle';
      if (state.requestLeaveStatus === 'error') state.requestLeaveStatus = 'idle';
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
        (state, action: PayloadAction<SerializableLeaveBalance[]>) => {
          state.balancesFetchStatus = 'loaded';
          state.balances = action.payload;
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
        state.requestsFetchError = null;
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
          // Prepend the new request so it appears at the top of the list
          state.requests = [action.payload, ...state.requests];
        },
      )
      .addCase(submitLeaveRequest.rejected, (state, action) => {
        state.requestLeaveStatus = 'error';
        state.requestLeaveError =
          action.payload ?? { code: 'leave/unknown', message: 'Failed to submit request' };
      });
  },
});

export const { clearLeaveErrors, resetLeaveState } = leaveSlice.actions;
export default leaveSlice.reducer;

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { ServiceLocator } from '@/di';
import { DiKeys } from '@/core/keys/di.key';
import type { Attendance, AttendancePlace } from '@/domain/entities';
import {
  GetAttendanceStatusUseCase,
  SignInAttendanceUseCase,
  SignOutAttendanceUseCase,
} from '@/domain/use_cases';
import { AttendanceError } from '@/domain/errors';
import { attendanceLog } from '@/core/logger';
import type { SerializableDomainError } from '../hooks';

type FetchStatus = 'idle' | 'pending' | 'loaded' | 'error';
type ActionStatus = 'idle' | 'pending' | 'error';

interface SerializableAttendance {
  employeeId: string;
  displayName: string;
  avatarUrl: string | null;
  status: Attendance['status'];
  signInAtIso: string | null;
  signOutAtIso: string | null;
  departmentId: string | null;
  departmentName: string | null;
  isAdminOverride: boolean;
  overrideMarkedBy: string | null;
  overrideNote: string | null;
  lastUpdatedAtIso: string;
}

export interface AttendanceState {
  current: SerializableAttendance | null;
  fetchStatus: FetchStatus;
  fetchError: SerializableDomainError | null;
  signInStatus: ActionStatus;
  signInError: SerializableDomainError | null;
  signOutStatus: ActionStatus;
  signOutError: SerializableDomainError | null;
}

const initialState: AttendanceState = {
  current: null,
  fetchStatus: 'idle',
  fetchError: null,
  signInStatus: 'idle',
  signInError: null,
  signOutStatus: 'idle',
  signOutError: null,
};

const toSerializable = (a: Attendance): SerializableAttendance => ({
  employeeId: a.employeeId,
  displayName: a.displayName,
  avatarUrl: a.avatarUrl,
  status: a.status,
  signInAtIso: a.signInAt ? a.signInAt.toISOString() : null,
  signOutAtIso: a.signOutAt ? a.signOutAt.toISOString() : null,
  departmentId: a.departmentId,
  departmentName: a.departmentName,
  isAdminOverride: a.isAdminOverride,
  overrideMarkedBy: a.overrideMarkedBy,
  overrideNote: a.overrideNote,
  lastUpdatedAtIso: a.lastUpdatedAt.toISOString(),
});

const serializeError = (e: unknown): SerializableDomainError => {
  if (e instanceof AttendanceError) {
    return { code: e.code, message: e.message };
  }
  return { code: 'attendance/unknown', message: 'Attendance request failed' };
};

export const fetchAttendanceStatus = createAsyncThunk<
  SerializableAttendance,
  void,
  { rejectValue: SerializableDomainError }
>('attendance/fetchStatus', async (_, { rejectWithValue }) => {
  attendanceLog.info('slice', 'fetchAttendanceStatus thunk →');
  try {
    const useCase = ServiceLocator.get<GetAttendanceStatusUseCase>(
      DiKeys.GET_ATTENDANCE_STATUS_USE_CASE,
    );
    const result = await useCase.execute();
    return toSerializable(result);
  } catch (e) {
    return rejectWithValue(serializeError(e));
  }
});

export const signInAttendance = createAsyncThunk<
  SerializableAttendance,
  { place: AttendancePlace },
  { rejectValue: SerializableDomainError }
>('attendance/signIn', async ({ place }, { rejectWithValue }) => {
  attendanceLog.info('slice', `signInAttendance thunk → place=${place}`);
  try {
    const useCase = ServiceLocator.get<SignInAttendanceUseCase>(
      DiKeys.SIGN_IN_ATTENDANCE_USE_CASE,
    );
    const result = await useCase.execute({ place });
    return toSerializable(result);
  } catch (e) {
    return rejectWithValue(serializeError(e));
  }
});

export const signOutAttendance = createAsyncThunk<
  SerializableAttendance,
  void,
  { rejectValue: SerializableDomainError }
>('attendance/signOut', async (_, { rejectWithValue }) => {
  attendanceLog.info('slice', 'signOutAttendance thunk →');
  try {
    const useCase = ServiceLocator.get<SignOutAttendanceUseCase>(
      DiKeys.SIGN_OUT_ATTENDANCE_USE_CASE,
    );
    const result = await useCase.execute();
    return toSerializable(result);
  } catch (e) {
    return rejectWithValue(serializeError(e));
  }
});

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceErrors(state) {
      state.fetchError = null;
      state.signInError = null;
      state.signOutError = null;
      if (state.fetchStatus === 'error') state.fetchStatus = 'idle';
      if (state.signInStatus === 'error') state.signInStatus = 'idle';
      if (state.signOutStatus === 'error') state.signOutStatus = 'idle';
    },
    resetAttendanceState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceStatus.pending, (state) => {
        state.fetchStatus = 'pending';
        state.fetchError = null;
      })
      .addCase(
        fetchAttendanceStatus.fulfilled,
        (state, action: PayloadAction<SerializableAttendance>) => {
          state.fetchStatus = 'loaded';
          state.current = action.payload;
        },
      )
      .addCase(fetchAttendanceStatus.rejected, (state, action) => {
        state.fetchStatus = 'error';
        state.fetchError =
          action.payload ?? {
            code: 'attendance/unknown',
            message: 'Attendance request failed',
          };
      })

      .addCase(signInAttendance.pending, (state) => {
        state.signInStatus = 'pending';
        state.signInError = null;
      })
      .addCase(
        signInAttendance.fulfilled,
        (state, action: PayloadAction<SerializableAttendance>) => {
          state.signInStatus = 'idle';
          state.current = action.payload;
          state.fetchStatus = 'loaded';
        },
      )
      .addCase(signInAttendance.rejected, (state, action) => {
        state.signInStatus = 'error';
        state.signInError =
          action.payload ?? {
            code: 'attendance/unknown',
            message: 'Sign-in failed',
          };
      })

      .addCase(signOutAttendance.pending, (state) => {
        state.signOutStatus = 'pending';
        state.signOutError = null;
      })
      .addCase(
        signOutAttendance.fulfilled,
        (state, action: PayloadAction<SerializableAttendance>) => {
          state.signOutStatus = 'idle';
          state.current = action.payload;
          state.fetchStatus = 'loaded';
        },
      )
      .addCase(signOutAttendance.rejected, (state, action) => {
        state.signOutStatus = 'error';
        state.signOutError =
          action.payload ?? {
            code: 'attendance/unknown',
            message: 'Sign-out failed',
          };
      });
  },
});

export const {
  clearAttendanceErrors,
  resetAttendanceState,
} = attendanceSlice.actions;
export default attendanceSlice.reducer;
export type { SerializableAttendance };

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { ServiceLocator } from '@/di';
import { DiKeys } from '@/core/keys/di.key';
import type { User } from '@/domain/entities';
import type { AuthStateSubscription } from '@/domain/repositories';
import {
  LoginUseCase,
  LogoutUseCase,
  ObserveAuthStateUseCase,
  ZohoLoginUseCase,
} from '@/domain/use_cases';
import { AuthError } from '@/domain/errors';
import { authLog } from '@/core/logger';
import type { SerializableDomainError } from '../hooks';
import { fetchCurrentUser, clearCurrentUser } from './me.slice';

type AuthStatus = 'uninitialized' | 'authenticated' | 'unauthenticated';
type ActionStatus = 'idle' | 'pending' | 'error';

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  loginStatus: ActionStatus;
  loginError: SerializableDomainError | null;
  zohoLoginStatus: ActionStatus;
  zohoLoginError: SerializableDomainError | null;
  logoutStatus: ActionStatus;
  logoutError: SerializableDomainError | null;
}

const initialState: AuthState = {
  user: null,
  status: 'uninitialized',
  loginStatus: 'idle',
  loginError: null,
  zohoLoginStatus: 'idle',
  zohoLoginError: null,
  logoutStatus: 'idle',
  logoutError: null,
};

let authSubscription: AuthStateSubscription | null = null;

const serializeError = (e: unknown): SerializableDomainError => {
  if (e instanceof AuthError) {
    return { code: e.code, message: e.message };
  }
  return { code: 'auth/unknown', message: 'Authentication failed' };
};

export const bootstrapAuth = createAsyncThunk<void, void>(
  'auth/bootstrap',
  async (_, { dispatch }) => {
    if (authSubscription) {
      authLog.info('bootstrap', 'bootstrapAuth skipped (already subscribed)');
      return;
    }
    authLog.info('bootstrap', 'bootstrapAuth starting');
    const useCase = ServiceLocator.get<ObserveAuthStateUseCase>(
      DiKeys.OBSERVE_AUTH_STATE_USE_CASE,
    );
    authSubscription = useCase.execute({
      onChange: (user) => {
        authLog.info(
          'observer',
          `auth state changed → ${user ? `authenticated (uid=${user.id})` : 'unauthenticated'}`,
        );
        dispatch(authSlice.actions.authStateChanged({ user }));
        // Identity (am I logged in?) and profile (who am I?) are split:
        // Firebase tells us the former, /api/auth/me tells us the latter.
        // Fan out from this single observer so both login paths converge.
        if (user) {
          dispatch(fetchCurrentUser());
        } else {
          dispatch(clearCurrentUser());
        }
      },
    });
    authLog.info('bootstrap', 'bootstrapAuth installed subscription');
  },
);

export const loginWithEmail = createAsyncThunk<
  void,
  { email: string; password: string },
  { rejectValue: SerializableDomainError }
>('auth/login', async (input, { rejectWithValue }) => {
  authLog.info(
    'slice',
    `loginWithEmail thunk → email=${authLog.maskEmail(input.email)}`,
  );
  try {
    const useCase = ServiceLocator.get<LoginUseCase>(DiKeys.LOGIN_USE_CASE);
    await useCase.execute(input);
    authLog.info('slice', 'loginWithEmail thunk resolved (awaiting observer)');
  } catch (e) {
    const serialized = serializeError(e);
    authLog.error(
      'slice',
      `loginWithEmail thunk rejected (code=${serialized.code})`,
    );
    return rejectWithValue(serialized);
  }
});

export const loginWithZoho = createAsyncThunk<
  void,
  void,
  { rejectValue: SerializableDomainError }
>('auth/loginWithZoho', async (_, { rejectWithValue }) => {
  authLog.info('slice', 'loginWithZoho thunk →');
  try {
    const useCase = ServiceLocator.get<ZohoLoginUseCase>(
      DiKeys.ZOHO_LOGIN_USE_CASE,
    );
    await useCase.execute();
    authLog.info('slice', 'loginWithZoho thunk resolved (awaiting observer)');
  } catch (e) {
    const serialized = serializeError(e);
    if (serialized.code === 'auth/zoho-cancelled') {
      authLog.info('slice', 'loginWithZoho: user cancelled');
      return; // treat cancel as a no-op, not an error
    }
    authLog.error(
      'slice',
      `loginWithZoho thunk rejected (code=${serialized.code})`,
    );
    return rejectWithValue(serialized);
  }
});

export const logout = createAsyncThunk<
  void,
  void,
  { rejectValue: SerializableDomainError }
>('auth/logout', async (_, { dispatch, rejectWithValue }) => {
  authLog.info('slice', 'logout thunk →');
  try {
    // Wipe profile FIRST so any reactive observer never sees a signed-out
    // Firebase state next to a populated currentUser. The observer-triggered
    // clearCurrentUser later is then a no-op.
    dispatch(clearCurrentUser());
    const useCase = ServiceLocator.get<LogoutUseCase>(DiKeys.LOGOUT_USE_CASE);
    await useCase.execute();
    authLog.info('slice', 'logout thunk resolved (awaiting observer)');
  } catch (e) {
    const serialized = serializeError(e);
    authLog.error(
      'slice',
      `logout thunk rejected (code=${serialized.code})`,
    );
    return rejectWithValue(serialized);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStateChanged(
      state,
      action: PayloadAction<{ user: User | null }>,
    ) {
      const nextStatus = action.payload.user
        ? 'authenticated'
        : 'unauthenticated';
      authLog.info(
        'slice',
        `reducer authStateChanged → status: ${state.status} → ${nextStatus}`,
      );
      state.user = action.payload.user;
      state.status = nextStatus;
    },
    clearLoginError(state) {
      state.loginStatus = 'idle';
      state.loginError = null;
    },
    clearZohoLoginError(state) {
      state.zohoLoginStatus = 'idle';
      state.zohoLoginError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.loginStatus = 'pending';
        state.loginError = null;
      })
      .addCase(loginWithEmail.fulfilled, (state) => {
        state.loginStatus = 'idle';
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.loginStatus = 'error';
        state.loginError =
          action.payload ?? {
            code: 'auth/unknown',
            message: 'Authentication failed',
          };
      })
      .addCase(loginWithZoho.pending, (state) => {
        state.zohoLoginStatus = 'pending';
        state.zohoLoginError = null;
      })
      .addCase(loginWithZoho.fulfilled, (state) => {
        state.zohoLoginStatus = 'idle';
        state.zohoLoginError = null;
      })
      .addCase(loginWithZoho.rejected, (state, action) => {
        state.zohoLoginStatus = 'error';
        state.zohoLoginError =
          action.payload ?? {
            code: 'auth/unknown',
            message: 'Authentication failed',
          };
      })
      .addCase(logout.pending, (state) => {
        state.logoutStatus = 'pending';
        state.logoutError = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.logoutStatus = 'idle';
      })
      .addCase(logout.rejected, (state, action) => {
        state.logoutStatus = 'error';
        state.logoutError =
          action.payload ?? {
            code: 'auth/unknown',
            message: 'Sign out failed',
          };
      });
  },
});

export const { clearLoginError, clearZohoLoginError } = authSlice.actions;
export default authSlice.reducer;

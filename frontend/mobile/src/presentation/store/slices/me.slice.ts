import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceLocator } from '@/di';
import { DiKeys } from '@/core/keys/di.key';
import { StorageKeys } from '@/core/keys/storage.key';
import type { Me } from '@/domain/entities';
import type { FetchMeUseCase, LogoutUseCase } from '@/domain/use_cases';
import { authLog } from '@/core/logger';
import { MeError } from '@/domain/errors';
import type { SerializableDomainError } from '../hooks';

type FetchStatus = 'idle' | 'pending' | 'error';
type BootstrapStatus = 'uninitialized' | 'hydrated';

export interface MeState {
  /** Authoritative profile + permissions from GET /api/auth/me. */
  currentUser: Me | null;
  /** First-fetch status. Drives splash/login → home gating. */
  fetchStatus: FetchStatus;
  fetchError: SerializableDomainError | null;
  /** Background-refresh status. Does NOT block UI; never shows a spinner. */
  refreshStatus: FetchStatus;
  /** Cold-start cache hydration; flips to 'hydrated' once we've checked
   * AsyncStorage so screens know whether `currentUser` is "absent" vs
   * "we just haven't looked yet". */
  bootstrapStatus: BootstrapStatus;
}

const initialState: MeState = {
  currentUser: null,
  fetchStatus: 'idle',
  fetchError: null,
  refreshStatus: 'idle',
  bootstrapStatus: 'uninitialized',
};

const serializeError = (e: unknown): SerializableDomainError => {
  if (e instanceof MeError) {
    return { code: e.code, message: e.message };
  }
  if (e instanceof Error) {
    return { code: 'me/unknown', message: e.message };
  }
  return { code: 'me/unknown', message: 'Failed to load profile' };
};

const persist = async (me: Me): Promise<void> => {
  try {
    await AsyncStorage.setItem(StorageKeys.ME_PROFILE, JSON.stringify(me));
  } catch (e) {
    authLog.warn('slice', 'failed to persist Me to AsyncStorage', e);
  }
};

const purge = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(StorageKeys.ME_PROFILE);
  } catch (e) {
    authLog.warn('slice', 'failed to purge Me from AsyncStorage', e);
  }
};

/**
 * Synchronously hydrate currentUser from the AsyncStorage cache so the
 * splash/login transition has a value to render against. Resolves with
 * the cached Me (or null) so callers can decide UX.
 */
export const bootstrapMe = createAsyncThunk<Me | null, void>(
  'me/bootstrap',
  async () => {
    authLog.info('bootstrap', 'bootstrapMe → reading cache');
    try {
      const raw = await AsyncStorage.getItem(StorageKeys.ME_PROFILE);
      if (!raw) {
        authLog.info('bootstrap', 'bootstrapMe → no cache');
        return null;
      }
      const cached = JSON.parse(raw) as Me;
      authLog.info(
        'bootstrap',
        `bootstrapMe → cache hit (role=${cached.role}, perms=${cached.permissions?.length ?? 0})`,
      );
      return cached;
    } catch (e) {
      authLog.warn('bootstrap', 'bootstrapMe → cache read failed', e);
      return null;
    }
  },
);

type StateShape = { me: { currentUser: Me | null } };

/**
 * Initial /me fetch after login. Sets fetchStatus and replaces cache on
 * success.
 *
 * Failure handling:
 * - 401 is handled synchronously by the HttpClient onUnauthorized hook
 *   (clears the slice + signs Firebase out) before this catch runs; we
 *   still record the rejection so the splash/login can surface it.
 * - For 403 / 5xx-after-retry / unknown: if there's NO cached user, we
 *   sign out (we'd otherwise be stuck on the splash with no profile).
 *   If there IS a cached user, we keep it — the next foreground refresh
 *   will retry. This matches the spec's "5xx → keep cached copy" rule.
 */
export const fetchCurrentUser = createAsyncThunk<
  Me,
  void,
  { rejectValue: SerializableDomainError }
>('me/fetch', async (_, { getState, rejectWithValue }) => {
  authLog.info('slice', 'fetchCurrentUser thunk →');
  try {
    const useCase = ServiceLocator.get<FetchMeUseCase>(DiKeys.FETCH_ME_USE_CASE);
    const me = await useCase.execute();
    void persist(me);
    return me;
  } catch (e) {
    const serialized = serializeError(e);
    authLog.error('slice', `fetchCurrentUser rejected (code=${serialized.code})`);

    const isUnauthorized = serialized.code === 'me/unauthorized';
    const hasCachedUser = (getState() as StateShape).me.currentUser !== null;
    const shouldSignOut = !isUnauthorized && !hasCachedUser;

    if (shouldSignOut) {
      authLog.warn(
        'slice',
        `fetchCurrentUser → signing out (code=${serialized.code}, no cached user)`,
      );
      try {
        const logoutUseCase = ServiceLocator.get<LogoutUseCase>(DiKeys.LOGOUT_USE_CASE);
        await logoutUseCase.execute();
      } catch (signOutErr) {
        authLog.warn('slice', 'fetchCurrentUser cleanup signOut threw (non-fatal)', signOutErr);
      }
    }

    return rejectWithValue(serialized);
  }
});

/**
 * Background refresh — no fetchStatus flap, no spinner. Used by the >5min
 * AppState foreground hook and after password change. On 5xx the cached
 * copy stays in place (we just log + mark refreshStatus error).
 */
export const refreshCurrentUser = createAsyncThunk<
  Me,
  void,
  { rejectValue: SerializableDomainError }
>('me/refresh', async (_, { rejectWithValue }) => {
  authLog.info('slice', 'refreshCurrentUser thunk →');
  try {
    const useCase = ServiceLocator.get<FetchMeUseCase>(DiKeys.FETCH_ME_USE_CASE);
    const me = await useCase.execute();
    void persist(me);
    return me;
  } catch (e) {
    const serialized = serializeError(e);
    authLog.warn('slice', `refreshCurrentUser rejected (code=${serialized.code})`);
    return rejectWithValue(serialized);
  }
});

const meSlice = createSlice({
  name: 'me',
  initialState,
  reducers: {
    /**
     * Synchronous wipe — call BEFORE auth().signOut() so the auth observer
     * never sees a signed-out Firebase state next to a populated profile.
     */
    clearCurrentUser(state) {
      authLog.info('slice', 'clearCurrentUser → wiping store + cache');
      state.currentUser = null;
      state.fetchStatus = 'idle';
      state.fetchError = null;
      state.refreshStatus = 'idle';
      void purge();
    },
    clearFetchError(state) {
      state.fetchStatus = 'idle';
      state.fetchError = null;
    },
    /** Local-only flip after the user successfully changes their password,
     * so the UI unblocks before the next /me refresh returns. */
    markPasswordChanged(state) {
      if (state.currentUser) {
        state.currentUser = {
          ...state.currentUser,
          mustChangePassword: false,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapMe.fulfilled, (state, action: PayloadAction<Me | null>) => {
        if (action.payload) {
          state.currentUser = action.payload;
        }
        state.bootstrapStatus = 'hydrated';
      })
      .addCase(bootstrapMe.rejected, (state) => {
        state.bootstrapStatus = 'hydrated';
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.fetchStatus = 'pending';
        state.fetchError = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.fetchStatus = 'idle';
        state.fetchError = null;
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.fetchStatus = 'error';
        state.fetchError =
          action.payload ?? { code: 'me/unknown', message: 'Failed to load profile' };
      })
      .addCase(refreshCurrentUser.fulfilled, (state, action) => {
        state.refreshStatus = 'idle';
        state.currentUser = action.payload;
      })
      .addCase(refreshCurrentUser.rejected, (state) => {
        state.refreshStatus = 'error';
      });
  },
});

export const { clearCurrentUser, clearFetchError, markPasswordChanged } =
  meSlice.actions;
export default meSlice.reducer;

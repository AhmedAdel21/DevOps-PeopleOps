import reducer, {
  bootstrapMe,
  fetchCurrentUser,
  refreshCurrentUser,
  clearCurrentUser,
  markPasswordChanged,
  type MeState,
} from '../src/presentation/store/slices/me.slice';
import type { Me } from '../src/domain/entities';

const makeMe = (overrides: Partial<Me> = {}): Me => ({
  subjectId: 'uid-1',
  provider: 'firebase',
  email: 'a@b.c',
  displayName: 'A',
  role: 'Employee',
  permissions: ['leave:submit'],
  mustChangePassword: false,
  employee: null,
  ...overrides,
});

const baseState: MeState = {
  currentUser: null,
  fetchStatus: 'idle',
  fetchError: null,
  refreshStatus: 'idle',
  bootstrapStatus: 'uninitialized',
};

test('bootstrapMe.fulfilled with cached user populates currentUser and flips status', () => {
  const me = makeMe();
  const action = bootstrapMe.fulfilled(me, '');
  const next = reducer(baseState, action);
  expect(next.currentUser).toEqual(me);
  expect(next.bootstrapStatus).toBe('hydrated');
});

test('bootstrapMe.fulfilled with null leaves currentUser null but flips status', () => {
  const action = bootstrapMe.fulfilled(null, '');
  const next = reducer(baseState, action);
  expect(next.currentUser).toBeNull();
  expect(next.bootstrapStatus).toBe('hydrated');
});

test('fetchCurrentUser.pending sets pending and clears prior error', () => {
  const state = {
    ...baseState,
    fetchStatus: 'error' as const,
    fetchError: { code: 'http/500', message: 'boom' },
  };
  const action = fetchCurrentUser.pending('', undefined);
  const next = reducer(state, action);
  expect(next.fetchStatus).toBe('pending');
  expect(next.fetchError).toBeNull();
});

test('fetchCurrentUser.fulfilled replaces currentUser and clears error', () => {
  const me = makeMe({ role: 'Manager', permissions: ['leave:approve'] });
  const action = fetchCurrentUser.fulfilled(me, '', undefined);
  const next = reducer(baseState, action);
  expect(next.currentUser).toEqual(me);
  expect(next.fetchStatus).toBe('idle');
});

test('fetchCurrentUser.rejected records the error code', () => {
  const action = fetchCurrentUser.rejected(
    new Error('x'),
    '',
    undefined,
    { code: 'http/500', message: 'boom' },
  );
  const next = reducer(baseState, action);
  expect(next.fetchStatus).toBe('error');
  expect(next.fetchError).toEqual({ code: 'http/500', message: 'boom' });
});

test('refreshCurrentUser.fulfilled replaces currentUser without flapping fetchStatus', () => {
  const me = makeMe({ permissions: ['leave:approve'] });
  const state: MeState = { ...baseState, currentUser: makeMe(), fetchStatus: 'idle' };
  const action = refreshCurrentUser.fulfilled(me, '', undefined);
  const next = reducer(state, action);
  expect(next.currentUser).toEqual(me);
  expect(next.refreshStatus).toBe('idle');
  expect(next.fetchStatus).toBe('idle'); // unchanged — background refresh never spins
});

test('refreshCurrentUser.rejected marks refreshStatus error but keeps cached user', () => {
  const cached = makeMe();
  const state: MeState = { ...baseState, currentUser: cached };
  const action = refreshCurrentUser.rejected(new Error('x'), '', undefined);
  const next = reducer(state, action);
  expect(next.refreshStatus).toBe('error');
  expect(next.currentUser).toEqual(cached);
});

test('clearCurrentUser wipes everything', () => {
  const state: MeState = {
    ...baseState,
    currentUser: makeMe(),
    fetchStatus: 'pending',
    fetchError: { code: 'x', message: 'x' },
  };
  const next = reducer(state, clearCurrentUser());
  expect(next.currentUser).toBeNull();
  expect(next.fetchStatus).toBe('idle');
  expect(next.fetchError).toBeNull();
});

test('markPasswordChanged flips mustChangePassword without touching the rest', () => {
  const cached = makeMe({ mustChangePassword: true, role: 'HRManager' });
  const state: MeState = { ...baseState, currentUser: cached };
  const next = reducer(state, markPasswordChanged());
  expect(next.currentUser?.mustChangePassword).toBe(false);
  expect(next.currentUser?.role).toBe('HRManager');
});

test('markPasswordChanged is a no-op when there is no user', () => {
  const next = reducer(baseState, markPasswordChanged());
  expect(next.currentUser).toBeNull();
});

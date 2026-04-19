import reducer, {
  fetchAttendanceHistory,
  type AttendanceState,
} from '../src/presentation/store/slices/attendance.slice';
import type { SerializableAttendanceRecord } from '../src/presentation/store/slices/attendance.slice';

const makeRecord = (date: string): SerializableAttendanceRecord => ({
  date,
  status: 'signed_out',
  place: 'in_office',
  signInAtIso: `${date}T08:00:00.000Z`,
  signOutAtIso: `${date}T17:00:00.000Z`,
  workedMinutes: 540,
});

const baseHistoryState = {
  historyItems: [],
  historyNextCursor: null,
  historyHasMore: false,
  historyFetchStatus: 'idle' as const,
  historyFetchError: null,
};

test('fetchAttendanceHistory.pending clears error and sets pending', () => {
  const state = { ...baseHistoryState, historyFetchError: { code: 'err', message: 'x' }, historyFetchStatus: 'error' as const };
  const action = fetchAttendanceHistory.pending('', { append: false });
  const next = reducer(state as unknown as AttendanceState, action);
  expect(next.historyFetchStatus).toBe('pending');
  expect(next.historyFetchError).toBeNull();
});

test('fetchAttendanceHistory.fulfilled with append:false replaces items', () => {
  const existing = [makeRecord('2026-04-10')];
  const incoming = [makeRecord('2026-04-15'), makeRecord('2026-04-14')];
  const state = { ...baseHistoryState, historyItems: existing };
  const action = fetchAttendanceHistory.fulfilled(
    { items: incoming, nextCursor: '2026-04-14', append: false },
    '',
    { append: false },
  );
  const next = reducer(state as unknown as AttendanceState, action);
  expect(next.historyItems).toEqual(incoming);
  expect(next.historyNextCursor).toBe('2026-04-14');
  expect(next.historyHasMore).toBe(true);
  expect(next.historyFetchStatus).toBe('loaded');
});

test('fetchAttendanceHistory.fulfilled with append:true appends items', () => {
  const existing = [makeRecord('2026-04-15')];
  const incoming = [makeRecord('2026-04-10'), makeRecord('2026-04-09')];
  const state = { ...baseHistoryState, historyItems: existing };
  const action = fetchAttendanceHistory.fulfilled(
    { items: incoming, nextCursor: null, append: true },
    '',
    { append: true },
  );
  const next = reducer(state as unknown as AttendanceState, action);
  expect(next.historyItems).toEqual([...existing, ...incoming]);
  expect(next.historyHasMore).toBe(false);
  expect(next.historyNextCursor).toBeNull();
});

test('fetchAttendanceHistory.rejected sets error status', () => {
  const state = { ...baseHistoryState };
  const action = fetchAttendanceHistory.rejected(
    null,
    '',
    { append: false },
    { code: 'attendance/network', message: 'Network error' },
  );
  const next = reducer(state as unknown as AttendanceState, action);
  expect(next.historyFetchStatus).toBe('error');
  expect(next.historyFetchError).toEqual({ code: 'attendance/network', message: 'Network error' });
});

test('fetchAttendanceHistory.rejected with append:true preserves existing items', () => {
  const existing = [makeRecord('2026-04-15')];
  const state = { ...baseHistoryState, historyItems: existing };
  const action = fetchAttendanceHistory.rejected(
    null,
    '',
    { append: true },
    { code: 'attendance/network', message: 'Network error' },
  );
  const next = reducer(state as unknown as AttendanceState, action);
  expect(next.historyItems).toEqual(existing);
  expect(next.historyFetchStatus).toBe('error');
});

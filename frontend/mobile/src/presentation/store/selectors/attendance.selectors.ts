import type { RootState } from '../index';

export const selectAttendanceCurrent = (s: RootState) => s.attendance.current;
export const selectAttendanceStatus = (s: RootState) =>
  s.attendance.current?.status ?? 'not_signed_in';
export const selectAttendanceFetchStatus = (s: RootState) =>
  s.attendance.fetchStatus;
export const selectAttendanceFetchError = (s: RootState) =>
  s.attendance.fetchError;
export const selectAttendanceSignInStatus = (s: RootState) =>
  s.attendance.signInStatus;
export const selectAttendanceSignInError = (s: RootState) =>
  s.attendance.signInError;
export const selectAttendanceSignOutStatus = (s: RootState) =>
  s.attendance.signOutStatus;
export const selectAttendanceSignOutError = (s: RootState) =>
  s.attendance.signOutError;

export const selectIsAttendanceBusy = (s: RootState) =>
  s.attendance.fetchStatus === 'pending' ||
  s.attendance.signInStatus === 'pending' ||
  s.attendance.signOutStatus === 'pending';

export const selectAttendanceHistoryItems = (s: RootState) =>
  s.attendance.historyItems;
export const selectAttendanceHistoryHasMore = (s: RootState) =>
  s.attendance.historyHasMore;
export const selectAttendanceHistoryNextCursor = (s: RootState) =>
  s.attendance.historyNextCursor;
export const selectAttendanceHistoryFetchStatus = (s: RootState) =>
  s.attendance.historyFetchStatus;
export const selectAttendanceHistoryFetchError = (s: RootState) =>
  s.attendance.historyFetchError;

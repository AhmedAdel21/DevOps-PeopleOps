export type AttendanceRecordStatus =
  | 'signed_out'
  | 'in_office'
  | 'wfh'
  | 'not_checked_in'
  | 'vacation'
  | 'absent';

export type AttendanceRecordPlace = 'in_office' | 'wfh';

export interface AttendanceRecord {
  date: string;                          // yyyy-MM-dd
  status: AttendanceRecordStatus;
  place: AttendanceRecordPlace | null;
  signInAt: Date | null;
  signOutAt: Date | null;
  workedMinutes: number | null;
}

export interface AttendanceHistoryPage {
  items: AttendanceRecord[];
  nextCursor: string | null;             // null = no more pages
}

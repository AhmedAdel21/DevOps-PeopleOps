export type AttendanceRecordStatus =
  | 'signed_out'
  | 'in_office'
  | 'wfh'
  | 'not_checked_in'
  | 'vacation'
  | 'absent';

export type AttendanceRecordPlace = 'in_office' | 'wfh';

export interface AttendanceRecord {
  readonly date: string;                          // yyyy-MM-dd
  readonly status: AttendanceRecordStatus;
  readonly place: AttendanceRecordPlace | null;
  readonly signInAt: Date | null;
  readonly signOutAt: Date | null;
  readonly workedMinutes: number | null;
}

export interface AttendanceHistoryPage {
  readonly items: AttendanceRecord[];
  readonly nextCursor: string | null;             // null = no more pages
}

export interface AttendanceRecordDto {
  date: string;
  status: string;           // 'InOffice' | 'Wfh' | 'SignedOut' | 'NotCheckedIn' | 'Vacation' | 'Absent'
  place: string | null;     // 'InOffice' | 'Wfh' | null
  signInTime: string | null;
  signOutTime: string | null;
  workedMinutes: number | null;
}

export interface AttendanceHistoryResponseDto {
  items: AttendanceRecordDto[];
  nextCursor: string | null;
}

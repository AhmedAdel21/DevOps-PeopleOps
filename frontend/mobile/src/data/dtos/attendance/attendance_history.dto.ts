export interface AttendanceRecordDto {
  date: string;
  status: string;           // 'InOffice' | 'Wfh' | 'SignedOut' | 'NotCheckedIn' | 'Vacation' | 'Absent' — note: history endpoint uses 'Wfh' (title-case), sign-in uses 'WFH' (all-caps)
  place: string | null;     // 'InOffice' | 'Wfh' | null — title-case, unlike the sign-in endpoint's 'WFH'
  signInTime: string | null;
  signOutTime: string | null;
  workedMinutes: number | null;
}

export interface AttendanceHistoryResponseDto {
  items: AttendanceRecordDto[];
  nextCursor: string | null;
}

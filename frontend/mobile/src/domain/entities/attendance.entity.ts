export type AttendancePlace = 'in_office' | 'wfh';

export type AttendanceStatus =
  | 'not_signed_in'
  | 'in_office'
  | 'wfh';

export interface Attendance {
  readonly employeeId: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly status: AttendanceStatus;
  readonly signInAt: Date | null;
  readonly signOutAt: Date | null;
  readonly departmentId: string | null;
  readonly departmentName: string | null;
  readonly isAdminOverride: boolean;
  readonly overrideMarkedBy: string | null;
  readonly overrideNote: string | null;
  readonly lastUpdatedAt: Date;
}

// Wire shapes for the Team Attendance read endpoints. Matches the JSON in
// docs/team-api-contract.md §3.1 / §3.2. `status` arrives as a string and is
// validated → TeamAttendanceStatus in the mapper. `statusLabel` is optional:
// the BE may send it pre-formatted (contract), otherwise the mapper derives
// it (entity comment: "Pre-formatted by the mapper").

export interface TeamAttendanceRowDto {
  userId: string;
  slackUserId: string | null;
  displayName: string;
  avatarInitials: string;
  avatarColorHex: string | null;
  departmentId: string | null;
  departmentName: string | null;
  status: string;
  isLate: boolean;
  signedInAt: string | null; // ISO 8601, viewer TZ
  signedOutAt: string | null; // ISO 8601, viewer TZ
  statusLabel?: string | null;
}

export interface TeamAttendanceSummaryDto {
  inOffice: number;
  remote: number;
  absent: number;
  late: number;
  notSignedIn: number;
  onLeave: number;
}

export interface TeamAttendanceDayDto {
  date: string; // yyyy-MM-dd
  summary: TeamAttendanceSummaryDto;
  rows: TeamAttendanceRowDto[];
}

export interface TeamAttendanceHistoryPageDto {
  items: TeamAttendanceDayDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

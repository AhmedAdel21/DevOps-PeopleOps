export interface EmployeeStatusDto {
  slackUserId: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  lastUpdated: string;
  signInUtc: string | null;
  signOutUtc: string | null;
  place: string | null;
  departmentId: string | null;
  departmentName: string | null;
  isAdminOverride: boolean;
  overrideMarkedBy: string | null;
  overrideNote: string | null;
}

export interface SignInRequestDto {
  place: 'InOffice' | 'WFH';
}

export interface ErrorBodyDto {
  code?: string;
  message?: string;
}

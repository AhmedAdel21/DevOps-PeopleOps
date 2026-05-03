/**
 * Wire shape returned by GET /api/auth/me. Mirrors the backend contract
 * verbatim so the mapper handles the DTO → domain transformation.
 */

export interface MeEmployeeDto {
  id: string;
  slackUserId: string;
  empCode: string | null;
  displayName: string;
  avatarUrl: string | null;
  departmentId: string | null;
}

export interface MeDto {
  subjectId: string;
  provider: string;
  email: string;
  displayName: string;
  role: string;
  permissions: string[];
  mustChangePassword: boolean;
  employee: MeEmployeeDto | null;
}

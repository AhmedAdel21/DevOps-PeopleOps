/**
 * Wire shape returned by GET /api/v1/auth/me. Mirrors the backend's
 * Devopsolution.Dal.Models.Responses.Attendance.MeResponseDto +
 * EmployeeProfileDto. The BE schema doesn't store DepartmentId on the
 * user — only TeamId — so the mobile resolves the department through
 * the Team if it needs to.
 */

export interface MeEmployeeDto {
  id: number;              // BE returns long; JS reads as number
  slackUserId: string | null;
  empCode: string | null;
  displayName: string;
  avatarUrl: string | null;
  teamId: number | null;
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

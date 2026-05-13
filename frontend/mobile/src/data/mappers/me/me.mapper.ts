import type { Me, MeEmployee, Provider, Role } from '@/domain/entities';
import type { MeDto, MeEmployeeDto } from '@/data/dtos/me';

const KNOWN_ROLES: readonly Role[] = [
  'Employee',
  'HREmployee',
  'Manager',
  'HRManager',
  'SystemAdmin',
  'CEO',
];

const KNOWN_PROVIDERS: readonly Provider[] = ['firebase', 'zoho', 'slack'];

// Tolerant narrowing: if the BE later ships a role/provider value the FE
// hasn't been updated for, fall through to the safest defaults rather than
// crashing the auth flow. The 403 path on /me already catches truly invalid
// roles upstream.
const narrowRole = (raw: string): Role =>
  (KNOWN_ROLES as readonly string[]).includes(raw) ? (raw as Role) : 'Employee';

const narrowProvider = (raw: string): Provider =>
  (KNOWN_PROVIDERS as readonly string[]).includes(raw)
    ? (raw as Provider)
    : 'firebase';

const employeeDtoToDomain = (dto: MeEmployeeDto): MeEmployee => ({
  // BE returns id as a JS number (long on the wire); stringify so the
  // domain layer keeps treating ids as opaque strings.
  id: String(dto.id),
  slackUserId: dto.slackUserId ?? '',
  empCode: dto.empCode,
  displayName: dto.displayName,
  avatarUrl: dto.avatarUrl,
  // BE doesn't expose DepartmentId on the user record — only TeamId.
  // The team's department is resolvable via /management/departments
  // when the FE needs it. Stringify the teamId so the FE can keep
  // routing on its own team/dept references.
  departmentId: dto.teamId != null ? String(dto.teamId) : null,
});

export const meDtoToDomain = (dto: MeDto): Me => ({
  subjectId: dto.subjectId,
  provider: narrowProvider(dto.provider),
  email: dto.email,
  // BE may return an empty string when the upstream profile has no display
  // name; prefer the linked employee's name when available.
  displayName: dto.displayName || dto.employee?.displayName || '',
  role: narrowRole(dto.role),
  // Spread to a new array — readonly is a TS guarantee, and Immer in the
  // slice will own a draftable copy regardless. Frozen arrays would trip
  // Immer drafts in extraReducers.
  permissions: [...dto.permissions],
  mustChangePassword: dto.mustChangePassword,
  employee: dto.employee ? employeeDtoToDomain(dto.employee) : null,
});

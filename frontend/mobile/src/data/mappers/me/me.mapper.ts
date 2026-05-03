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
  id: dto.id,
  slackUserId: dto.slackUserId,
  empCode: dto.empCode,
  displayName: dto.displayName,
  avatarUrl: dto.avatarUrl,
  departmentId: dto.departmentId,
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

import { meDtoToDomain } from '../src/data/mappers/me/me.mapper';
import type { MeDto } from '../src/data/dtos/me/me.dto';

const baseDto = (overrides: Partial<MeDto> = {}): MeDto => ({
  subjectId: 'firebase-uid-123',
  provider: 'firebase',
  email: 'user@example.com',
  displayName: 'Display',
  role: 'Employee',
  permissions: ['leave:submit', 'leave:cancel'],
  mustChangePassword: false,
  employee: null,
  ...overrides,
});

test('maps a fully populated DTO with linked employee', () => {
  const dto = baseDto({
    role: 'Manager',
    permissions: ['leave:approve', 'leave:reject'],
    employee: {
      id: 'emp-1',
      slackUserId: 'U123',
      empCode: 'E007',
      displayName: 'Employee Name',
      avatarUrl: 'https://cdn/avatar.png',
      departmentId: 'dept-9',
    },
  });
  const me = meDtoToDomain(dto);
  expect(me.role).toBe('Manager');
  expect(me.permissions).toEqual(['leave:approve', 'leave:reject']);
  expect(me.employee?.id).toBe('emp-1');
  expect(me.employee?.avatarUrl).toBe('https://cdn/avatar.png');
});

test('returns null employee when DTO employee is null', () => {
  const me = meDtoToDomain(baseDto({ employee: null }));
  expect(me.employee).toBeNull();
});

test('falls back to employee.displayName when top-level is empty', () => {
  const me = meDtoToDomain(
    baseDto({
      displayName: '',
      employee: {
        id: 'e1',
        slackUserId: '',
        empCode: null,
        displayName: 'Linked Name',
        avatarUrl: null,
        departmentId: null,
      },
    }),
  );
  expect(me.displayName).toBe('Linked Name');
});

test('returns empty displayName when both top-level and employee are empty', () => {
  const me = meDtoToDomain(baseDto({ displayName: '', employee: null }));
  expect(me.displayName).toBe('');
});

test('narrows unknown role to Employee (forward-compat with BE)', () => {
  const me = meDtoToDomain(baseDto({ role: 'Sorcerer' }));
  expect(me.role).toBe('Employee');
});

test('narrows unknown provider to firebase', () => {
  const me = meDtoToDomain(baseDto({ provider: 'okta' }));
  expect(me.provider).toBe('firebase');
});

test('preserves all known roles', () => {
  for (const role of [
    'Employee',
    'HREmployee',
    'Manager',
    'HRManager',
    'SystemAdmin',
    'CEO',
  ] as const) {
    const me = meDtoToDomain(baseDto({ role }));
    expect(me.role).toBe(role);
  }
});

test('returns mutable permissions array (Immer compat)', () => {
  const me = meDtoToDomain(baseDto());
  // Sanity: array push must not throw — Immer needs writable inputs.
  expect(() => (me.permissions as string[]).push('x')).not.toThrow();
});

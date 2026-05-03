/**
 * Backend-shaped identity returned by GET /api/auth/me. This is the single
 * source of truth for the currently signed-in user — replaces the per-login
 * profile fields that used to come differently from Firebase vs Zoho. Auth
 * (am I logged in?) still belongs to Firebase + the auth slice; profile
 * (who am I, what can I do?) lives here.
 */

export type Role =
  | 'Employee'
  | 'HREmployee'
  | 'Manager'
  | 'HRManager'
  | 'SystemAdmin'
  | 'CEO';

export type Provider = 'firebase' | 'zoho' | 'slack';

export interface MeEmployee {
  readonly id: string;
  readonly slackUserId: string;
  readonly empCode: string | null;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly departmentId: string | null;
}

export interface Me {
  readonly subjectId: string;
  readonly provider: Provider;
  readonly email: string;
  readonly displayName: string;
  readonly role: Role;
  readonly permissions: string[];
  readonly mustChangePassword: boolean;
  readonly employee: MeEmployee | null;
}

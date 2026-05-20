import { DomainError } from './domain_error';

export type AuthErrorCode =
  | 'invalid-credentials'
  | 'user-disabled'
  | 'too-many-requests'
  | 'network'
  | 'unknown'
  | 'zoho-cancelled'
  | 'zoho-employee-not-linked'
  // Password-change flow (firstLogin / forced-change)
  | 'weak-password'
  | 'requires-recent-login'
  | 'no-current-user'
  | 'change-password-failed';

export class AuthError extends DomainError {
  constructor(
    public readonly authCode: AuthErrorCode,
    message: string,
  ) {
    super(`auth/${authCode}`, message);
    this.name = 'AuthError';
  }
}

import { DomainError } from './domain_error';

export type AuthErrorCode =
  | 'invalid-credentials'
  | 'user-disabled'
  | 'too-many-requests'
  | 'network'
  | 'unknown';

export class AuthError extends DomainError {
  constructor(
    public readonly authCode: AuthErrorCode,
    message: string,
  ) {
    super(`auth/${authCode}`, message);
    this.name = 'AuthError';
  }
}

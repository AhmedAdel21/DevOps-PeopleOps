import { DomainError } from './domain_error';

export type LeaveErrorCode =
  | 'unauthenticated'
  | 'insufficient-balance'
  | 'invalid-dates'
  | 'overlap'
  | 'network'
  | 'unknown';

export class LeaveError extends DomainError {
  constructor(
    public readonly leaveCode: LeaveErrorCode,
    message: string,
  ) {
    super(`leave/${leaveCode}`, message);
    this.name = 'LeaveError';
  }
}

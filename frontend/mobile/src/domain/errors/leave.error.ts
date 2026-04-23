import { DomainError } from './domain_error';

export type LeaveErrorCode =
  // Infra / auth
  | 'unauthenticated'
  | 'network'
  | 'unknown'
  // Generic resource
  | 'not-found'
  | 'not-cancellable'
  // Submit business rules (map 1:1 to BE errorCodes)
  | 'invalid-leave-type'
  | 'leave-type-inactive'
  | 'once-per-career'
  | 'same-day-not-allowed'
  | 'past-date-not-allowed'
  | 'past-date-exceeded'
  | 'insufficient-balance'
  | 'date-overlap'
  | 'consecutive-limit';

/**
 * Detail fields carried alongside error codes so screens can render a
 * descriptive message without re-parsing the raw BE body.
 */
export interface LeaveErrorDetails {
  remainingBalance?: number | null;
  conflictingDates?: string | null;
}

export class LeaveError extends DomainError {
  readonly remainingBalance?: number | null;
  readonly conflictingDates?: string | null;

  constructor(
    public readonly leaveCode: LeaveErrorCode,
    message: string,
    details?: LeaveErrorDetails,
  ) {
    super(`leave/${leaveCode}`, message);
    this.name = 'LeaveError';
    this.remainingBalance = details?.remainingBalance;
    this.conflictingDates = details?.conflictingDates;
  }
}

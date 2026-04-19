import { DomainError } from './domain_error';

export type AttendanceErrorCode =
  | 'unauthenticated'
  | 'employee-not-linked'
  | 'invalid-state'
  | 'slack-oauth-required'
  | 'network'
  | 'unknown';

export class AttendanceError extends DomainError {
  constructor(
    public readonly attendanceCode: AttendanceErrorCode,
    message: string,
  ) {
    super(`attendance/${attendanceCode}`, message);
    this.name = 'AttendanceError';
  }
}

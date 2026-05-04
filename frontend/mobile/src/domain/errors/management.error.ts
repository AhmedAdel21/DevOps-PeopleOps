import { DomainError } from './domain_error';

/**
 * Generic error code set covering manager/admin actions across the
 * Team Attendance, Approvals (admin side), Employee Management, Department
 * Management, and Leave Configuration features.
 *
 * The codes are coarse-grained on purpose — the screens render
 * `serverCode` verbatim when the BE supplies a per-error string like
 * 'manager-out-of-scope' or 'employee-not-found'. The mgmtCode is what
 * the slice/screen branches on for retry / button-enable behavior.
 */
export type ManagementErrorCode =
  | 'unauthenticated'
  | 'forbidden'   // 403 — out-of-scope for the caller (e.g. Manager touching
                  //       another department's leave). Toast + re-enable.
  | 'not-found'
  | 'conflict'    // 409
  | 'validation'  // 4xx with a structured message
  | 'network'
  | 'unknown';

export class ManagementError extends DomainError {
  constructor(
    public readonly mgmtCode: ManagementErrorCode,
    message: string,
    /** Verbatim BE error code (e.g. 'manager-out-of-scope') when present. */
    public readonly serverCode: string | null = null,
  ) {
    super(`management/${mgmtCode}`, message);
    this.name = 'ManagementError';
  }
}

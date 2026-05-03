import { DomainError } from './domain_error';

export type MeErrorCode =
  /** 401: token missing/expired/malformed → clear session, route to login. */
  | 'unauthorized'
  /** 403: token valid but user inactive or unknown role → hard error, no retry. */
  | 'forbidden'
  /** 5xx or network error after exhausted retries → keep cache, fall back to login on cold start. */
  | 'transient'
  /** Anything else (4xx that isn't 401/403, parse failure, etc.). */
  | 'unknown';

export class MeError extends DomainError {
  constructor(
    public readonly meCode: MeErrorCode,
    message: string,
  ) {
    super(`me/${meCode}`, message);
    this.name = 'MeError';
  }
}

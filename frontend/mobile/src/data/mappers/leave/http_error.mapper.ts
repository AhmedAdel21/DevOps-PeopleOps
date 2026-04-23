import { LeaveError, type LeaveErrorCode } from '@/domain/errors';
import { HttpError } from '@/data/data_sources/http';
import type { SubmitLeaveRequestErrorDto } from '@/data/dtos/leave';
import { leaveLog } from '@/core/logger';

/** BE submit error codes → domain codes. */
const SUBMIT_ERROR_CODE_MAP: Record<string, LeaveErrorCode> = {
  INVALID_LEAVE_TYPE:     'invalid-leave-type',
  LEAVE_TYPE_INACTIVE:    'leave-type-inactive',
  ONCE_PER_CAREER:        'once-per-career',
  SAME_DAY_NOT_ALLOWED:   'same-day-not-allowed',
  PAST_DATE_NOT_ALLOWED:  'past-date-not-allowed',
  PAST_DATE_EXCEEDED:     'past-date-exceeded',
  INSUFFICIENT_BALANCE:   'insufficient-balance',
  DATE_OVERLAP:           'date-overlap',
  CONSECUTIVE_LIMIT:      'consecutive-limit',
};

const asSubmitErrorBody = (body: unknown): SubmitLeaveRequestErrorDto | null => {
  if (body && typeof body === 'object') return body as SubmitLeaveRequestErrorDto;
  return null;
};

const asGenericMessage = (body: unknown): string | undefined => {
  if (body && typeof body === 'object') {
    const maybe = body as { message?: string };
    if (typeof maybe.message === 'string') return maybe.message;
  }
  return undefined;
};

export const mapHttpErrorToLeave = (e: unknown): LeaveError => {
  if (!(e instanceof HttpError)) {
    const message = (e as { message?: string } | null)?.message ?? 'Leave request failed';
    leaveLog.error('mapper', 'Non-HttpError mapped to unknown', e);
    return new LeaveError('unknown', message);
  }

  const { status, body } = e;

  // Network / auth / not-found
  if (status === 0)   return new LeaveError('network', e.message);
  if (status === 401) return new LeaveError('unauthenticated', asGenericMessage(body) ?? e.message);
  if (status === 404) return new LeaveError('not-found', asGenericMessage(body) ?? e.message);
  if (status === 403) return new LeaveError('unauthenticated', asGenericMessage(body) ?? e.message);

  // 422 — submit business rule
  if (status === 422) {
    const submit = asSubmitErrorBody(body);
    const rawCode = submit?.errorCode?.toUpperCase() ?? '';
    const mapped = SUBMIT_ERROR_CODE_MAP[rawCode];
    const message = submit?.errorMessage ?? asGenericMessage(body) ?? e.message;
    if (mapped) {
      leaveLog.warn(
        'mapper',
        `422 submit error: code=${rawCode} → domain="${mapped}" (remainingBalance=${submit?.remainingBalance ?? '—'})`,
      );
      return new LeaveError(mapped, message, {
        remainingBalance: submit?.remainingBalance ?? null,
        conflictingDates: submit?.conflictingDates ?? null,
      });
    }
    leaveLog.warn('mapper', `422 with unknown errorCode "${rawCode}" → 'unknown'`);
    return new LeaveError('unknown', message);
  }

  leaveLog.warn('mapper', `HttpError ${status} → 'unknown'`);
  return new LeaveError('unknown', asGenericMessage(body) ?? e.message);
};

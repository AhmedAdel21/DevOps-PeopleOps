import { LeaveError, type LeaveErrorCode } from '@/domain/errors';
import { HttpError } from '@/data/data_sources/http';
import type { LeaveErrorBodyDto } from '@/data/dtos/leave';
import { leaveLog } from '@/core/logger';

const extractBodyCode = (body: unknown): string | undefined => {
  if (body && typeof body === 'object') {
    const maybe = body as LeaveErrorBodyDto;
    if (typeof maybe.code === 'string') return maybe.code;
  }
  return undefined;
};

const extractBodyMessage = (body: unknown): string | undefined => {
  if (body && typeof body === 'object') {
    const maybe = body as LeaveErrorBodyDto;
    if (typeof maybe.message === 'string') return maybe.message;
  }
  return undefined;
};

export const mapHttpErrorToLeave = (e: unknown): LeaveError => {
  if (e instanceof HttpError) {
    const bodyCode = extractBodyCode(e.body);
    const bodyMessage = extractBodyMessage(e.body);
    let leaveCode: LeaveErrorCode = 'unknown';

    if (e.status === 0) {
      leaveCode = 'network';
    } else if (e.status === 401) {
      leaveCode = 'unauthenticated';
    } else if (e.status === 422 && bodyCode === 'insufficient_balance') {
      leaveCode = 'insufficient-balance';
    } else if (e.status === 422 && bodyCode === 'invalid_dates') {
      leaveCode = 'invalid-dates';
    } else if (e.status === 409 && bodyCode === 'overlap') {
      leaveCode = 'overlap';
    }

    leaveLog.warn(
      'mapper',
      `HttpError mapped: status=${e.status} bodyCode="${bodyCode ?? '<none>'}" → domain="${leaveCode}"`,
    );
    return new LeaveError(leaveCode, bodyMessage ?? e.message);
  }

  const message = (e as { message?: string } | null)?.message ?? 'Leave request failed';
  leaveLog.error('mapper', 'Non-HttpError mapped to unknown', e);
  return new LeaveError('unknown', message);
};

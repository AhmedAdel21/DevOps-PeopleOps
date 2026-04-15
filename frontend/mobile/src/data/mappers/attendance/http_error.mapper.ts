import {
  AttendanceError,
  type AttendanceErrorCode,
} from '@/domain/errors';
import { HttpError } from '@/data/data_sources/http';
import type { ErrorBodyDto } from '@/data/dtos/attendance';
import { attendanceLog } from '@/core/logger';

const extractBodyCode = (body: unknown): string | undefined => {
  if (body && typeof body === 'object') {
    const maybe = body as ErrorBodyDto;
    if (typeof maybe.code === 'string') return maybe.code;
  }
  return undefined;
};

const extractBodyMessage = (body: unknown): string | undefined => {
  if (body && typeof body === 'object') {
    const maybe = body as ErrorBodyDto;
    if (typeof maybe.message === 'string') return maybe.message;
  }
  return undefined;
};

export const mapHttpErrorToAttendance = (e: unknown): AttendanceError => {
  if (e instanceof HttpError) {
    const bodyCode = extractBodyCode(e.body);
    const bodyMessage = extractBodyMessage(e.body);
    let authCode: AttendanceErrorCode = 'unknown';

    if (e.status === 0) {
      authCode = 'network';
    } else if (e.status === 401) {
      authCode = 'unauthenticated';
    } else if (e.status === 404 && bodyCode === 'employee_not_linked') {
      authCode = 'employee-not-linked';
    } else if (e.status === 409 || e.status === 400) {
      authCode = 'invalid-state';
    }

    attendanceLog.warn(
      'mapper',
      `HttpError mapped: status=${e.status} bodyCode="${bodyCode ?? '<none>'}" → domain="${authCode}"`,
    );
    return new AttendanceError(
      authCode,
      bodyMessage ?? e.message,
    );
  }

  // Non-HTTP error bubbling up (programming mistake / unexpected throw)
  const message =
    (e as { message?: string } | null)?.message ?? 'Attendance request failed';
  attendanceLog.error(
    'mapper',
    'Non-HttpError mapped to unknown',
    e,
  );
  return new AttendanceError('unknown', message);
};

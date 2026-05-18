import { ManagementError, type ManagementErrorCode } from '@/domain/errors';
import { HttpError } from '@/data/data_sources/http';
import { managementLog } from '@/core/logger';

const asBody = (
  body: unknown,
): { message?: string; code?: string } | null =>
  body && typeof body === 'object' ? (body as Record<string, string>) : null;

/**
 * HttpError → ManagementError. Mirrors mapHttpErrorToLeave but to the
 * coarse ManagementErrorCode set; the BE's verbatim `code` (e.g.
 * 'manager-out-of-scope') is preserved as `serverCode`.
 */
export const mapHttpErrorToManagement = (e: unknown): ManagementError => {
  if (!(e instanceof HttpError)) {
    const message =
      (e as { message?: string } | null)?.message ?? 'Management request failed';
    managementLog.error('mapper', 'Non-HttpError → unknown', e);
    return new ManagementError('unknown', message);
  }

  const { status, body } = e;
  const parsed = asBody(body);
  const serverCode = parsed?.code ?? null;
  const message = parsed?.message ?? e.message;

  let code: ManagementErrorCode;
  if (status === 0) code = 'network';
  else if (status === 401) code = 'unauthenticated';
  else if (status === 403) code = 'forbidden';
  else if (status === 404) code = 'not-found';
  else if (status === 409) code = 'conflict';
  else if (status === 400 || status === 422) code = 'validation';
  else code = 'unknown';

  managementLog.warn(
    'mapper',
    `HttpError ${status} → '${code}'${serverCode ? ` (server='${serverCode}')` : ''}`,
  );
  return new ManagementError(code, message, serverCode);
};

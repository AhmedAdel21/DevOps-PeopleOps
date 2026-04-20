import { SlackError, type SlackErrorCode } from '@/domain/errors';
import { HttpError } from '@/data/data_sources/http';
import { slackLog } from '@/core/logger';

export const mapHttpErrorToSlack = (e: unknown): SlackError => {
  if (e instanceof HttpError) {
    let slackCode: SlackErrorCode = 'unknown';

    if (e.status === 0) {
      slackCode = 'network';
    } else if (e.status === 401 || e.status === 403) {
      slackCode = 'unauthorized';
    }

    slackLog.warn(
      'repository',
      `HttpError mapped: status=${e.status} → domain="${slackCode}"`,
    );
    return new SlackError(slackCode, e.message);
  }

  const message =
    (e as { message?: string } | null)?.message ?? 'Slack request failed';
  slackLog.error('repository', 'Non-HttpError mapped to unknown', e);
  return new SlackError('unknown', message);
};

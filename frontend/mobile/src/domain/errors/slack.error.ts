import { DomainError } from './domain_error';

export type SlackErrorCode = 'network' | 'unauthorized' | 'unknown';

export class SlackError extends DomainError {
  constructor(
    public readonly slackCode: SlackErrorCode,
    message: string,
  ) {
    super(`slack/${slackCode}`, message);
    this.name = 'SlackError';
  }
}

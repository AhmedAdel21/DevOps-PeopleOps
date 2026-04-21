import { AppConfig } from '@/di/config';

type SlackLogScope = 'data_source' | 'repository' | 'use_case' | 'screen';

const PREFIX = '[slack]';

const isEnabled = (): boolean => AppConfig.SLACK_LOGS_ENABLED;

export const slackLog = {
  info(scope: SlackLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.log(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.log(`${PREFIX} ${scope}: ${message}`);
    }
  },

  warn(scope: SlackLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.warn(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.warn(`${PREFIX} ${scope}: ${message}`);
    }
  },

  error(scope: SlackLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.error(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.error(`${PREFIX} ${scope}: ${message}`);
    }
  },
};

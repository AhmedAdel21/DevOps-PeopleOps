import { AppConfig } from '@/di/config';

type LeaveLogScope =
  | 'http'
  | 'data_source'
  | 'repository'
  | 'mapper'
  | 'use_case'
  | 'slice'
  | 'screen';

const PREFIX = '[leave]';

const isEnabled = (): boolean => AppConfig.LEAVE_LOGS_ENABLED;

export const leaveLog = {
  info(scope: LeaveLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.log(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.log(`${PREFIX} ${scope}: ${message}`);
    }
  },

  warn(scope: LeaveLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.warn(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.warn(`${PREFIX} ${scope}: ${message}`);
    }
  },

  error(scope: LeaveLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.error(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.error(`${PREFIX} ${scope}: ${message}`);
    }
  },
};

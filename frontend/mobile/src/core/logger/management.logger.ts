import { AppConfig } from '@/di/config';

type ManagementLogScope =
  | 'http'
  | 'data_source'
  | 'repository'
  | 'mapper'
  | 'use_case'
  | 'slice'
  | 'screen';

const PREFIX = '[management]';

const isEnabled = (): boolean => AppConfig.MANAGEMENT_LOGS_ENABLED;

export const managementLog = {
  info(scope: ManagementLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.log(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.log(`${PREFIX} ${scope}: ${message}`);
    }
  },

  warn(scope: ManagementLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.warn(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.warn(`${PREFIX} ${scope}: ${message}`);
    }
  },

  error(scope: ManagementLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.error(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.error(`${PREFIX} ${scope}: ${message}`);
    }
  },
};

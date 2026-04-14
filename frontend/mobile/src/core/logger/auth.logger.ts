import { AppConfig } from '@/di/config';

type AuthLogScope =
  | 'data_source'
  | 'repository'
  | 'mapper'
  | 'use_case'
  | 'slice'
  | 'bootstrap'
  | 'observer'
  | 'navigation';

const PREFIX = '[auth]';

const isEnabled = (): boolean => AppConfig.AUTH_LOGS_ENABLED;

const maskEmail = (email: string | null | undefined): string => {
  if (!email) return '<none>';
  const [name, domain] = email.split('@');
  if (!domain) return '<masked>';
  const head = name.slice(0, 2);
  return `${head}***@${domain}`;
};

export const authLog = {
  info(scope: AuthLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.log(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.log(`${PREFIX} ${scope}: ${message}`);
    }
  },

  warn(scope: AuthLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.warn(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.warn(`${PREFIX} ${scope}: ${message}`);
    }
  },

  error(scope: AuthLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.error(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.error(`${PREFIX} ${scope}: ${message}`);
    }
  },

  maskEmail,
};

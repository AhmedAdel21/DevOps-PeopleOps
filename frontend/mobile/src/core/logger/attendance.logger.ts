import { AppConfig } from '@/di/config';

type AttendanceLogScope =
  | 'http'
  | 'data_source'
  | 'repository'
  | 'mapper'
  | 'use_case'
  | 'slice'
  | 'screen';

const PREFIX = '[attendance]';

const isEnabled = (): boolean => AppConfig.ATTENDANCE_LOGS_ENABLED;

export const attendanceLog = {
  info(scope: AttendanceLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.log(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.log(`${PREFIX} ${scope}: ${message}`);
    }
  },

  warn(scope: AttendanceLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.warn(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.warn(`${PREFIX} ${scope}: ${message}`);
    }
  },

  error(scope: AttendanceLogScope, message: string, extra?: unknown): void {
    if (!isEnabled()) return;
    if (extra !== undefined) {
      console.error(`${PREFIX} ${scope}: ${message}`, extra);
    } else {
      console.error(`${PREFIX} ${scope}: ${message}`);
    }
  },
};

import type { PermissionType } from '@/domain/entities';

// Time window boundaries per permission type (24h HH:mm strings).
// Late:      employee arrives late  — window 08:00–10:00
// Early:     employee leaves early  — window 14:00–17:00
// MiddleDay: employee steps out mid-day — window 10:00–14:00
// HalfDay:   4-hour block (morning or afternoon) — not validated as permission
const TIME_WINDOWS: Record<PermissionType, { start: string; end: string } | null> = {
  Late:      { start: '08:00', end: '10:00' },
  Early:     { start: '14:00', end: '17:00' },
  MiddleDay: { start: '10:00', end: '14:00' },
  HalfDay:   null, // no window restriction; handled as vacation deduction
};

const MAX_PERMISSION_MINUTES = 120; // 2 hours

// Converts 'HH:mm' to total minutes since midnight.
const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const getDurationMinutes = (startTime: string, endTime: string): number => {
  return toMinutes(endTime) - toMinutes(startTime);
};

export const exceedsMaxDuration = (durationMinutes: number): boolean => {
  return durationMinutes > MAX_PERMISSION_MINUTES;
};

export const isTimeInWindow = (
  permissionType: PermissionType,
  startTime: string,
  endTime: string,
): boolean => {
  const window = TIME_WINDOWS[permissionType];
  if (window === null) return true; // HalfDay has no restriction
  const windowStart = toMinutes(window.start);
  const windowEnd = toMinutes(window.end);
  return toMinutes(startTime) >= windowStart && toMinutes(endTime) <= windowEnd;
};

export const isHalfDay = (permissionType: PermissionType): boolean =>
  permissionType === 'HalfDay';

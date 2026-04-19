import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppText } from '@/presentation/components/atoms/app_text';
import type { SerializableAttendanceRecord } from '@/presentation/store/slices/attendance.slice';
import type { AttendanceRecordStatus } from '@/domain/entities';

export interface AppAttendanceRecordCardProps {
  record: SerializableAttendanceRecord;
}

const STATUS_I18N_KEY: Record<AttendanceRecordStatus, string> = {
  in_office:      'attendance.history.status.inOffice',
  wfh:            'attendance.history.status.wfh',
  signed_out:     'attendance.history.status.signedOut',
  not_checked_in: 'attendance.history.status.notCheckedIn',
  vacation:       'attendance.history.status.vacation',
  absent:         'attendance.history.status.absent',
};

const formatDate = (date: string, language: string): string => {
  const d = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d);
};

const formatTime = (iso: string, language: string): string =>
  new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

const formatWorked = (
  minutes: number,
  t: ReturnType<typeof useTranslation>['t'],
): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return t('attendance.history.workedMinutesOnly', { m });
  if (m === 0) return t('attendance.history.workedHoursOnly', { h });
  return t('attendance.history.workedHours', { h, m });
};

const resolveStatusColor = (
  theme: AppTheme,
  status: AttendanceRecordStatus,
): { base: string; light: string } => {
  switch (status) {
    case 'in_office':
      return { base: theme.colors.primary, light: theme.colors.primaryLight };
    case 'wfh':
      return { base: theme.colors.status.info.base, light: theme.colors.status.info.light };
    case 'signed_out':
      return { base: theme.colors.status.success.base, light: theme.colors.status.success.light };
    case 'vacation':
      return { base: theme.colors.status.warning.base, light: theme.colors.status.warning.light };
    case 'absent':
      return { base: theme.colors.status.error.base, light: theme.colors.status.error.light };
    case 'not_checked_in':
    default:
      return { base: theme.colors.mutedForeground, light: theme.colors.muted };
  }
};

export const AppAttendanceRecordCard: React.FC<AppAttendanceRecordCardProps> = ({
  record,
}) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const statusColor = resolveStatusColor(theme, record.status);
  const isNoCheckIn = record.status === 'not_checked_in';
  const dateLabel = formatDate(record.date, i18n.language);
  const statusLabel = t(STATUS_I18N_KEY[record.status]);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <AppText variant="caption" color={theme.colors.mutedForeground}>
          {dateLabel}
        </AppText>
        <View style={[styles.badge, { backgroundColor: statusColor.light }]}>
          <AppText variant="caption" color={statusColor.base} weight="medium">
            {statusLabel}
          </AppText>
        </View>
      </View>

      <View style={styles.right}>
        {isNoCheckIn ? (
          <AppText variant="caption" color={theme.colors.mutedForeground}>
            {'—'}
          </AppText>
        ) : (
          <>
            {record.place && (
              <AppText variant="caption" color={theme.colors.mutedForeground}>
                {t(`attendance.history.place.${record.place === 'in_office' ? 'inOffice' : 'wfh'}`)}
              </AppText>
            )}
            {record.signInAtIso && record.signOutAtIso && (
              <AppText variant="caption" color={theme.colors.foreground}>
                {`${formatTime(record.signInAtIso, i18n.language)} → ${formatTime(record.signOutAtIso, i18n.language)}`}
              </AppText>
            )}
            {record.workedMinutes != null && (
              <AppText variant="caption" color={theme.colors.mutedForeground}>
                {formatWorked(record.workedMinutes, t)}
              </AppText>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: hs(10),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: ws(12),
    },
    left: {
      flex: 1,
      gap: hs(4),
    },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: ws(8),
      paddingVertical: hs(2),
      borderRadius: theme.radius.s,
    },
    right: {
      alignItems: 'flex-end',
      gap: hs(2),
    },
  });

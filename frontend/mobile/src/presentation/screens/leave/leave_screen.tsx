import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CalendarX, Plus } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppBadge, AppButton, AppText } from '@/presentation/components/atoms';
import type { LeaveRequestStatus, LeaveType } from '@/domain/entities';
import { useAppDispatch, useAppSelector } from '@/presentation/store/hooks';
import {
  fetchLeaveBalances,
  fetchLeaveRequests,
} from '@/presentation/store/slices';
import {
  selectLeaveBalances,
  selectLeaveRequests,
} from '@/presentation/store/selectors';
import type { SerializableLeaveBalance, SerializableLeaveRequest } from '@/presentation/store/slices';

// ── UI-only type ────────────────────────────────────────────────────────────

type FilterStatus = 'All' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

// ── Date formatting utilities ───────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
};

const formatDateRange = (fromDate: string, toDate: string): string => {
  if (fromDate === toDate) return formatDate(fromDate);
  const [fromYear, fromMonth, fromDay] = fromDate.split('-').map(Number);
  const [toYear, toMonth, toDay] = toDate.split('-').map(Number);
  if (fromMonth === toMonth && fromYear === toYear) {
    return `${fromDay} – ${toDay} ${MONTHS[toMonth - 1]} ${toYear}`;
  }
  return `${formatDate(fromDate)} – ${formatDate(toDate)}`;
};

// ── Presentation-layer lookup maps ──────────────────────────────────────────

const FILTER_CHIPS: FilterStatus[] = [
  'All',
  'Pending',
  'Approved',
  'Rejected',
  'Cancelled',
];

const STATUS_BADGE_VARIANT: Record<
  LeaveRequestStatus,
  'success' | 'warning' | 'error' | 'neutral'
> = {
  Approved: 'success',
  Pending: 'warning',
  Rejected: 'error',
  Cancelled: 'neutral',
};

const BALANCE_TYPE_KEY: Record<LeaveType, string> = {
  Annual:       'leave.balances.types.annual',
  Casual:       'leave.balances.types.casual',
  Sick:         'leave.balances.types.sick',
  Compassionate:'leave.balances.types.compassionate',
  Unpaid:       'leave.balances.types.unpaid',
  Hajj:         'leave.balances.types.hajj',
  Marriage:     'leave.balances.types.marriage',
};

const LEAVE_TYPE_KEY: Record<LeaveType, string> = {
  Annual:       'leave.balances.leaveTypes.annual',
  Casual:       'leave.balances.leaveTypes.casual',
  Sick:         'leave.balances.leaveTypes.sick',
  Compassionate:'leave.balances.leaveTypes.compassionate',
  Unpaid:       'leave.balances.leaveTypes.unpaid',
  Hajj:         'leave.balances.leaveTypes.hajj',
  Marriage:     'leave.balances.leaveTypes.marriage',
};

const FILTER_I18N_KEY: Record<FilterStatus, string> = {
  All: 'leave.requests.filters.all',
  Pending: 'leave.requests.filters.pending',
  Approved: 'leave.requests.filters.approved',
  Rejected: 'leave.requests.filters.rejected',
  Cancelled: 'leave.requests.filters.cancelled',
};

const STATUS_I18N_KEY: Record<LeaveRequestStatus, string> = {
  Approved: 'leave.requests.status.approved',
  Pending: 'leave.requests.status.pending',
  Rejected: 'leave.requests.status.rejected',
  Cancelled: 'leave.requests.status.cancelled',
};

// ── Sub-components ──────────────────────────────────────────────────────────

interface ProgressBarProps {
  // fill ratio (remaining / total); progress = remaining/total so a full bar = all days left
  progress: number;
  styles: ReturnType<typeof createStyles>;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, styles }) => {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${clamped * 100}%` }]} />
    </View>
  );
};

interface BalanceCardProps {
  balance: SerializableLeaveBalance;
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, theme, styles, t }) => (
  <View style={styles.balanceCard}>
    <AppText variant="small" weight="semibold">
      {t(BALANCE_TYPE_KEY[balance.type])}
    </AppText>
    {balance.unlimited ? (
      <>
        <AppText variant="subtitle" color={theme.colors.primary}>
          {t('leave.balances.unlimited')}
        </AppText>
        <AppText variant="micro" color={theme.colors.mutedForeground}>
          {t('leave.balances.noLimit')}
        </AppText>
      </>
    ) : (
      <>
        <View style={styles.numRow}>
          <AppText variant="display" weight="bold" color={theme.colors.primary}>
            {balance.remaining}
          </AppText>
          <AppText variant="micro" color={theme.colors.mutedForeground}>
            {t('leave.balances.daysRemaining')}
          </AppText>
        </View>
        <ProgressBar
          progress={(balance.remaining ?? 0) / (balance.total ?? 1)}
          styles={styles}
        />
        <AppText variant="micro" color={theme.colors.mutedForeground}>
          {t('leave.balances.usedOf', {
            used: balance.used,
            total: balance.total,
          })}
        </AppText>
      </>
    )}
  </View>
);

interface RequestCardProps {
  request: SerializableLeaveRequest;
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const LEAVE_TYPE_COLOR_KEY: Record<LeaveType, keyof AppTheme['colors']['leaveTypes']> = {
  Annual:        'annual',
  Casual:        'casual',
  Sick:          'sick',
  Compassionate: 'compassionate',
  Unpaid:        'unpaid',
  Hajj:          'hajj',
  Marriage:      'marriage',
};

const RequestCard: React.FC<RequestCardProps> = ({ request, theme, styles, t }) => {
  const dotColor = theme.colors.leaveTypes[LEAVE_TYPE_COLOR_KEY[request.leaveType]];
  const duration =
    request.durationDays === 1
      ? t('leave.requests.durationDay')
      : t('leave.requests.durationDays', { count: request.durationDays });

  return (
    <View style={styles.requestCard}>
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      <View style={styles.requestInfo}>
        <AppText variant="label" weight="semibold">
          {t(LEAVE_TYPE_KEY[request.leaveType])}
        </AppText>
        <AppText variant="small" color={theme.colors.mutedForeground}>
          {formatDateRange(request.fromDate, request.toDate)}
        </AppText>
        <AppText variant="micro" color={theme.colors.mutedForeground}>
          {duration}
        </AppText>
      </View>
      <AppBadge
        label={t(STATUS_I18N_KEY[request.status])}
        variant={STATUS_BADGE_VARIANT[request.status]}
      />
    </View>
  );
};

// ── Main screen ─────────────────────────────────────────────────────────────

export const LeaveScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useAppDispatch();

  const [activeFilter, setActiveFilter] = useState<FilterStatus>('All');

  const balances = useAppSelector(selectLeaveBalances);
  const allRequests = useAppSelector(selectLeaveRequests);

  useEffect(() => {
    dispatch(fetchLeaveBalances());
    dispatch(fetchLeaveRequests({ append: false }));
  }, [dispatch]);

  const filteredRequests = useMemo(
    () =>
      activeFilter === 'All'
        ? allRequests
        : allRequests.filter(r => r.status === activeFilter),
    [activeFilter, allRequests],
  );

  const hasRequests = filteredRequests.length > 0;
  const currentYear = new Date().getFullYear().toString();

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      {/* Screen header */}
      <View style={styles.header}>
        <AppText variant="title">{t('leave.title')}</AppText>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          !hasRequests && styles.scrollContentGrow,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Leave balances ── */}
        <View style={styles.sectionHeader}>
          <AppText variant="bodyLg" weight="semibold">
            {t('leave.balances.title')}
          </AppText>
          <AppText variant="labelRegular" color={theme.colors.mutedForeground}>
            {currentYear}
          </AppText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.balanceCardsRow}
        >
          {balances.map(b => (
            <BalanceCard key={b.type} balance={b} theme={theme} styles={styles} t={t} />
          ))}
        </ScrollView>

        {/* ── Requests section header ── */}
        <View style={styles.sectionHeader}>
          <AppText variant="bodyLg" weight="semibold">
            {t('leave.requests.title')}
          </AppText>
          <AppButton
            variant="outline"
            size="sm"
            leftIcon={Plus}
            label={t('leave.requests.newRequest')}
            onPress={() => {}}
          />
        </View>

        {/* ── Filter chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {FILTER_CHIPS.map(chip => (
            <Pressable
              key={chip}
              style={[
                styles.chip,
                activeFilter === chip ? styles.chipActive : styles.chipInactive,
              ]}
              onPress={() => setActiveFilter(chip)}
            >
              <AppText
                variant="small"
                weight={activeFilter === chip ? 'semibold' : 'medium'}
                color={
                  activeFilter === chip
                    ? theme.colors.primaryForeground
                    : theme.colors.foreground
                }
              >
                {t(FILTER_I18N_KEY[chip])}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Request list or empty state ── */}
        {hasRequests ? (
          <View style={styles.requestList}>
            {filteredRequests.map(r => (
              <RequestCard key={r.id} request={r} theme={theme} styles={styles} t={t} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <CalendarX size={ws(36)} color={theme.colors.mutedForeground} />
            </View>
            <AppText variant="cardTitle">{t('leave.requests.empty.title')}</AppText>
            <AppText
              variant="labelRegular"
              color={theme.colors.mutedForeground}
              align="center"
            >
              {t('leave.requests.empty.description')}
            </AppText>
            <AppButton
              variant="primary"
              size="sm"
              label={t('leave.requests.empty.cta')}
              onPress={() => {}}
            />
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable style={styles.fab} onPress={() => {}}>
        <Plus size={ws(24)} color={theme.colors.primaryForeground} />
      </Pressable>
    </SafeAreaView>
  );
};

export default LeaveScreen;

// ── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      height: hs(56),
      paddingHorizontal: ws(20),
      justifyContent: 'center',
    },
    scrollContent: {
      paddingHorizontal: ws(20),
      paddingBottom: hs(100),
      gap: hs(16),
    },
    scrollContentGrow: {
      flexGrow: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    // Balance cards
    balanceCardsRow: {
      gap: ws(12),
    },
    balanceCard: {
      width: ws(160),
      minHeight: hs(96),
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.m,
      padding: ws(12),
      gap: hs(6),
    },
    numRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: ws(4),
    },
    progressTrack: {
      height: hs(4),
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.muted,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primary,
    },
    // Filter chips
    filterChipsRow: {
      gap: ws(8),
    },
    chip: {
      paddingVertical: hs(6),
      paddingHorizontal: ws(12),
      borderRadius: theme.radius.pill,
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
    },
    chipInactive: {
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    // Request cards
    requestList: {
      gap: hs(12),
    },
    requestCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(12),
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.m,
      paddingVertical: hs(12),
      paddingHorizontal: ws(16),
    },
    statusDot: {
      width: ws(12),
      height: ws(12),
      borderRadius: ws(6),
    },
    requestInfo: {
      flex: 1,
      gap: hs(2),
    },
    // Empty state
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: hs(16),
      paddingBottom: hs(40),
    },
    emptyIconCircle: {
      width: ws(80),
      height: ws(80),
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // FAB
    fab: {
      position: 'absolute',
      right: ws(20),
      bottom: hs(24),
      width: ws(56),
      height: ws(56),
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: theme.colors.foreground,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: ws(12),
    },
  });

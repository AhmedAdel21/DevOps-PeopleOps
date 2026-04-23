import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CalendarX, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppAlertBanner, AppBadge, AppButton, AppText } from '@/presentation/components/atoms';
import type {
  LeaveRequestStatus,
  PermissionRequestStatus,
  PermissionType,
} from '@/domain/entities';
import { useAppDispatch, useAppSelector } from '@/presentation/store/hooks';
import {
  clearLastSubmitResult,
  fetchLeaveBalances,
  fetchLeaveRequests,
  fetchPermissionQuota,
  fetchPermissionRequests,
  setRequestsFilter,
  type LeaveFilter,
} from '@/presentation/store/slices';
import {
  selectLastSubmitResult,
  selectLeaveBalances,
  selectLeaveBalancesYear,
  selectLeaveRequests,
  selectLeaveRequestsFetchStatus,
  selectLeaveRequestsFilter,
  selectPermissionRequests,
} from '@/presentation/store/selectors';
import type {
  SerializableLeaveBalance,
  SerializableLeaveRequest,
  SerializablePermissionRequest,
} from '@/presentation/store/slices';
import type { LeaveStackParamList } from '@/presentation/navigation/types';
import { RequestTypePickerSheet } from './request_type_picker_sheet';
import { PERMISSION_TYPE_KEY } from './permission_type_picker_sheet';

// ── UI-only types ───────────────────────────────────────────────────────────

type RequestTab = 'leave' | 'permission';

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

const FILTER_CHIPS: LeaveFilter[] = [
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

const FILTER_I18N_KEY: Record<LeaveFilter, string> = {
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

const PERMISSION_STATUS_BADGE_VARIANT: Record<
  PermissionRequestStatus,
  'success' | 'warning' | 'error' | 'neutral'
> = {
  Approved: 'success',
  Pending: 'warning',
  Rejected: 'error',
  Cancelled: 'neutral',
};

const PERMISSION_STATUS_I18N_KEY: Record<PermissionRequestStatus, string> = {
  Approved: 'leave.requests.status.approved',
  Pending: 'leave.requests.status.pending',
  Rejected: 'leave.requests.status.rejected',
  Cancelled: 'leave.requests.status.cancelled',
};

const getPermissionTypeColor = (type: PermissionType, theme: AppTheme): string => {
  switch (type) {
    case 'Late':      return theme.colors.status.warning.base;
    case 'Early':     return theme.colors.status.success.base;
    case 'MiddleDay': return theme.colors.status.info.base;
    case 'HalfDay':   return '#8B5CF6';
  }
};

const formatPermissionDuration = (
  minutes: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return t('leave.requests.durationHoursMinutes', { hours, minutes: mins });
  }
  if (hours > 0) return t('leave.requests.durationHoursOnly', { hours });
  return t('leave.requests.durationMinutesOnly', { minutes: mins });
};

/** Pick the localized leave-type name based on the current i18n language. */
const pickLocalizedName = (nameEn: string, nameAr: string, lang: string): string =>
  lang.startsWith('ar') ? nameAr : nameEn;

// ── Sub-components ──────────────────────────────────────────────────────────

interface ProgressBarProps {
  progress: number;
  color: string;
  styles: ReturnType<typeof createStyles>;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color, styles }) => {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
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
      {balance.typeName}
    </AppText>
    {balance.isUnlimited ? (
      <>
        <AppText variant="subtitle" color={balance.colorHex}>
          {t('leave.balances.unlimited')}
        </AppText>
        <AppText variant="micro" color={theme.colors.mutedForeground}>
          {t('leave.balances.noLimit')}
        </AppText>
      </>
    ) : (
      <>
        <View style={styles.numRow}>
          <AppText variant="display" weight="bold" color={balance.colorHex}>
            {balance.remainingDays}
          </AppText>
          <AppText variant="micro" color={theme.colors.mutedForeground}>
            {t('leave.balances.daysRemaining')}
          </AppText>
        </View>
        <ProgressBar
          progress={
            balance.totalEntitlement > 0
              ? balance.remainingDays / balance.totalEntitlement
              : 0
          }
          color={balance.colorHex}
          styles={styles}
        />
        <AppText variant="micro" color={theme.colors.mutedForeground}>
          {t('leave.balances.usedOf', {
            used: balance.usedDays,
            total: balance.totalEntitlement,
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
  lang: string;
  onPress: () => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, theme, styles, t, lang, onPress }) => {
  const duration =
    request.totalDays === 1
      ? t('leave.requests.durationDay')
      : t('leave.requests.durationDays', { count: request.totalDays });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.requestCard,
        pressed && { backgroundColor: theme.colors.muted },
      ]}
      onPress={onPress}
    >
      <View style={[styles.statusDot, { backgroundColor: request.colorHex }]} />
      <View style={styles.requestInfo}>
        <AppText variant="label" weight="semibold">
          {pickLocalizedName(request.leaveTypeName, request.leaveTypeNameAr, lang)}
        </AppText>
        <AppText variant="small" color={theme.colors.mutedForeground}>
          {formatDateRange(request.startDate, request.endDate)}
        </AppText>
        <AppText variant="micro" color={theme.colors.mutedForeground}>
          {duration}
        </AppText>
      </View>
      <AppBadge
        label={t(STATUS_I18N_KEY[request.status])}
        variant={STATUS_BADGE_VARIANT[request.status]}
      />
    </Pressable>
  );
};

interface PermissionRequestCardProps {
  request: SerializablePermissionRequest;
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const PermissionRequestCard: React.FC<PermissionRequestCardProps> = ({
  request,
  theme,
  styles,
  t,
}) => {
  const dotColor = getPermissionTypeColor(request.permissionType, theme);
  const timeRange = `${formatDate(request.date)} · ${request.startTime} – ${request.endTime}`;
  const duration = formatPermissionDuration(request.durationMinutes, t);

  return (
    <View style={styles.requestCard}>
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      <View style={styles.requestInfo}>
        <AppText variant="label" weight="semibold">
          {t(PERMISSION_TYPE_KEY[request.permissionType])}
        </AppText>
        <AppText variant="small" color={theme.colors.mutedForeground}>
          {timeRange}
        </AppText>
        <AppText variant="micro" color={theme.colors.mutedForeground}>
          {duration}
        </AppText>
      </View>
      <AppBadge
        label={t(PERMISSION_STATUS_I18N_KEY[request.status])}
        variant={PERMISSION_STATUS_BADGE_VARIANT[request.status]}
      />
    </View>
  );
};

// ── Segmented tab switcher ──────────────────────────────────────────────────

interface SegmentedTabsProps {
  activeTab: RequestTab;
  onChange: (tab: RequestTab) => void;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
  t: (key: string) => string;
}

const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  activeTab,
  onChange,
  styles,
  theme,
  t,
}) => {
  const renderSegment = (tab: RequestTab, label: string) => {
    const isActive = activeTab === tab;
    return (
      <Pressable
        key={tab}
        style={[styles.segment, isActive && styles.segmentActive]}
        onPress={() => onChange(tab)}
      >
        <AppText
          variant="small"
          weight={isActive ? 'semibold' : 'medium'}
          color={isActive ? theme.colors.foreground : theme.colors.mutedForeground}
        >
          {label}
        </AppText>
      </Pressable>
    );
  };

  return (
    <View style={styles.segmentedTrack}>
      {renderSegment('leave', t('leave.requests.tabs.leave'))}
      {renderSegment('permission', t('leave.requests.tabs.permission'))}
    </View>
  );
};

// ── Main screen ─────────────────────────────────────────────────────────────

export const LeaveScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<LeaveStackParamList>>();

  const [activeTab,     setActiveTab]     = useState<RequestTab>('leave');
  const [showTypeSheet, setShowTypeSheet] = useState(false);

  const openNewRequest = useCallback(() => setShowTypeSheet(true), []);

  const handleTypeSelect = useCallback(
    (type: 'vacation' | 'permission') => {
      setShowTypeSheet(false);
      if (type === 'vacation') {
        navigation.navigate('NewVacationRequest');
      } else {
        navigation.navigate('NewPermissionRequest');
      }
    },
    [navigation],
  );

  const balances              = useAppSelector(selectLeaveBalances);
  const balancesYear          = useAppSelector(selectLeaveBalancesYear);
  const leaveRequests         = useAppSelector(selectLeaveRequests);
  const activeFilter          = useAppSelector(selectLeaveRequestsFilter);
  const requestsFetchStatus   = useAppSelector(selectLeaveRequestsFetchStatus);
  const allPermissionRequests = useAppSelector(selectPermissionRequests);
  const lastSubmitResult      = useAppSelector(selectLastSubmitResult);

  const reloadLeaveList = useCallback(
    (filter: LeaveFilter) =>
      dispatch(fetchLeaveRequests({
        filter,
        status: filter === 'All' ? undefined : filter,
        page: 1,
      })),
    [dispatch],
  );

  useEffect(() => {
    dispatch(fetchLeaveBalances());
    dispatch(fetchPermissionQuota());
    dispatch(fetchPermissionRequests({ append: false }));
    reloadLeaveList(activeFilter);
    // We only want this on mount; filter reloads are handled via handleFilterChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleFilterChange = useCallback(
    (next: LeaveFilter) => {
      dispatch(setRequestsFilter(next));
      reloadLeaveList(next);
    },
    [dispatch, reloadLeaveList],
  );

  const handleRefresh = useCallback(() => {
    dispatch(fetchLeaveBalances());
    reloadLeaveList(activeFilter);
  }, [activeFilter, dispatch, reloadLeaveList]);

  const openDetail = useCallback(
    (id: string) => navigation.navigate('LeaveRequestDetail', { id }),
    [navigation],
  );

  const filteredPermissionRequests = useMemo(
    () =>
      activeFilter === 'All'
        ? allPermissionRequests
        : allPermissionRequests.filter(r => r.status === activeFilter),
    [activeFilter, allPermissionRequests],
  );

  const hasRequests =
    activeTab === 'leave'
      ? leaveRequests.length > 0
      : filteredPermissionRequests.length > 0;

  const submitBanner = useMemo(() => {
    if (!lastSubmitResult) return null;
    if (lastSubmitResult.hasAttendanceConflictWarning) {
      return {
        variant: 'warning' as const,
        message: t('leave.requests.warnings.attendanceConflict', {
          dates: lastSubmitResult.conflictDetails ?? '',
        }),
      };
    }
    if (lastSubmitResult.hasWeekendWarning) {
      return {
        variant: 'info' as const,
        message: t('leave.requests.warnings.weekend'),
      };
    }
    return {
      variant: 'success' as const,
      message: t('leave.requests.warnings.submitted'),
    };
  }, [lastSubmitResult, t]);

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
        refreshControl={
          <RefreshControl
            refreshing={requestsFetchStatus === 'pending'}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {submitBanner && (
          <Pressable onPress={() => dispatch(clearLastSubmitResult())}>
            <AppAlertBanner
              variant={submitBanner.variant}
              message={submitBanner.message}
            />
          </Pressable>
        )}

        {/* ── Leave balances ── */}
        <View style={styles.sectionHeader}>
          <AppText variant="bodyLg" weight="semibold">
            {t('leave.balances.title')}
          </AppText>
          <AppText variant="labelRegular" color={theme.colors.mutedForeground}>
            {String(balancesYear ?? new Date().getFullYear())}
          </AppText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.balanceCardsRow}
        >
          {balances.map(b => (
            <BalanceCard key={b.typeId} balance={b} theme={theme} styles={styles} t={t} />
          ))}
        </ScrollView>

        {/* ── Requests section header (tab switcher + new request button) ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.tabSwitcherWrap}>
            <SegmentedTabs
              activeTab={activeTab}
              onChange={setActiveTab}
              styles={styles}
              theme={theme}
              t={t}
            />
          </View>
          <AppButton
            variant="outline"
            size="sm"
            leftIcon={Plus}
            label={t('leave.requests.newRequest')}
            onPress={openNewRequest}
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
              onPress={() => handleFilterChange(chip)}
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
            {activeTab === 'leave'
              ? leaveRequests.map(r => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    theme={theme}
                    styles={styles}
                    t={t}
                    lang={i18n.language}
                    onPress={() => openDetail(r.id)}
                  />
                ))
              : filteredPermissionRequests.map(r => (
                  <PermissionRequestCard key={r.id} request={r} theme={theme} styles={styles} t={t} />
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
              onPress={openNewRequest}
            />
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable style={styles.fab} onPress={openNewRequest}>
        <Plus size={ws(24)} color={theme.colors.primaryForeground} />
      </Pressable>

      {/* ── Request type sheet ── */}
      <RequestTypePickerSheet
        visible={showTypeSheet}
        onClose={() => setShowTypeSheet(false)}
        onSelect={handleTypeSelect}
      />
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
      gap: ws(12),
    },
    tabSwitcherWrap: {
      flex: 1,
    },
    segmentedTrack: {
      flexDirection: 'row',
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.pill,
      padding: ws(4),
    },
    segment: {
      flex: 1,
      paddingVertical: hs(8),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.pill,
    },
    segmentActive: {
      backgroundColor: theme.colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: ws(3),
      elevation: 1,
    },
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
    },
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

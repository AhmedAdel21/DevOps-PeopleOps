import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GestureHandlerRootView,
  Swipeable,
} from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
} from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppAlertBanner, AppText } from '@/presentation/components/atoms';
import { AppAvatar } from '@/presentation/components/molecules';
import { AppRejectReasonSheet } from '@/presentation/components/organisms';
import { useAppDispatch, useAppSelector } from '@/presentation/store/hooks';
import {
  approveLeaveRequest,
  rejectLeaveRequest,
  approvePermissionRequest,
  rejectPermissionRequest,
  fetchPendingApprovals,
  fetchPendingPermissionApprovals,
  fetchTeamAttendanceDay,
  setApprovalsRange,
  setPendingTab,
  setTeamFilter,
  setTeamSegment,
  setTeamSelectedDate,
  type ApprovalRange,
  type PendingApprovalsTab,
  type SerializablePendingApprovalItem,
  type SerializablePendingApprovalSection,
  type SerializableTeamRow,
  type SerializableTeamSummary,
  type TeamSegment,
} from '@/presentation/store/slices';
import {
  selectApprovalSections,
  selectApprovalsFetchStatus,
  selectApprovalsRange,
  selectPendingCount,
  selectPendingTab,
  selectPermissionApprovalSections,
  selectPermissionApprovalsFetchStatus,
  selectPermissionPendingCount,
  selectTeamActiveFilter,
  selectTeamDayFetchStatus,
  selectTeamDaySummary,
  selectTeamRows,
  selectTeamSegment,
  selectTeamSelectedDate,
} from '@/presentation/store/selectors';
import type {
  TeamAttendanceFilter,
  TeamAttendanceStatus,
} from '@/domain/entities';
import type { TeamStackParamList } from '@/presentation/navigation/types';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const shiftIso = (iso: string, deltaDays: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
};

const FILTERS: TeamAttendanceFilter[] = [
  'All', 'Office', 'Remote', 'Absent', 'Late',
];

const FILTER_I18N: Record<TeamAttendanceFilter, string> = {
  All: 'team.filters.all',
  Office: 'team.filters.office',
  Remote: 'team.filters.remote',
  Absent: 'team.filters.absent',
  Late: 'team.filters.late',
};

const STATUS_I18N: Record<TeamAttendanceStatus, string> = {
  Office: 'team.status.office',
  Remote: 'team.status.remote',
  Absent: 'team.status.absent',
  SignedOut: 'team.status.signedOut',
  NotSignedIn: 'team.status.notSignedIn',
  OnLeave: 'team.status.onLeave',
};

const statusColor = (
  theme: AppTheme,
  status: TeamAttendanceStatus,
): string => {
  switch (status) {
    case 'Office':
      return theme.colors.text.primary;
    case 'Remote':
      return theme.colors.accentHover;
    case 'Absent':
      return theme.colors.status.error.base;
    case 'OnLeave':
      return theme.colors.status.warning.base;
    case 'SignedOut':
    case 'NotSignedIn':
    default:
      return theme.colors.mutedForeground;
  }
};

/**
 * Right-side chip content. Present rows show their working *place*
 * (Office/Remote); Absent / NotSignedIn / OnLeave show the *status*. A
 * SignedOut row also shows the *place* it worked from — recovered from
 * `row.place` because `status` collapses to SignedOut and loses it. If the
 * BE sent no place, fall back to the "Signed out" label rather than an
 * empty chip (so the `null` branch is currently unreachable for any real
 * response; it stays only as a defensive guard at the call site).
 */
const statusChipKey = (row: SerializableTeamRow): string | null => {
  if (row.status === 'SignedOut') {
    return row.place === 'Office'
      ? STATUS_I18N.Office
      : row.place === 'Remote'
        ? STATUS_I18N.Remote
        : STATUS_I18N.SignedOut;
  }
  return STATUS_I18N[row.status];
};

const SEGMENTS: TeamSegment[] = ['attendance', 'approvals'];

const APPROVAL_RANGES: ApprovalRange[] = ['all', 'today', 'week', 'month'];
const PENDING_TABS: PendingApprovalsTab[] = ['leaves', 'permissions'];

interface ApprovalCardProps {
  item: SerializablePendingApprovalItem;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
  t: (k: string) => string;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onPress: (requestId: string) => void;
}

/**
 * Swipe reveals an action button the user must TAP to act — it never
 * auto-fires on release (deliberate two-step confirm). Swipe-right reveals
 * Approve (green); swipe-left reveals Reject (red) which opens the
 * reject-reason sheet (BE requires a reason). Tapping the row opens the
 * Approval Detail.
 */
const ApprovalCard: React.FC<ApprovalCardProps> = ({
  item,
  styles,
  theme,
  t,
  onApprove,
  onReject,
  onPress,
}) => {
  const ref = React.useRef<Swipeable>(null);

  const approveAction = () => (
    <Pressable
      style={[styles.swipeAction, styles.swipeApprove]}
      accessibilityRole="button"
      onPress={() => {
        ref.current?.close();
        onApprove(item.requestId);
      }}
    >
      <Check size={ws(22)} color={theme.colors.primaryForeground} />
      <AppText
        variant="small"
        weight="semibold"
        color={theme.colors.primaryForeground}
      >
        {t('team.approvals.actions.approve')}
      </AppText>
    </Pressable>
  );

  const rejectAction = () => (
    <Pressable
      style={[styles.swipeAction, styles.swipeReject]}
      accessibilityRole="button"
      onPress={() => {
        ref.current?.close();
        onReject(item.requestId);
      }}
    >
      <X size={ws(22)} color={theme.colors.primaryForeground} />
      <AppText
        variant="small"
        weight="semibold"
        color={theme.colors.primaryForeground}
      >
        {t('team.approvals.actions.reject')}
      </AppText>
    </Pressable>
  );

  return (
    <Swipeable
      ref={ref}
      renderLeftActions={approveAction}
      renderRightActions={rejectAction}
      leftThreshold={64}
      rightThreshold={64}
      friction={2}
    >
      <Pressable
        style={styles.approvalCard}
        onPress={() => onPress(item.requestId)}
        accessibilityRole="button"
      >
        <View>
          <AppAvatar
            name={item.employeeName}
            size="md"
            backgroundColor={item.avatarColorHex ?? theme.colors.primary}
            textColor={theme.colors.primaryForeground}
          />
          {item.unread ? <View style={styles.unreadDot} /> : null}
        </View>
        <View style={styles.approvalInfo}>
          <AppText variant="label" weight="semibold" numberOfLines={1}>
            {item.employeeName}
          </AppText>
          <AppText
            variant="caption"
            color={theme.colors.mutedForeground}
            numberOfLines={1}
          >
            {`${item.leaveTypeEn} · ${item.leaveTypeAr}`}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {item.dateRangeLabel}
          </AppText>
          <AppText
            variant="micro"
            color={theme.colors.mutedForeground}
            numberOfLines={1}
          >
            {item.submittedAgoLabel}
          </AppText>
        </View>
      </Pressable>
    </Swipeable>
  );
};

interface SummaryStripProps {
  summary: SerializableTeamSummary;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
  t: (k: string) => string;
}

const SummaryStrip: React.FC<SummaryStripProps> = ({
  summary,
  styles,
  theme,
  t,
}) => {
  const chips: Array<[number, string]> = [
    [summary.inOffice, t('team.summary.inOffice')],
    [summary.remote, t('team.summary.remote')],
    [summary.absent, t('team.summary.absent')],
    [summary.late, t('team.summary.late')],
  ];
  return (
    <View style={styles.summaryStrip}>
      {chips.map(([n, label]) => (
        <View key={label} style={styles.summaryChip}>
          <AppText variant="small" weight="semibold">
            {`${n} `}
          </AppText>
          <AppText variant="small" color={theme.colors.mutedForeground}>
            {label}
          </AppText>
        </View>
      ))}
    </View>
  );
};

export const TeamScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<TeamStackParamList>>();

  const segment = useAppSelector(selectTeamSegment);
  const selectedDate = useAppSelector(selectTeamSelectedDate);
  const activeFilter = useAppSelector(selectTeamActiveFilter);
  const summary = useAppSelector(selectTeamDaySummary);
  const rows = useAppSelector(selectTeamRows);
  const fetchStatus = useAppSelector(selectTeamDayFetchStatus);

  // The backend has no filter param — the chips filter the fetched roster
  // client-side. Summary chips always reflect the whole day (unfiltered).
  const visibleRows = useMemo(() => {
    if (activeFilter === 'All') return rows;
    if (activeFilter === 'Late') return rows.filter(r => r.isLate);
    return rows.filter(r => r.status === activeFilter);
  }, [rows, activeFilter]);

  const pendingTab = useAppSelector(selectPendingTab);
  const approvalsRange = useAppSelector(selectApprovalsRange);
  const leavePendingCount = useAppSelector(selectPendingCount);
  const leaveSections = useAppSelector(selectApprovalSections);
  const leaveStatus = useAppSelector(selectApprovalsFetchStatus);
  const permPendingCount = useAppSelector(selectPermissionPendingCount);
  const permSections = useAppSelector(selectPermissionApprovalSections);
  const permStatus = useAppSelector(selectPermissionApprovalsFetchStatus);

  // Active inner tab (Leaves | Permissions) view.
  const isPerm = pendingTab === 'permissions';
  const approvalSections = isPerm ? permSections : leaveSections;
  const approvalsStatus = isPerm ? permStatus : leaveStatus;

  const reload = useCallback(
    (date: string) => dispatch(fetchTeamAttendanceDay({ date })),
    [dispatch],
  );

  // Attendance is the default segment → eager fetch on mount.
  useEffect(() => {
    reload(selectedDate);
    // mount-only; date changes go through their handler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleSegment = useCallback(
    (sgmt: TeamSegment) => dispatch(setTeamSegment(sgmt)),
    [dispatch],
  );

  const handleDateShift = useCallback(
    (delta: number) => {
      const next = shiftIso(selectedDate, delta);
      dispatch(setTeamSelectedDate(next));
      reload(next);
    },
    [dispatch, selectedDate, reload],
  );

  // Filter is client-side now — no refetch, just update the active chip.
  const handleFilter = useCallback(
    (f: TeamAttendanceFilter) => dispatch(setTeamFilter(f)),
    [dispatch],
  );

  const handleClearFilters = useCallback(
    () => dispatch(setTeamFilter('All')),
    [dispatch],
  );

  const loadApprovals = useCallback(
    (tab: PendingApprovalsTab, range: ApprovalRange) =>
      tab === 'permissions'
        ? dispatch(fetchPendingPermissionApprovals({ range }))
        : dispatch(fetchPendingApprovals({ range })),
    [dispatch],
  );

  // Lazy-fetch the ACTIVE inner tab on first switch into Approvals or on
  // switching Leaves↔Permissions, plus auto-retry on error (CLAUDE.md
  // tabbed-screen gotcha — the inactive tab is never fetched on mount).
  useEffect(() => {
    if (segment !== 'approvals') return;
    const status = isPerm ? permStatus : leaveStatus;
    if (status === 'idle' || status === 'error') {
      loadApprovals(pendingTab, approvalsRange);
    }
  }, [
    segment,
    pendingTab,
    isPerm,
    permStatus,
    leaveStatus,
    approvalsRange,
    loadApprovals,
  ]);

  const handlePendingTab = useCallback(
    (tab: PendingApprovalsTab) => {
      // Drop any in-flight reject target — it belongs to the old tab; the
      // reject thunk reads `isPerm` fresh, so a stale id would 404.
      setRejectTarget(null);
      dispatch(setPendingTab(tab));
    },
    [dispatch],
  );

  const handleRange = useCallback(
    (range: ApprovalRange) => {
      dispatch(setApprovalsRange(range));
      loadApprovals(pendingTab, range);
    },
    [dispatch, loadApprovals, pendingTab],
  );

  // Approve/Reject reuse the live leave- OR permission-admin thunks based
  // on the active inner tab. Approve fires on tapping the revealed swipe
  // action; Reject opens the shared reason sheet (BE requires a reason).
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const handleApprove = useCallback(
    (requestId: string) => {
      const action = isPerm
        ? approvePermissionRequest({ leaveRequestId: requestId })
        : approveLeaveRequest({ leaveRequestId: requestId });
      dispatch(action)
        .unwrap()
        .then(() => loadApprovals(pendingTab, approvalsRange))
        .catch(() => undefined);
    },
    [dispatch, isPerm, pendingTab, approvalsRange, loadApprovals],
  );

  const handleSubmitReject = useCallback(
    (comment: string) => {
      if (!rejectTarget || !comment) return;
      setRejectSubmitting(true);
      const action = isPerm
        ? rejectPermissionRequest({
            leaveRequestId: rejectTarget,
            reviewerComment: comment,
          })
        : rejectLeaveRequest({
            leaveRequestId: rejectTarget,
            reviewerComment: comment,
          });
      dispatch(action)
        .unwrap()
        .then(() => {
          setRejectTarget(null);
          setRejectSubmitting(false);
          loadApprovals(pendingTab, approvalsRange);
        })
        .catch(() => setRejectSubmitting(false));
    },
    [dispatch, isPerm, rejectTarget, pendingTab, approvalsRange, loadApprovals],
  );


  const dateLabel = useMemo(() => {
    const d = new Date(`${selectedDate}T00:00:00Z`);
    const dm = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
    return selectedDate === todayIso()
      ? `${t('team.today')}, ${dm}`
      : `${DAYS[d.getUTCDay()]}, ${dm}`;
  }, [selectedDate, t]);

  const totalMembers = useMemo(
    () =>
      summary
        ? summary.inOffice +
          summary.remote +
          summary.absent +
          summary.notSignedIn +
          summary.onLeave
        : 0,
    [summary],
  );

  const renderHeader = () => (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.flexShrink}>
          <AppText variant="title" weight="bold">
            {t('team.title')}
          </AppText>
          {summary ? (
            <AppText variant="caption" color={theme.colors.mutedForeground}>
              {`${totalMembers} ${t('team.members')}`}
            </AppText>
          ) : null}
        </View>
        <View style={styles.dateNav}>
          <Pressable
            hitSlop={8}
            onPress={() => handleDateShift(-1)}
            accessibilityRole="button"
          >
            <ChevronLeft size={ws(20)} color={theme.colors.foreground} />
          </Pressable>
          <AppText variant="label" weight="semibold" style={styles.dateText}>
            {dateLabel}
          </AppText>
          <Pressable
            hitSlop={8}
            onPress={() => handleDateShift(1)}
            accessibilityRole="button"
          >
            <ChevronRight size={ws(20)} color={theme.colors.foreground} />
          </Pressable>
        </View>
      </View>

      {summary ? (
        <SummaryStrip summary={summary} styles={styles} theme={theme} t={t} />
      ) : null}

      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const isActive = activeFilter === f;
          return (
            <Pressable
              key={f}
              onPress={() => handleFilter(f)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <AppText
                variant="small"
                weight={isActive ? 'semibold' : 'medium'}
                color={
                  isActive
                    ? theme.colors.primaryForeground
                    : theme.colors.mutedForeground
                }
              >
                {t(FILTER_I18N[f])}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderRow = useCallback(
    ({ item }: { item: SerializableTeamRow }) => {
      const chipKey = statusChipKey(item);
      return (
      <View style={styles.employeeRow}>
        <AppAvatar
          name={item.displayName}
          size="md"
          backgroundColor={item.avatarColorHex ?? theme.colors.primary}
          textColor={theme.colors.primaryForeground}
        />
        <View style={styles.employeeInfo}>
          <AppText variant="label" weight="semibold" numberOfLines={1}>
            {item.displayName}
          </AppText>
          <AppText
            variant="caption"
            color={theme.colors.mutedForeground}
            numberOfLines={1}
          >
            {item.statusLabel}
          </AppText>
        </View>
        <View style={styles.rightCol}>
          {chipKey ? (
            <View
              style={[
                styles.statusChip,
                { borderColor: statusColor(theme, item.status) },
              ]}
            >
              <AppText
                variant="micro"
                weight="semibold"
                color={statusColor(theme, item.status)}
              >
                {t(chipKey)}
              </AppText>
            </View>
          ) : null}
          {item.isLate ? (
            <View style={styles.lateBadge}>
              <AppText
                variant="micro"
                weight="semibold"
                color={theme.colors.status.error.base}
              >
                {t('team.lateBadge')}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
      );
    },
    [styles, theme, t],
  );

  const renderAttendance = () => {
    if (fetchStatus === 'pending' && rows.length === 0) {
      return (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    if (fetchStatus === 'error') {
      return (
        <View style={styles.centerFill}>
          <Pressable onPress={() => reload(selectedDate)}>
            <AppAlertBanner variant="error" message={t('team.error.load')} />
          </Pressable>
        </View>
      );
    }
    return (
      <FlatList<SerializableTeamRow>
        data={visibleRows}
        keyExtractor={r => r.userId}
        renderItem={renderRow}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          fetchStatus === 'loaded' ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Users size={ws(28)} color={theme.colors.accentHover} />
              </View>
              <AppText variant="cardTitle" weight="semibold" align="center">
                {t('team.empty.title')}
              </AppText>
              <AppText
                variant="body"
                align="center"
                color={theme.colors.mutedForeground}
              >
                {t('team.empty.subtitle')}
              </AppText>
              <Pressable onPress={handleClearFilters} hitSlop={8}>
                <AppText
                  variant="label"
                  weight="semibold"
                  color={theme.colors.accentHover}
                >
                  {t('team.empty.clear')}
                </AppText>
              </Pressable>
            </View>
          ) : null
        }
      />
    );
  };

  const renderApprovals = () => {
    const countSuffix = (n: number) => (n > 0 ? ` (${n})` : '');

    const approvalsHeader = (
      <View>
        <AppText variant="title" weight="bold">
          {t('team.approvals.header')}
        </AppText>

        {/* Inner tabs — leaves vs permissions are separate backend
            endpoints; each carries its own pending count. */}
        <View style={styles.innerTabTrack}>
          {PENDING_TABS.map(tab => {
            const isActive = pendingTab === tab;
            const n =
              tab === 'permissions' ? permPendingCount : leavePendingCount;
            return (
              <Pressable
                key={tab}
                style={[
                  styles.innerTab,
                  isActive && styles.innerTabActive,
                ]}
                onPress={() => handlePendingTab(tab)}
              >
                <AppText
                  variant="small"
                  weight={isActive ? 'semibold' : 'medium'}
                  color={
                    isActive
                      ? theme.colors.foreground
                      : theme.colors.mutedForeground
                  }
                >
                  {`${t(`team.approvals.tabs.${tab}`)}${countSuffix(n)}`}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.filterRow}>
          {APPROVAL_RANGES.map(r => {
            const isActive = approvalsRange === r;
            return (
              <Pressable
                key={r}
                onPress={() => handleRange(r)}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
              >
                <AppText
                  variant="small"
                  weight={isActive ? 'semibold' : 'medium'}
                  color={
                    isActive
                      ? theme.colors.primaryForeground
                      : theme.colors.mutedForeground
                  }
                >
                  {t(`team.approvals.filters.${r}`)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    );

    // Body state for the active tab. The header (incl. the tab switcher)
    // stays mounted in every state so the user can switch tabs while one
    // is loading or errored.
    let body: React.ReactNode = null;
    if (approvalsStatus === 'pending' && approvalSections.length === 0) {
      body = (
        <View style={styles.approvalsBodyFill}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    } else if (approvalsStatus === 'error') {
      body = (
        <View style={styles.approvalsBodyFill}>
          <Pressable
            onPress={() => loadApprovals(pendingTab, approvalsRange)}
          >
            <AppAlertBanner
              variant="error"
              message={t('team.approvals.error')}
            />
          </Pressable>
        </View>
      );
    } else if (approvalSections.length === 0) {
      body = (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Check size={ws(28)} color={theme.colors.accentHover} />
          </View>
          <AppText variant="cardTitle" weight="semibold" align="center">
            {t('team.approvals.empty.title')}
          </AppText>
          <AppText
            variant="body"
            align="center"
            color={theme.colors.mutedForeground}
          >
            {t('team.approvals.empty.subtitle')}
          </AppText>
          <AppText
            variant="caption"
            align="center"
            color={theme.colors.mutedForeground}
          >
            {t('team.approvals.empty.note')}
          </AppText>
        </View>
      );
    }

    return (
      <FlatList<SerializablePendingApprovalSection>
        data={body ? [] : approvalSections}
        keyExtractor={s => s.key}
        ListHeaderComponent={approvalsHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={body as React.ReactElement | null}
        renderItem={({ item: section }) => (
          <View style={styles.approvalSection}>
            <AppText
              variant="small"
              weight="semibold"
              color={theme.colors.mutedForeground}
              style={styles.approvalSectionTitle}
            >
              {section.title}
            </AppText>
            {section.items.map(it => (
              <ApprovalCard
                key={it.requestId}
                item={it}
                styles={styles}
                theme={theme}
                t={t}
                onApprove={handleApprove}
                onReject={setRejectTarget}
                onPress={id =>
                  navigation.navigate('ApprovalDetail', {
                    requestId: id,
                  })
                }
              />
            ))}
          </View>
        )}
      />
    );
  };

  return (
    // Nested GHRV: native-stack (react-native-screens) hosts each screen
    // in a detached native container, so the app-root GestureHandlerRootView
    // doesn't extend here in the *native* tree — the Approvals Swipeable
    // needs a gesture root inside this screen.
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      <View style={styles.segmentedTrack}>
        {SEGMENTS.map(sgmt => {
          const isActive = segment === sgmt;
          return (
            <Pressable
              key={sgmt}
              style={[styles.segment, isActive && styles.segmentActive]}
              onPress={() => handleSegment(sgmt)}
            >
              <AppText
                variant="small"
                weight={isActive ? 'semibold' : 'medium'}
                color={
                  isActive
                    ? theme.colors.foreground
                    : theme.colors.mutedForeground
                }
              >
                {t(`team.segments.${sgmt}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {segment === 'attendance' ? renderAttendance() : renderApprovals()}

      <AppRejectReasonSheet
        visible={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleSubmitReject}
        submitting={rejectSubmitting}
      />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: 'transparent' },
    flexShrink: { flexShrink: 1 },
    centerFill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ws(24),
    },
    segmentedTrack: {
      flexDirection: 'row',
      marginHorizontal: ws(20),
      marginTop: hs(12),
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.pill,
      padding: ws(4),
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: hs(8),
      borderRadius: theme.radius.pill,
    },
    segmentActive: {
      backgroundColor: theme.colors.canvas,
      ...theme.shadow.xs,
    },
    innerTabTrack: {
      flexDirection: 'row',
      marginTop: hs(12),
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.pill,
      padding: ws(4),
    },
    innerTab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: hs(7),
      borderRadius: theme.radius.pill,
    },
    innerTabActive: {
      backgroundColor: theme.colors.canvas,
      ...theme.shadow.xs,
    },
    approvalsBodyFill: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hs(48),
    },
    listContent: {
      paddingHorizontal: ws(20),
      paddingTop: hs(12),
      paddingBottom: hs(24),
      flexGrow: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: ws(12),
    },
    dateNav: { flexDirection: 'row', alignItems: 'center', gap: ws(8) },
    dateText: { minWidth: ws(96), textAlign: 'center' },
    summaryStrip: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ws(8),
      marginTop: hs(16),
    },
    summaryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ws(12),
      paddingVertical: hs(6),
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.muted,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ws(8),
      marginTop: hs(16),
      marginBottom: hs(8),
    },
    filterChip: {
      paddingHorizontal: ws(14),
      paddingVertical: hs(7),
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    employeeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(12),
      paddingVertical: hs(12),
    },
    employeeInfo: { flex: 1, gap: hs(2) },
    rightCol: { alignItems: 'flex-end', gap: hs(4) },
    statusChip: {
      paddingHorizontal: ws(10),
      paddingVertical: hs(3),
      borderRadius: theme.radius.pill,
      borderWidth: 1,
    },
    lateBadge: {
      paddingHorizontal: ws(8),
      paddingVertical: hs(2),
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.status.error.light,
    },
    divider: { height: 1, backgroundColor: theme.colors.divider },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: hs(10),
      paddingVertical: hs(48),
    },
    emptyIconCircle: {
      width: ws(64),
      height: ws(64),
      borderRadius: theme.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent100,
      marginBottom: hs(4),
    },

    // ── Approvals segment ──────────────────────────────────────────────
    approvalsTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(8),
    },
    countBadge: {
      minWidth: ws(24),
      height: ws(24),
      paddingHorizontal: ws(6),
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    approvalSection: { marginTop: hs(16) },
    approvalSectionTitle: {
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: hs(8),
    },
    approvalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(12),
      paddingVertical: hs(12),
      paddingHorizontal: ws(14),
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: hs(8),
    },
    approvalInfo: { flex: 1, gap: hs(2) },
    unreadDot: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: ws(10),
      height: ws(10),
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.spark,
      borderWidth: 2,
      borderColor: theme.colors.card,
    },
    swipeAction: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: hs(2),
      width: ws(96),
      marginBottom: hs(8),
      borderRadius: theme.radius.lg,
    },
    swipeApprove: { backgroundColor: theme.colors.status.success.base },
    swipeReject: { backgroundColor: theme.colors.status.error.base },
  });

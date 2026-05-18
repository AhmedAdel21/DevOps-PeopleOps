import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppAlertBanner,
  AppBottomSheet,
  AppText,
} from '@/presentation/components/atoms';
import { AppAvatar } from '@/presentation/components/molecules';
import { useAppDispatch, useAppSelector } from '@/presentation/store/hooks';
import {
  approveLeaveRequest,
  fetchDepartments,
  fetchPendingApprovals,
  fetchTeamAttendanceDay,
  setApprovalsRange,
  setTeamFilter,
  setTeamSegment,
  setTeamSelectedDate,
  setTeamSelectedDepartment,
  type SerializablePendingApprovalItem,
  type SerializablePendingApprovalSection,
  type SerializableTeamRow,
  type SerializableTeamSummary,
  type TeamSegment,
} from '@/presentation/store/slices';
import { Permissions } from '@/core/auth';
import {
  selectApprovalSections,
  selectApprovalsFetchStatus,
  selectApprovalsRange,
  selectDepartments,
  selectHasPermission,
  selectPendingCount,
  selectTeamActiveFilter,
  selectTeamDayFetchStatus,
  selectTeamDaySummary,
  selectTeamRows,
  selectTeamSegment,
  selectTeamSelectedDate,
  selectTeamSelectedDepartmentId,
} from '@/presentation/store/selectors';
import type {
  PendingApprovalRange,
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
  'All', 'Office', 'Remote', 'Absent', 'Late', 'NotSignedIn',
];

const FILTER_I18N: Record<TeamAttendanceFilter, string> = {
  All: 'team.filters.all',
  Office: 'team.filters.office',
  Remote: 'team.filters.remote',
  Absent: 'team.filters.absent',
  Late: 'team.filters.late',
  NotSignedIn: 'team.filters.notSignedIn',
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
      return theme.colors.primary;
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

const SEGMENTS: TeamSegment[] = ['attendance', 'approvals'];

const APPROVAL_RANGES: PendingApprovalRange[] = [
  'all',
  'today',
  'week',
  'month',
];

interface ApprovalCardProps {
  item: SerializablePendingApprovalItem;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
  t: (k: string) => string;
  onApprove: (requestId: string) => void;
  onPress: (requestId: string) => void;
}

/**
 * Swipe-right reveals Approve (green, left action) — fires on full open,
 * then the row closes. Swipe-left/Reject is intentionally NOT here: the
 * BE requires a reject reason (contract §2/§4-Q3), so reject goes through
 * the row-tap → Approval Detail → reject sheet flow in Slice 4. Adding a
 * no-reason swipe-reject now would silently 400.
 */
const ApprovalCard: React.FC<ApprovalCardProps> = ({
  item,
  styles,
  theme,
  t,
  onApprove,
  onPress,
}) => {
  const ref = React.useRef<Swipeable>(null);

  const leftActions = () => (
    <View style={[styles.swipeAction, styles.swipeApprove]}>
      <Check size={ws(22)} color={theme.colors.primaryForeground} />
      <AppText
        variant="small"
        weight="semibold"
        color={theme.colors.primaryForeground}
      >
        {t('team.approvals.actions.approve')}
      </AppText>
    </View>
  );

  return (
    <Swipeable
      ref={ref}
      renderLeftActions={leftActions}
      leftThreshold={64}
      friction={2}
      onSwipeableOpen={direction => {
        ref.current?.close();
        if (direction === 'left') onApprove(item.requestId);
      }}
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
  const departmentId = useAppSelector(selectTeamSelectedDepartmentId);
  const summary = useAppSelector(selectTeamDaySummary);
  const rows = useAppSelector(selectTeamRows);
  const fetchStatus = useAppSelector(selectTeamDayFetchStatus);

  const approvalsRange = useAppSelector(selectApprovalsRange);
  const pendingCount = useAppSelector(selectPendingCount);
  const approvalSections = useAppSelector(selectApprovalSections);
  const approvalsStatus = useAppSelector(selectApprovalsFetchStatus);

  const departments = useAppSelector(selectDepartments);
  // HR/admin scope gate (CLAUDE.md: gate on permission, never role nor a
  // proxy). `attendance:override` is the admin-attendance capability a
  // plain team Manager lacks; the BE re-authorizes regardless. `> 1` is
  // just a UI nicety so we never open an empty/single-item picker.
  const canSelectDepartment = useAppSelector(s =>
    selectHasPermission(s, Permissions.Attendance.Override),
  );
  const showDeptSelector = canSelectDepartment && departments.length > 1;
  const [deptSheetOpen, setDeptSheetOpen] = useState(false);

  const reload = useCallback(
    (date: string, filter: TeamAttendanceFilter) =>
      dispatch(
        fetchTeamAttendanceDay({
          date,
          departmentId: departmentId ?? undefined,
          filter: filter === 'All' ? undefined : filter,
        }),
      ),
    [dispatch, departmentId],
  );

  // Attendance is the default segment → eager fetch on mount.
  // Departments load too (HR selector); on Manager scope the BE returns
  // their own dept(s) only and the selector simply won't be shown.
  useEffect(() => {
    reload(selectedDate, activeFilter);
    dispatch(fetchDepartments());
    // mount-only; date/filter changes go through their handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const selectedDeptName = useMemo(() => {
    if (!departmentId) return t('team.allDepartments');
    return (
      departments.find(d => d.id === departmentId)?.nameEn ??
      t('team.allDepartments')
    );
  }, [departmentId, departments, t]);

  const handleSelectDepartment = useCallback(
    (id: string | null) => {
      setDeptSheetOpen(false);
      dispatch(setTeamSelectedDepartment(id));
      dispatch(
        fetchTeamAttendanceDay({
          date: selectedDate,
          departmentId: id ?? undefined,
          filter: activeFilter === 'All' ? undefined : activeFilter,
        }),
      );
    },
    [dispatch, selectedDate, activeFilter],
  );

  const handleSegment = useCallback(
    (sgmt: TeamSegment) => dispatch(setTeamSegment(sgmt)),
    [dispatch],
  );

  const handleDateShift = useCallback(
    (delta: number) => {
      const next = shiftIso(selectedDate, delta);
      dispatch(setTeamSelectedDate(next));
      reload(next, activeFilter);
    },
    [dispatch, selectedDate, activeFilter, reload],
  );

  const handleFilter = useCallback(
    (f: TeamAttendanceFilter) => {
      dispatch(setTeamFilter(f));
      reload(selectedDate, f);
    },
    [dispatch, selectedDate, reload],
  );

  const handleClearFilters = useCallback(() => {
    dispatch(setTeamFilter('All'));
    reload(selectedDate, 'All');
  }, [dispatch, selectedDate, reload]);

  const loadApprovals = useCallback(
    (range: PendingApprovalRange) =>
      dispatch(fetchPendingApprovals({ range })),
    [dispatch],
  );

  // Lazy fetch on first switch to the Approvals segment, plus auto-retry
  // if the previous fetch errored (CLAUDE.md tabbed-screen gotcha).
  useEffect(() => {
    if (segment !== 'approvals') return;
    if (approvalsStatus === 'idle' || approvalsStatus === 'error') {
      loadApprovals(approvalsRange);
    }
  }, [segment, approvalsStatus, approvalsRange, loadApprovals]);

  const handleRange = useCallback(
    (range: PendingApprovalRange) => {
      dispatch(setApprovalsRange(range));
      loadApprovals(range);
    },
    [dispatch, loadApprovals],
  );

  // Approve/Reject reuse the existing leave-admin thunks (keyed by the
  // same requestId). Reject reason capture (design uAdAe) lands in Slice 4;
  // swipe-reject sends no comment for now.
  const handleApprove = useCallback(
    (requestId: string) => {
      dispatch(approveLeaveRequest({ leaveRequestId: requestId }))
        .unwrap()
        .then(() => loadApprovals(approvalsRange))
        .catch(() => undefined);
    },
    [dispatch, loadApprovals, approvalsRange],
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

      {/* HR department selector (design dcnNd). Only rendered when the BE
          returns more than one department — for a Manager the list comes
          back with just their own dept (or fewer), so the picker stays
          hidden. Scope is BE-driven; this is the client-side proxy. */}
      {showDeptSelector ? (
        <Pressable
          style={styles.deptSelect}
          onPress={() => setDeptSheetOpen(true)}
          accessibilityRole="button"
        >
          <AppText variant="label" weight="medium" numberOfLines={1}>
            {selectedDeptName}
          </AppText>
          <ChevronDown size={ws(16)} color={theme.colors.mutedForeground} />
        </Pressable>
      ) : null}

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
    ({ item }: { item: SerializableTeamRow }) => (
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
              {t(STATUS_I18N[item.status])}
            </AppText>
          </View>
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
    ),
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
          <Pressable onPress={() => reload(selectedDate, activeFilter)}>
            <AppAlertBanner variant="error" message={t('team.error.load')} />
          </Pressable>
        </View>
      );
    }
    return (
      <FlatList<SerializableTeamRow>
        data={rows}
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
    if (approvalsStatus === 'pending' && approvalSections.length === 0) {
      return (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    if (approvalsStatus === 'error') {
      return (
        <View style={styles.centerFill}>
          <Pressable onPress={() => loadApprovals(approvalsRange)}>
            <AppAlertBanner
              variant="error"
              message={t('team.approvals.error')}
            />
          </Pressable>
        </View>
      );
    }

    const approvalsHeader = (
      <View>
        <View style={styles.approvalsTitleRow}>
          <AppText variant="title" weight="bold">
            {t('team.approvals.header')}
          </AppText>
          {pendingCount > 0 ? (
            <View style={styles.countBadge}>
              <AppText
                variant="caption"
                weight="semibold"
                color={theme.colors.primaryForeground}
              >
                {String(pendingCount)}
              </AppText>
            </View>
          ) : null}
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

    if (
      approvalsStatus === 'loaded' &&
      (pendingCount === 0 || approvalSections.length === 0)
    ) {
      return (
        <FlatList<never>
          data={[]}
          keyExtractor={(_, i) => String(i)}
          renderItem={() => null}
          ListHeaderComponent={approvalsHeader}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
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
          }
        />
      );
    }

    return (
      <FlatList<SerializablePendingApprovalSection>
        data={approvalSections}
        keyExtractor={s => s.key}
        ListHeaderComponent={approvalsHeader}
        contentContainerStyle={styles.listContent}
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

      <AppBottomSheet
        visible={deptSheetOpen}
        onClose={() => setDeptSheetOpen(false)}
        heightFraction={0.6}
      >
        <View style={styles.sheetBody}>
          <View style={styles.sheetHeader}>
            <AppText variant="cardTitle" weight="semibold">
              {t('team.selectDepartment')}
            </AppText>
            <Pressable
              onPress={() => setDeptSheetOpen(false)}
              hitSlop={8}
              accessibilityRole="button"
            >
              <AppText
                variant="label"
                weight="semibold"
                color={theme.colors.accentHover}
              >
                {t('common.close')}
              </AppText>
            </Pressable>
          </View>
          <ScrollView>
            <Pressable
              style={styles.deptOption}
              onPress={() => handleSelectDepartment(null)}
            >
              <AppText
                variant="body"
                weight={departmentId === null ? 'semibold' : 'regular'}
                color={
                  departmentId === null
                    ? theme.colors.primary
                    : theme.colors.foreground
                }
              >
                {t('team.allDepartments')}
              </AppText>
            </Pressable>
            {departments.map(d => {
              const active = departmentId === d.id;
              return (
                <Pressable
                  key={d.id}
                  style={styles.deptOption}
                  onPress={() => handleSelectDepartment(d.id)}
                >
                  <AppText
                    variant="body"
                    weight={active ? 'semibold' : 'regular'}
                    color={
                      active
                        ? theme.colors.primary
                        : theme.colors.foreground
                    }
                  >
                    {d.nameAr ? `${d.nameEn} · ${d.nameAr}` : d.nameEn}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={theme.colors.mutedForeground}
                  >
                    {`${d.memberCount} ${t('team.members')}`}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </AppBottomSheet>
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

    // ── HR department selector + picker sheet ──────────────────────────
    deptSelect: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: ws(6),
      marginTop: hs(12),
      paddingHorizontal: ws(12),
      paddingVertical: hs(8),
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.canvas,
    },
    sheetBody: {
      flex: 1,
      paddingHorizontal: ws(20),
      paddingTop: hs(8),
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: hs(12),
    },
    deptOption: {
      paddingVertical: hs(14),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      gap: hs(2),
    },
  });

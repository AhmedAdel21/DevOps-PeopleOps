import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Clock, Download, XCircle } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppAlertBanner,
  AppBackButton,
  AppButton,
  AppCard,
  AppText,
} from '@/presentation/components/atoms';
import {
  AppActivityTimeline,
  AppApprovalProgress,
  AppAvatar,
  type ApprovalProgressLabels,
  type ApprovalProgressLabelsForLog,
} from '@/presentation/components/molecules';
import { AppRejectReasonSheet } from '@/presentation/components/organisms';
import type { ApprovalLegStatus } from '@/domain/entities';
import { useAppDispatch, useAppSelector } from '@/presentation/store/hooks';
import {
  approveLeaveRequest,
  fetchApprovalDetail,
  fetchPendingApprovals,
  rejectLeaveRequest,
} from '@/presentation/store/slices';
import {
  selectApprovalDetailById,
  selectApprovalDetailFetchStatus,
  selectApprovalsRange,
} from '@/presentation/store/selectors';
import type { TeamStackParamList } from '@/presentation/navigation/types';

type DetailRoute = RouteProp<TeamStackParamList, 'ApprovalDetail'>;

// Closed set used to build the i18n-keyed `statuses` map for
// AppApprovalProgress — same shape as on the requester's detail screen.
const APPROVAL_STATUS_KEYS: readonly ApprovalLegStatus[] = [
  'Pending',
  'Approved',
  'Rejected',
  'Superseded',
];

export const ApprovalDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<TeamStackParamList>>();
  const route = useRoute<DetailRoute>();
  const { requestId } = route.params;

  const detail = useAppSelector(selectApprovalDetailById(requestId));
  const fetchStatus = useAppSelector(selectApprovalDetailFetchStatus);
  const approvalsRange = useAppSelector(selectApprovalsRange);

  const [confirmMode, setConfirmMode] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Bumped by pull-to-refresh + after Approve/Reject so the embedded
  // AppActivityTimeline re-fetches the log without us calling its
  // imperative API.
  const [activityReloadKey, setActivityReloadKey] = useState(0);

  // i18n-agnostic component labels — built once per locale change.
  const approvalLabels = useMemo<ApprovalProgressLabels>(
    () => ({
      title: t('leave.approvalProgress.title'),
      legs: {
        manager: t('leave.approvalProgress.legs.manager'),
        hr: t('leave.approvalProgress.legs.hr'),
        ceo: t('leave.approvalProgress.legs.ceo'),
      },
      statuses: APPROVAL_STATUS_KEYS.reduce(
        (acc, k) => ({ ...acc, [k]: t(`leave.approvalProgress.statuses.${k}`) }),
        {} as Record<ApprovalLegStatus, string>,
      ),
    }),
    [t],
  );

  const activityLabels = useMemo<ApprovalProgressLabelsForLog>(
    () => ({
      title: t('leave.activityLog.title'),
      loading: t('leave.activityLog.loading'),
      empty: t('leave.activityLog.empty'),
      loadFailed: t('leave.activityLog.loadFailed'),
    }),
    [t],
  );

  useEffect(() => {
    dispatch(fetchApprovalDetail({ requestId }));
  }, [dispatch, requestId]);

  const afterDecision = useCallback(() => {
    dispatch(fetchPendingApprovals({ range: approvalsRange }));
    navigation.goBack();
  }, [dispatch, approvalsRange, navigation]);

  const handleConfirmApprove = useCallback(() => {
    setSubmitting(true);
    dispatch(approveLeaveRequest({ leaveRequestId: requestId }))
      .unwrap()
      .then(afterDecision)
      .catch(() => setSubmitting(false));
  }, [dispatch, requestId, afterDecision]);

  const handleSubmitReject = useCallback(
    (comment: string) => {
      if (!comment) return;
      setSubmitting(true);
      dispatch(
        rejectLeaveRequest({
          leaveRequestId: requestId,
          reviewerComment: comment,
        }),
      )
        .unwrap()
        .then(() => {
          setRejectOpen(false);
          afterDecision();
        })
        .catch(() => setSubmitting(false));
    },
    [dispatch, requestId, afterDecision],
  );

  const renderHeader = () => (
    <View style={styles.navHeader}>
      <AppBackButton onPress={() => navigation.goBack()} />
      <AppText variant="title" align="center" style={styles.navTitle}>
        {t('team.detail.header')}
      </AppText>
      <View style={styles.navSpacer} />
    </View>
  );

  if (fetchStatus === 'pending' && !detail) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        {renderHeader()}
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={theme.colors.primaryInk} />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        {renderHeader()}
        <View style={styles.centerFill}>
          <Pressable
            onPress={() => dispatch(fetchApprovalDetail({ requestId }))}
          >
            <AppAlertBanner
              variant="error"
              message={t('team.detail.error')}
            />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const {
    employee,
    request,
    balanceImpact,
    conflict,
    precedentLabel,
    approvalProgress,
    attachments,
    status,
  } = detail;
  // The list is now broadened to include terminalized rows
  // (Phase 4f.5 includeHistory). Hide the action area + show a
  // status-appropriate hero card for those.
  const isTerminal = status === 'Approved' || status === 'Rejected' || status === 'Cancelled';

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      {renderHeader()}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={fetchStatus === 'pending'}
            onRefresh={() => {
              dispatch(fetchApprovalDetail({ requestId }));
              setActivityReloadKey(k => k + 1);
            }}
            tintColor={theme.colors.primaryInk}
          />
        }
      >
        <View style={styles.employeeRow}>
          <AppAvatar
            name={employee.name}
            size="lg"
            backgroundColor={
              employee.avatarColorHex ?? theme.colors.primary
            }
            textColor={theme.colors.primaryForeground}
          />
          <View style={styles.flexShrink}>
            <AppText variant="subtitle" weight="bold">
              {employee.name}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedForeground}>
              {`${employee.roleTitle} · ${employee.departmentName}`}
            </AppText>
          </View>
        </View>

        {employee.attendanceRecordUrl ? (
          <Pressable hitSlop={6} style={styles.viewLink}>
            <AppText
              variant="label"
              weight="semibold"
              color={theme.colors.accentHover}
            >
              {`${t('team.detail.viewAttendance')} →`}
            </AppText>
          </Pressable>
        ) : null}

        {/* Status-aware hero — Pending = "Awaiting your decision",
            Approved/Rejected/Cancelled = the terminal summary so the
            reviewer knows the request is closed. */}
        <View
          style={[
            styles.heroCard,
            isTerminal ? styles.heroCardTerminal : null,
          ]}
        >
          {status === 'Approved' ? (
            <CheckCircle2 size={ws(28)} color={theme.colors.status.success.base} />
          ) : status === 'Rejected' || status === 'Cancelled' ? (
            <XCircle
              size={ws(28)}
              color={
                status === 'Rejected'
                  ? theme.colors.status.error.base
                  : theme.colors.mutedForeground
              }
            />
          ) : (
            <Clock size={ws(28)} color={theme.colors.primaryInk} />
          )}
          <AppText variant="cardTitle" weight="semibold">
            {isTerminal
              ? t(`team.detail.heroTerminalTitle.${status}`)
              : t('team.detail.heroPendingTitle')}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedForeground}>
            {isTerminal
              ? t('team.detail.heroTerminalSub')
              : t('team.detail.heroPendingSub')}
          </AppText>
        </View>

        {conflict ? (
          <AppCard>
            <View style={styles.conflictHeader}>
              <AlertTriangle
                size={ws(18)}
                color={theme.colors.status.warning.base}
              />
              <AppText variant="label" weight="semibold">
                {conflict.title}
              </AppText>
            </View>
            {conflict.rows.map((r, i) => (
              <View key={`${r}-${i}`} style={styles.conflictRow}>
                <View style={styles.dot} />
                <AppText
                  variant="caption"
                  color={theme.colors.mutedForeground}
                >
                  {r}
                </AppText>
              </View>
            ))}
          </AppCard>
        ) : null}

        <AppCard title={t('team.detail.requestTitle')}>
          <DetailRow
            label={t('team.detail.rows.type')}
            value={`${request.typeEn} · ${request.typeAr}`}
            styles={styles}
            theme={theme}
          />
          <DetailRow
            label={t('team.detail.rows.dates')}
            value={request.datesLabel}
            styles={styles}
            theme={theme}
          />
          <DetailRow
            label={t('team.detail.rows.duration')}
            value={request.durationLabel}
            styles={styles}
            theme={theme}
          />
          <DetailRow
            label={t('team.detail.rows.submitted')}
            value={request.submittedLabel}
            styles={styles}
            theme={theme}
          />
          {request.note ? (
            <DetailRow
              label={t('team.detail.rows.note')}
              value={request.note}
              styles={styles}
              theme={theme}
              last
            />
          ) : null}
        </AppCard>

        {balanceImpact ? (
          <AppCard title={t('team.detail.balanceTitle')}>
            <View style={styles.balanceRow}>
              <AppText variant="label">
                {balanceImpact.leaveTypeLabel}
              </AppText>
              <View style={styles.balanceValue}>
                <AppText variant="label" weight="semibold">
                  {balanceImpact.beforeLabel}
                </AppText>
                <AppText
                  variant="label"
                  color={theme.colors.mutedForeground}
                >
                  {'  →  '}
                </AppText>
                <AppText
                  variant="label"
                  weight="semibold"
                  color={theme.colors.primaryInk}
                >
                  {balanceImpact.afterLabel}
                </AppText>
              </View>
            </View>
          </AppCard>
        ) : null}

        {precedentLabel ? (
          <AppText
            variant="caption"
            color={theme.colors.mutedForeground}
            style={styles.precedent}
          >
            {precedentLabel}
          </AppText>
        ) : null}

        {/* Per-leg approval progress (Manager → HR → CEO swim lanes).
            Same component the requester sees on their own detail screen
            — keeps the visual story consistent across both audiences.
            Hidden when the BE didn't ship per-leg state. */}
        {approvalProgress ? (
          <AppCard>
            <AppApprovalProgress
              progress={approvalProgress}
              labels={approvalLabels}
            />
          </AppCard>
        ) : null}

        {/* Attachments uploaded by the requester (Phase 4f.3 +
            surfaced on the review inbox in 4f.5). Always rendered so
            the reviewer can scan whether documentation was supplied;
            shows "No attachments" when empty. */}
        <AppCard title={t('team.detail.attachmentsTitle')}>
          {attachments.length === 0 ? (
            <AppText
              variant="caption"
              color={theme.colors.mutedForeground}
              style={styles.attachmentsEmpty}
            >
              {t('team.detail.attachmentsEmpty')}
            </AppText>
          ) : (
            <View style={styles.attachmentsList}>
              {attachments.map(att => (
                <Pressable
                  key={att.id}
                  style={styles.attachmentRow}
                  onPress={() => Linking.openURL(att.url)}
                  hitSlop={6}
                  accessibilityRole="link"
                >
                  <View style={styles.attachmentInfo}>
                    <AppText variant="label" numberOfLines={1}>
                      {att.fileName}
                    </AppText>
                    {att.sizeBytes > 0 ? (
                      <AppText
                        variant="micro"
                        color={theme.colors.mutedForeground}
                      >
                        {formatBytes(att.sizeBytes)}
                      </AppText>
                    ) : null}
                  </View>
                  <Download
                    size={ws(18)}
                    color={theme.colors.accentHover}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </AppCard>

        {/* Activity log — chronological conversation (submission,
            comments, status changes, attachments). Self-fetches via the
            use case; bumps on parent reloadKey after the reviewer acts. */}
        <AppCard>
          <AppActivityTimeline
            kind="leave"
            id={requestId}
            labels={activityLabels}
            reloadKey={activityReloadKey}
          />
        </AppCard>
      </ScrollView>

      {isTerminal ? null : <View style={styles.stickyBottom}>
        {confirmMode ? (
          <>
            <AppText
              variant="label"
              align="center"
              style={styles.confirmText}
            >
              {t('team.detail.confirm', {
                duration: request.durationLabel,
                type: request.typeEn,
              })}
            </AppText>
            <View style={styles.btnRow}>
              <AppButton
                label={t('common.cancel')}
                variant="outline"
                onPress={() => setConfirmMode(false)}
                disabled={submitting}
                fullWidth
                style={styles.btnFlex}
              />
              <AppButton
                label={t('team.detail.confirmYes')}
                variant="primary"
                onPress={handleConfirmApprove}
                loading={submitting}
                fullWidth
                style={styles.btnFlex}
              />
            </View>
          </>
        ) : (
          <View style={styles.btnRow}>
            <AppButton
              label={t('team.detail.actions.reject')}
              variant="outlineDestructive"
              onPress={() => setRejectOpen(true)}
              fullWidth
              style={styles.btnFlex}
            />
            <AppButton
              label={t('team.detail.actions.approve')}
              variant="primary"
              onPress={() => setConfirmMode(true)}
              fullWidth
              style={styles.btnFlex}
            />
          </View>
        )}
      </View>}

      <AppRejectReasonSheet
        visible={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={handleSubmitReject}
        submitting={submitting}
      />
    </SafeAreaView>
  );
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

interface DetailRowProps {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
  last?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  styles,
  theme,
  last,
}) => (
  <View>
    <View style={styles.detailRow}>
      <AppText variant="caption" color={theme.colors.mutedForeground}>
        {label}
      </AppText>
      <AppText variant="label" weight="medium" style={styles.detailValue}>
        {value}
      </AppText>
    </View>
    {last ? null : <View style={styles.detailDivider} />}
  </View>
);

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: 'transparent' },
    flexShrink: { flexShrink: 1, gap: hs(2) },
    centerFill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ws(24),
    },
    navHeader: {
      paddingHorizontal: ws(16),
      marginTop: hs(8),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(12),
    },
    navTitle: { flex: 1 },
    navSpacer: { width: ws(32) },
    content: {
      paddingHorizontal: ws(20),
      paddingTop: hs(12),
      paddingBottom: hs(24),
      gap: hs(16),
    },
    employeeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(14),
    },
    viewLink: { alignSelf: 'flex-start' },
    heroCard: {
      alignItems: 'center',
      gap: hs(6),
      paddingVertical: hs(20),
      borderRadius: theme.radius.lg,
      backgroundColor: theme.dark
        ? theme.colors.status.info.light
        : theme.colors.primaryLight,
    },
    // Terminal hero uses the neutral surface — the status icon already
    // carries the colour signal, no need for the primary tint.
    heroCardTerminal: {
      backgroundColor: theme.colors.muted,
    },
    attachmentsList: {
      gap: hs(8),
    },
    attachmentsEmpty: {
      fontStyle: 'italic',
    },
    attachmentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(10),
      paddingVertical: hs(10),
      paddingHorizontal: ws(12),
      borderRadius: theme.radius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    attachmentInfo: { flex: 1, gap: hs(2) },
    conflictHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(8),
      marginBottom: hs(8),
    },
    conflictRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(8),
      paddingVertical: hs(3),
    },
    dot: {
      width: ws(6),
      height: ws(6),
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.status.warning.base,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: ws(16),
      paddingVertical: hs(8),
    },
    detailValue: { flexShrink: 1, textAlign: 'right' },
    detailDivider: {
      height: 1,
      backgroundColor: theme.colors.divider,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    balanceValue: { flexDirection: 'row', alignItems: 'center' },
    precedent: { paddingHorizontal: ws(4) },
    stickyBottom: {
      paddingHorizontal: ws(20),
      paddingTop: hs(12),
      paddingBottom: hs(20),
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.canvas,
      gap: hs(10),
    },
    confirmText: {},
    btnRow: { flexDirection: 'row', gap: ws(12) },
    btnFlex: { flex: 1 },
  });

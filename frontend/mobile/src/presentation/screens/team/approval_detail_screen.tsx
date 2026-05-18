import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import { AlertTriangle, Clock } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppAlertBanner,
  AppBackButton,
  AppButton,
  AppCard,
  AppText,
} from '@/presentation/components/atoms';
import { AppAvatar } from '@/presentation/components/molecules';
import { AppRejectReasonSheet } from '@/presentation/components/organisms';
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
          <ActivityIndicator size="large" color={theme.colors.primary} />
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

  const { employee, request, balanceImpact, conflict, precedentLabel } =
    detail;

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      {renderHeader()}

      <ScrollView contentContainerStyle={styles.content}>
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

        <View style={styles.heroCard}>
          <Clock size={ws(28)} color={theme.colors.primary} />
          <AppText variant="cardTitle" weight="semibold">
            {t('team.detail.heroPendingTitle')}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedForeground}>
            {t('team.detail.heroPendingSub')}
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
                  color={theme.colors.primary}
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
      </ScrollView>

      <View style={styles.stickyBottom}>
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
      </View>

      <AppRejectReasonSheet
        visible={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={handleSubmitReject}
        submitting={submitting}
      />
    </SafeAreaView>
  );
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
      backgroundColor: theme.colors.primaryLight,
    },
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

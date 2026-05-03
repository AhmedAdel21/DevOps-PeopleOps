import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppAlertBanner,
  AppBackButton,
  AppBadge,
  AppButton,
  AppDivider,
  AppPermissionGate,
  AppText,
} from '@/presentation/components/atoms';
import { Permissions } from '@/core/auth';
import type { LeaveRequestStatus } from '@/domain/entities';
import { useAppDispatch, useAppSelector } from '@/presentation/store/hooks';
import {
  cancelLeaveRequest,
  fetchLeaveRequestDetail,
} from '@/presentation/store/slices';
import {
  selectCancelError,
  selectCancelStatus,
  selectLeaveRequestDetailById,
  selectLeaveRequestDetailFetchError,
  selectLeaveRequestDetailFetchStatus,
} from '@/presentation/store/selectors';
import type { LeaveStackParamList } from '@/presentation/navigation/types';

// ── Date helpers ────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
};

const formatDateRange = (fromDate: string, toDate: string): string => {
  if (fromDate === toDate) return formatDate(fromDate);
  return `${formatDate(fromDate)} – ${formatDate(toDate)}`;
};

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${hours}:${minutes}`;
};

// ── Status lookup ───────────────────────────────────────────────────────────

const STATUS_BADGE_VARIANT: Record<
  LeaveRequestStatus,
  'success' | 'warning' | 'error' | 'neutral'
> = {
  Approved: 'success',
  Pending: 'warning',
  Rejected: 'error',
  Cancelled: 'neutral',
};

const STATUS_I18N_KEY: Record<LeaveRequestStatus, string> = {
  Approved: 'leave.requests.status.approved',
  Pending: 'leave.requests.status.pending',
  Rejected: 'leave.requests.status.rejected',
  Cancelled: 'leave.requests.status.cancelled',
};

const pickLocalizedName = (en: string, ar: string, lang: string): string =>
  lang.startsWith('ar') ? ar : en;

// ── Screen ──────────────────────────────────────────────────────────────────

type DetailRoute = RouteProp<LeaveStackParamList, 'LeaveRequestDetail'>;

export const LeaveRequestDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation =
    useNavigation<NativeStackNavigationProp<LeaveStackParamList>>();
  const route = useRoute<DetailRoute>();
  const { id } = route.params;

  const dispatch = useAppDispatch();
  const detail          = useAppSelector(selectLeaveRequestDetailById(id));
  const fetchStatus     = useAppSelector(selectLeaveRequestDetailFetchStatus);
  const fetchError      = useAppSelector(selectLeaveRequestDetailFetchError);
  const cancelStatus    = useAppSelector(selectCancelStatus);
  const cancelError     = useAppSelector(selectCancelError);

  const reload = useCallback(() => {
    dispatch(fetchLeaveRequestDetail({ leaveRequestId: id }));
  }, [dispatch, id]);

  useEffect(() => {
    reload();
  }, [reload]);

  // After a successful cancel, close the screen.
  const prevCancelStatus = useRef(cancelStatus);
  useEffect(() => {
    if (prevCancelStatus.current === 'pending' && cancelStatus === 'idle') {
      navigation.goBack();
    }
    prevCancelStatus.current = cancelStatus;
  }, [cancelStatus, navigation]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      t('leave.detail.cancelConfirm.title'),
      t('leave.detail.cancelConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('leave.detail.cancelConfirm.confirm'),
          style: 'destructive',
          onPress: () => dispatch(cancelLeaveRequest({ leaveRequestId: id })),
        },
      ],
    );
  }, [dispatch, id, t]);

  const isLoading = fetchStatus === 'pending' && !detail;
  const isCancelling = cancelStatus === 'pending';

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      <View style={styles.navHeader}>
        <AppBackButton onPress={() => navigation.goBack()} />
        <AppText variant="title">{t('leave.detail.navTitle')}</AppText>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: hs(100) + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={fetchStatus === 'pending'}
            onRefresh={reload}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : !detail ? (
          <View style={styles.centerFill}>
            <AppText variant="label" color={theme.colors.mutedForeground} align="center">
              {fetchError?.message ?? t('leave.detail.notFound')}
            </AppText>
            <AppButton
              label={t('common.retry')}
              variant="outline"
              size="sm"
              onPress={reload}
            />
          </View>
        ) : (
          <>
            {/* Header card: type + status */}
            <View style={styles.headerCard}>
              <View style={styles.headerRow}>
                <View style={[styles.typeDot, { backgroundColor: detail.colorHex }]} />
                <AppText variant="cardTitle" weight="semibold" style={{ flex: 1 }}>
                  {pickLocalizedName(detail.leaveTypeName, detail.leaveTypeNameAr, i18n.language)}
                </AppText>
                <AppBadge
                  label={t(STATUS_I18N_KEY[detail.status])}
                  variant={STATUS_BADGE_VARIANT[detail.status]}
                />
              </View>
              <AppText variant="small" color={theme.colors.mutedForeground}>
                {formatDateRange(detail.startDate, detail.endDate)}
              </AppText>
              <AppText variant="small" color={theme.colors.mutedForeground}>
                {detail.totalDays === 1
                  ? t('leave.requests.durationDay')
                  : t('leave.requests.durationDays', { count: detail.totalDays })}
              </AppText>
            </View>

            {detail.hasAttendanceConflict && detail.conflictDetails && (
              <AppAlertBanner
                variant="warning"
                message={t('leave.detail.attendanceConflict', {
                  dates: detail.conflictDetails,
                })}
              />
            )}

            {/* Notes */}
            {detail.notes && (
              <>
                <AppText variant="bodyLg" weight="semibold">
                  {t('leave.detail.notes')}
                </AppText>
                <View style={styles.card}>
                  <AppText variant="small" style={styles.padded}>
                    {detail.notes}
                  </AppText>
                </View>
              </>
            )}

            {/* Review info */}
            {(detail.reviewerComment || detail.reviewedAt) && (
              <>
                <AppText variant="bodyLg" weight="semibold">
                  {t('leave.detail.review')}
                </AppText>
                <View style={styles.card}>
                  {detail.reviewedAt && (
                    <InfoRow
                      label={t('leave.detail.reviewedAt')}
                      value={formatDateTime(detail.reviewedAt)}
                      theme={theme}
                    />
                  )}
                  {detail.reviewerComment && (
                    <>
                      {detail.reviewedAt && <AppDivider />}
                      <View style={[styles.padded, { gap: hs(4) }]}>
                        <AppText variant="small" color={theme.colors.mutedForeground}>
                          {t('leave.detail.reviewerComment')}
                        </AppText>
                        <AppText variant="small">
                          {detail.reviewerComment}
                        </AppText>
                      </View>
                    </>
                  )}
                </View>
              </>
            )}

            {/* Meta */}
            <AppText variant="bodyLg" weight="semibold">
              {t('leave.detail.meta')}
            </AppText>
            <View style={styles.card}>
              <InfoRow
                label={t('leave.detail.createdAt')}
                value={formatDateTime(detail.createdAt)}
                theme={theme}
              />
              {detail.balanceAfterApproval !== null && (
                <>
                  <AppDivider />
                  <InfoRow
                    label={t('leave.detail.balanceAfterApproval')}
                    value={t('leave.detail.balanceDays', {
                      count: detail.balanceAfterApproval,
                    })}
                    theme={theme}
                  />
                </>
              )}
            </View>

            {cancelError && (
              <AppAlertBanner variant="error" message={cancelError.message} />
            )}
          </>
        )}
      </ScrollView>

      {detail?.status === 'Pending' && (
        <AppPermissionGate permission={Permissions.Leave.Cancel}>
          <View
            style={[
              styles.footer,
              {
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
                paddingBottom: hs(16) + insets.bottom,
              },
            ]}
          >
            <AppButton
              label={t('leave.detail.cancelButton')}
              variant="outline"
              fullWidth
              loading={isCancelling}
              onPress={handleCancel}
            />
          </View>
        </AppPermissionGate>
      )}
    </SafeAreaView>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
  theme: AppTheme;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, theme }) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: hs(12),
      paddingHorizontal: ws(16),
    }}
  >
    <AppText variant="small" color={theme.colors.mutedForeground}>{label}</AppText>
    <AppText variant="small" weight="medium">{value}</AppText>
  </View>
);

// ── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    navHeader: {
      height: hs(56),
      paddingHorizontal: ws(16),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(12),
    },
    navSpacer: {
      width: ws(32),
    },
    scroll: {
      paddingHorizontal: ws(20),
      gap: hs(12),
    },
    centerFill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: hs(12),
      paddingTop: hs(80),
    },
    card: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.m,
      overflow: 'hidden',
    },
    headerCard: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.m,
      padding: ws(16),
      gap: hs(6),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(10),
    },
    typeDot: {
      width: ws(12),
      height: ws(12),
      borderRadius: ws(6),
    },
    padded: {
      paddingHorizontal: ws(16),
      paddingVertical: hs(12),
    },
    footer: {
      paddingHorizontal: ws(20),
      paddingTop: hs(16),
      borderTopWidth: 1,
    },
  });

export default LeaveRequestDetailScreen;

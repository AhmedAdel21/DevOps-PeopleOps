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
import type { PermissionRequestStatus, PermissionType } from '@/domain/entities';
import { useAppDispatch, useAppSelector } from '@/presentation/store/hooks';
import {
  cancelPermissionRequest,
  fetchPermissionRequestDetail,
} from '@/presentation/store/slices';
import {
  selectCancelPermissionError,
  selectCancelPermissionStatus,
  selectPermissionRequestDetailById,
  selectPermissionRequestDetailFetchError,
  selectPermissionRequestDetailFetchStatus,
} from '@/presentation/store/selectors';
import type { LeaveStackParamList } from '@/presentation/navigation/types';
import { PERMISSION_TYPE_KEY } from './permission_type_picker_sheet';

// ── Date helpers (mirror leave_request_detail_screen) ───────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
};

// ── Permission visual lookups (kept local — mirrors leave_screen.tsx) ───────

const STATUS_BADGE_VARIANT: Record<
  PermissionRequestStatus,
  'success' | 'warning' | 'error' | 'neutral'
> = {
  Approved: 'success',
  Pending: 'warning',
  Rejected: 'error',
  Cancelled: 'neutral',
};

const STATUS_I18N_KEY: Record<PermissionRequestStatus, string> = {
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

// ── Screen ──────────────────────────────────────────────────────────────────

type DetailRoute = RouteProp<LeaveStackParamList, 'PermissionRequestDetail'>;

export const PermissionRequestDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation =
    useNavigation<NativeStackNavigationProp<LeaveStackParamList>>();
  const route = useRoute<DetailRoute>();
  const { id } = route.params;

  const dispatch = useAppDispatch();
  const detail        = useAppSelector(selectPermissionRequestDetailById(id));
  const fetchStatus   = useAppSelector(selectPermissionRequestDetailFetchStatus);
  const fetchError    = useAppSelector(selectPermissionRequestDetailFetchError);
  const cancelStatus  = useAppSelector(selectCancelPermissionStatus);
  const cancelError   = useAppSelector(selectCancelPermissionError);

  const reload = useCallback(() => {
    dispatch(fetchPermissionRequestDetail({ permissionRequestId: id }));
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
      t('leave.permissionDetail.cancelConfirm.title'),
      t('leave.permissionDetail.cancelConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('leave.permissionDetail.cancelConfirm.confirm'),
          style: 'destructive',
          onPress: () =>
            dispatch(cancelPermissionRequest({ permissionRequestId: id })),
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
        <AppText variant="title">{t('leave.permissionDetail.navTitle')}</AppText>
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
              {fetchError?.message ?? t('leave.permissionDetail.notFound')}
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
                <View
                  style={[
                    styles.typeDot,
                    { backgroundColor: getPermissionTypeColor(detail.permissionType, theme) },
                  ]}
                />
                <AppText variant="cardTitle" weight="semibold" style={{ flex: 1 }}>
                  {t(PERMISSION_TYPE_KEY[detail.permissionType])}
                </AppText>
                <AppBadge
                  label={t(STATUS_I18N_KEY[detail.status])}
                  variant={STATUS_BADGE_VARIANT[detail.status]}
                />
              </View>
              <AppText variant="small" color={theme.colors.mutedForeground}>
                {formatDate(detail.date)} · {detail.startTime} – {detail.endTime}
              </AppText>
              <AppText variant="small" color={theme.colors.mutedForeground}>
                {formatPermissionDuration(detail.durationMinutes, t)}
              </AppText>
            </View>

            {/* Notes intentionally omitted: BE doesn't expose them on the
                detail endpoint today, and the serializable slice doesn't
                carry the optional domain field through. Add a row here once
                the contract grows. */}

            {cancelError && (
              <AppAlertBanner variant="error" message={cancelError.message} />
            )}
          </>
        )}
      </ScrollView>

      {detail?.status === 'Pending' && (
        <AppPermissionGate permission={Permissions.PermissionRequest.Cancel}>
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
              label={t('leave.permissionDetail.cancelButton')}
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

export default PermissionRequestDetailScreen;

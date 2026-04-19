import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Image,
  I18nManager,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Link2,
  LogOut,
  X,
} from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppText, AppButton, AppCard } from '@/presentation/components/atoms';
import { AppAvatar, useDialog } from '@/presentation/components/molecules';
import { useAppDispatch, useAppSelector } from '@/presentation/store/hooks';
import { fetchAttendanceStatus, logout } from '@/presentation/store/slices';
import {
  selectAttendanceCurrent,
  selectCurrentUser,
  selectLogoutStatus,
} from '@/presentation/store/selectors';
import { authLog } from '@/core/logger';
import { useLanguage } from '@/presentation/localization/language_context';
import { DiKeys } from '@/core/keys/di.key';
import { ServiceLocator } from '@/di/service_locator';
import type { SlackOAuthRemoteDataSource } from '@/data/data_sources/slack/slack_oauth.remote_data_source';
import { LanguagePickerSheet } from './language_picker_sheet';

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const attendanceCurrent = useAppSelector(selectAttendanceCurrent);
  const logoutStatus = useAppSelector(selectLogoutStatus);

  const { language, changeLanguage } = useLanguage();
  const { showDialog } = useDialog();
  const [langSheetVisible, setLangSheetVisible] = useState(false);
  const [photoPreviewVisible, setPhotoPreviewVisible] = useState(false);
  const [photoPreviewFailed, setPhotoPreviewFailed] = useState(false);
  const photoPreviewOpacity = useRef(new Animated.Value(0)).current;
  const photoPreviewScale = useRef(new Animated.Value(0.96)).current;
  const photoPreviewTranslateY = useRef(new Animated.Value(24)).current;

  const [slackConnected, setSlackConnected] = useState(false);
  const [slackConnecting, setSlackConnecting] = useState(false);
  const [slackDisconnecting, setSlackDisconnecting] = useState(false);
  const slackDs = useRef(
    ServiceLocator.get<SlackOAuthRemoteDataSource>(
      DiKeys.SLACK_OAUTH_DATA_SOURCE,
    ),
  ).current;

  useEffect(() => {
    slackDs
      .getConnectionStatus()
      .then(connected => setSlackConnected(connected))
      .catch(e => {
        authLog.warn(
          'screen',
          'ProfileScreen: Slack status check failed on mount',
          e,
        );
      });
  }, [slackDs]);

  useEffect(() => {
    if (user && !attendanceCurrent) {
      dispatch(fetchAttendanceStatus());
    }
  }, [dispatch, user, attendanceCurrent]);

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith('devops-peopleops://slack-oauth/connected')) {
        setSlackConnected(true);
        setSlackConnecting(false);
      } else if (url.startsWith('devops-peopleops://slack-oauth/error')) {
        setSlackConnecting(false);
      }
    });
    return () => sub.remove();
  }, []);

  const handleConnectSlack = useCallback(async () => {
    try {
      setSlackConnecting(true);
      const authUrl = await slackDs.getAuthorizationUrl();

      // Open in an in-app browser (Chrome Custom Tabs on Android,
      // ASWebAuthenticationSession on iOS) instead of the system browser.
      // System browser gets hijacked by Slack's universal/app links —
      // the in-app browser doesn't trigger those and handles the redirect
      // back to our custom scheme cleanly.
      const available = await InAppBrowser.isAvailable();
      if (!available) {
        await Linking.openURL(authUrl);
        return;
      }

      const result = await InAppBrowser.openAuth(
        authUrl,
        'devops-peopleops://slack-oauth',
        {
          showTitle: false,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
          ephemeralWebSession: false,
        },
      );

      if (result.type !== 'success') {
        // User dismissed the browser — treat as cancellation.
        authLog.info(
          'screen',
          `ProfileScreen: Slack auth browser closed (type=${result.type})`,
        );
        return;
      }

      if (result.url.startsWith('devops-peopleops://slack-oauth/connected')) {
        setSlackConnected(true);
      } else if (
        result.url.startsWith('devops-peopleops://slack-oauth/error')
      ) {
        throw new Error('Slack OAuth returned an error');
      }
    } catch (e) {
      authLog.warn('screen', 'ProfileScreen: Slack connect flow failed', e);
      showDialog({
        title: t('common.error'),
        message: t('profile.slackConnect.errorToast'),
        confirmLabel: t('common.ok'),
        icon: CircleAlert,
        destructive: true,
      });
    } finally {
      setSlackConnecting(false);
    }
  }, [slackDs, t, showDialog]);

  const handleDisconnectSlack = useCallback(async () => {
    try {
      setSlackDisconnecting(true);
      await slackDs.disconnect();
      setSlackConnected(false);
    } catch (e) {
      authLog.warn('screen', 'ProfileScreen: Slack disconnect failed', e);
      showDialog({
        title: t('common.error'),
        message: t('profile.slackConnect.disconnectErrorToast'),
        confirmLabel: t('common.ok'),
        icon: CircleAlert,
        destructive: true,
      });
    } finally {
      setSlackDisconnecting(false);
    }
  }, [slackDs, t, showDialog]);

  const handleLogout = useCallback(() => {
    authLog.info('navigation', 'ProfileScreen logout button pressed');
    dispatch(logout());
  }, [dispatch]);

  const handleLanguageConfirm = useCallback(
    async (lng: string) => {
      setLangSheetVisible(false);
      await changeLanguage(lng);
    },
    [changeLanguage],
  );

  const profileDisplayName =
    attendanceCurrent?.displayName ?? user?.displayName ?? t('common.unknown');
  const profileEmail = user?.email ?? t('common.unknown');
  const profileAvatarUrl =
    attendanceCurrent?.avatarUrl ?? user?.photoUrl ?? null;
  const profileDepartment =
    attendanceCurrent?.departmentName ?? t('common.unknown');
  const profileSlackId = attendanceCurrent?.employeeId ?? t('common.unknown');
  const hasPhotoPreview = Boolean(profileAvatarUrl && !photoPreviewFailed);

  const closePhotoPreview = useCallback(() => {
    Animated.parallel([
      Animated.timing(photoPreviewOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(photoPreviewScale, {
        toValue: 0.96,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(photoPreviewTranslateY, {
        toValue: 24,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPhotoPreviewVisible(false);
    });
  }, [photoPreviewOpacity, photoPreviewScale, photoPreviewTranslateY]);

  useEffect(() => {
    if (!photoPreviewVisible) {
      return;
    }

    photoPreviewOpacity.setValue(0);
    photoPreviewScale.setValue(0.96);
    photoPreviewTranslateY.setValue(24);

    Animated.parallel([
      Animated.timing(photoPreviewOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(photoPreviewScale, {
        toValue: 1,
        damping: 16,
        stiffness: 180,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(photoPreviewTranslateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    photoPreviewVisible,
    photoPreviewOpacity,
    photoPreviewScale,
    photoPreviewTranslateY,
  ]);

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
      >
        <AppText variant="display">{t('tabs.profile')}</AppText>

        <AppCard style={styles.profileHeroCard}>
          <View style={styles.profileHeroTop}>
            <Pressable
              onPress={() => {
                if (hasPhotoPreview) {
                  setPhotoPreviewFailed(false);
                  setPhotoPreviewVisible(true);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={t('profile.photoPreview.hint')}
              hitSlop={6}
            >
              <AppAvatar
                name={profileDisplayName}
                imageUrl={profileAvatarUrl}
                size="lg"
                style={styles.profileAvatar}
              />
            </Pressable>
            <View style={styles.profileIdentityWrap}>
              <AppText variant="subtitle">{profileDisplayName}</AppText>
              <AppText variant="caption" color={theme.colors.mutedForeground}>
                {profileEmail}
              </AppText>
              {hasPhotoPreview ? (
                <AppText variant="small" color={theme.colors.secondary}>
                  {t('profile.photoPreview.hint')}
                </AppText>
              ) : null}
            </View>
          </View>

          <View style={styles.departmentPill}>
            <AppText variant="small" color={theme.colors.secondary}>
              {t('profile.fields.department')}: {profileDepartment}
            </AppText>
          </View>
        </AppCard>

        <AppCard title={t('profile.accountDetailsTitle')}>
          <View style={styles.row}>
            <AppText variant="caption" color={theme.colors.mutedForeground}>
              {t('profile.fields.fullName')}
            </AppText>
            <AppText variant="body">{profileDisplayName}</AppText>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <AppText variant="caption" color={theme.colors.mutedForeground}>
              {t('profile.fields.email')}
            </AppText>
            <AppText variant="body">{profileEmail}</AppText>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <AppText variant="caption" color={theme.colors.mutedForeground}>
              {t('profile.fields.department')}
            </AppText>
            <AppText variant="body">{profileDepartment}</AppText>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <AppText variant="caption" color={theme.colors.mutedForeground}>
              {t('profile.fields.slackId')}
            </AppText>
            <AppText variant="body">{profileSlackId}</AppText>
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.row}>
            <AppText variant="caption" color={theme.colors.mutedForeground}>
              {t('profile.preferencesTitle')}
            </AppText>
          </View>

          <View style={styles.divider} />

          <Pressable
            style={styles.langRow}
            onPress={
              slackConnected ? handleDisconnectSlack : handleConnectSlack
            }
            disabled={slackConnecting || slackDisconnecting}
            hitSlop={4}
          >
            <View style={styles.slackRowLeft}>
              <Link2
                size={ws(18)}
                color={
                  slackConnected ? '#4A154B' : theme.colors.mutedForeground
                }
              />
              <AppText variant="body">
                {slackDisconnecting
                  ? t('profile.slackConnect.disconnecting')
                  : slackConnected
                  ? t('profile.slackConnect.connected')
                  : slackConnecting
                  ? t('profile.slackConnect.connecting')
                  : t('profile.slackConnect.row')}
              </AppText>
            </View>
            {slackConnected ? (
              <CheckCircle size={ws(18)} color={theme.colors.primary} />
            ) : I18nManager.isRTL ? (
              <ChevronLeft size={ws(18)} color={theme.colors.mutedForeground} />
            ) : (
              <ChevronRight
                size={ws(18)}
                color={theme.colors.mutedForeground}
              />
            )}
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.langRow}
            onPress={() => setLangSheetVisible(true)}
            hitSlop={4}
          >
            <AppText variant="body">{t('profile.languageRow')}</AppText>
            <View style={styles.langRight}>
              <AppText variant="body" color={theme.colors.mutedForeground}>
                {language.toUpperCase()}
              </AppText>
              {I18nManager.isRTL ? (
                <ChevronLeft
                  size={ws(18)}
                  color={theme.colors.mutedForeground}
                />
              ) : (
                <ChevronRight
                  size={ws(18)}
                  color={theme.colors.mutedForeground}
                />
              )}
            </View>
          </Pressable>
        </AppCard>

        <AppButton
          label={t('auth.logout')}
          onPress={handleLogout}
          loading={logoutStatus === 'pending'}
          disabled={logoutStatus === 'pending'}
          variant="outlineDestructive"
          leftIcon={LogOut}
          fullWidth
        />
      </ScrollView>

      <LanguagePickerSheet
        visible={langSheetVisible}
        currentLanguage={language}
        onClose={() => setLangSheetVisible(false)}
        onConfirm={handleLanguageConfirm}
      />

      <Modal
        visible={photoPreviewVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closePhotoPreview}
      >
        <Animated.View
          style={[
            styles.photoPreviewBackdrop,
            { opacity: photoPreviewOpacity },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closePhotoPreview}
          />
          <Animated.View
            style={[
              styles.photoPreviewCard,
              {
                transform: [
                  { translateY: photoPreviewTranslateY },
                  { scale: photoPreviewScale },
                ],
              },
            ]}
          >
            <View style={styles.photoPreviewHeader}>
              <AppText variant="label" color={theme.colors.primaryForeground}>
                {profileDisplayName}
              </AppText>
              <Pressable
                style={styles.photoCloseButton}
                onPress={closePhotoPreview}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('profile.photoPreview.close')}
              >
                <X size={ws(18)} color={theme.colors.primaryForeground} />
              </Pressable>
            </View>

            {profileAvatarUrl ? (
              <ScrollView
                style={styles.photoZoomScroll}
                contentContainerStyle={styles.photoZoomContent}
                minimumZoomScale={1}
                maximumZoomScale={3}
                centerContent
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                <Image
                  source={{ uri: profileAvatarUrl }}
                  style={styles.photoPreviewImage}
                  resizeMode="contain"
                  onError={() => setPhotoPreviewFailed(true)}
                />
              </ScrollView>
            ) : null}
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      paddingHorizontal: ws(24),
      paddingVertical: hs(24),
      gap: theme.spacing.l,
    },
    row: {
      gap: theme.spacing.xs,
    },
    profileHeroCard: {
      backgroundColor: theme.colors.primaryLight,
      borderColor: theme.colors.primary,
    },
    profileHeroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.m,
    },
    profileAvatar: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    profileIdentityWrap: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    departmentPill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius.l,
      paddingHorizontal: ws(10),
      paddingVertical: hs(6),
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: hs(4),
    },
    langRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: hs(4),
    },
    langRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(4),
    },
    slackRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(8),
    },
    photoPreviewBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(7, 14, 35, 0.86)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: ws(16),
    },
    photoPreviewCard: {
      width: '100%',
      maxWidth: ws(420),
      maxHeight: '86%',
      borderRadius: theme.radius.l,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      backgroundColor: '#0B1220',
      overflow: 'hidden',
    },
    photoPreviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ws(12),
      paddingVertical: hs(10),
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.14)',
    },
    photoCloseButton: {
      width: ws(34),
      height: ws(34),
      borderRadius: ws(17),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    photoZoomScroll: {
      width: '100%',
    },
    photoZoomContent: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: hs(420),
      padding: ws(12),
    },
    photoPreviewImage: {
      width: ws(320),
      height: hs(420),
    },
  });

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, ToastAndroid, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ChevronRight, Link2, LogOut } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppText,
  AppButton,
  AppCard,
} from '@/presentation/components/atoms';
import {
  useAppDispatch,
  useAppSelector,
} from '@/presentation/store/hooks';
import { logout } from '@/presentation/store/slices';
import {
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
  const logoutStatus = useAppSelector(selectLogoutStatus);

  const { language, changeLanguage } = useLanguage();
  const [langSheetVisible, setLangSheetVisible] = useState(false);

  // ── Slack Connect ────────────────────────────────────────────────────────
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackConnecting, setSlackConnecting] = useState(false);
  const slackDs = useRef(
    ServiceLocator.get<SlackOAuthRemoteDataSource>(DiKeys.SLACK_OAUTH_DATA_SOURCE),
  ).current;

  // Listen for the deep-link fired by the backend callback redirect.
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
      await Linking.openURL(authUrl);
    } catch {
      setSlackConnecting(false);
      ToastAndroid.show(t('profile.slackConnect.errorToast'), ToastAndroid.SHORT);
    }
  }, [slackDs, t]);

  // Dispatch logout only — the auth observer will flip authStatus to
  // unauthenticated, and RootNavigation's watcher will reset the stack
  // back to Login automatically.
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

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
      >
        <AppText variant="display">{t('tabs.profile')}</AppText>

        <AppCard>
          <View style={styles.row}>
            <AppText
              variant="caption"
              color={theme.colors.mutedForeground}
            >
              {t('auth.loginScreen.emailLabel')}
            </AppText>
            <AppText variant="body">
              {user?.email ?? user?.displayName ?? '—'}
            </AppText>
          </View>

          <View style={styles.divider} />

          {/* Slack connect row */}
          <Pressable
            style={styles.langRow}
            onPress={slackConnected ? undefined : handleConnectSlack}
            disabled={slackConnecting}
            hitSlop={4}
          >
            <View style={styles.slackRowLeft}>
              <Link2 size={ws(18)} color={slackConnected ? '#4A154B' : theme.colors.mutedForeground} />
              <AppText variant="body">
                {slackConnected
                  ? t('profile.slackConnect.connected')
                  : slackConnecting
                    ? t('profile.slackConnect.connecting')
                    : t('profile.slackConnect.row')}
              </AppText>
            </View>
            {slackConnected ? (
              <CheckCircle size={ws(18)} color={theme.colors.primary} />
            ) : (
              <ChevronRight size={ws(18)} color={theme.colors.mutedForeground} />
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
              <ChevronRight
                size={ws(18)}
                color={theme.colors.mutedForeground}
              />
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
  });

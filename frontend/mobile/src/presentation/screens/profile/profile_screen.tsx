import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LogOut, ChevronRight } from 'lucide-react-native';
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
  });

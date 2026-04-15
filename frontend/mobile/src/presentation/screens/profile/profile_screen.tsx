import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react-native';
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

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const logoutStatus = useAppSelector(selectLogoutStatus);

  // Dispatch logout only — the auth observer will flip authStatus to
  // unauthenticated, and RootNavigation's watcher will reset the stack
  // back to Login automatically.
  const handleLogout = useCallback(() => {
    authLog.info('navigation', 'ProfileScreen logout button pressed');
    dispatch(logout());
  }, [dispatch]);

  return (
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
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
  });

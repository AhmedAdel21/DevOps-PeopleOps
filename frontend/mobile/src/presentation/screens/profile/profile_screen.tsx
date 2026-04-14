import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';
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
import { navigationRef } from '@/presentation/navigation/navigation_ref';
import { authLog } from '@/core/logger';

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const logoutStatus = useAppSelector(selectLogoutStatus);

  const handleLogout = useCallback(async () => {
    authLog.info('navigation', 'ProfileScreen logout button pressed');
    const result = await dispatch(logout());
    if (logout.fulfilled.match(result) && navigationRef.isReady()) {
      authLog.info('navigation', 'ProfileScreen resetting stack → Login');
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        }),
      );
    }
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

import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppText } from '@/presentation/components/atoms';
import { AppLogo } from '@/presentation/components/molecules';

export interface SplashScreenProps {
  /** Called when the splash is done (e.g. after branding delay or session restore). */
  onReady?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onReady }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onReady?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.logoShell}>
          <AppLogo width={148} height={148} />
        </View>

        <View style={styles.brandTextWrap}>
          <AppText
            variant="title"
            align="center"
            color={theme.colors.foreground}
          >
            DevopTime
          </AppText>
          <AppText
            variant="body"
            align="center"
            color={theme.colors.mutedForeground}
          >
            {t('auth.splash.tagline')}
          </AppText>
        </View>

        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <AppText variant="label" color={theme.colors.mutedForeground}>
            {t('common.loading')}
          </AppText>
        </View>
      </View>

      <AppText
        variant="small"
        color={theme.colors.mutedForeground}
        align="center"
        style={styles.versionText}
      >
        {t('auth.splash.version')}
      </AppText>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      paddingHorizontal: ws(24),
      paddingVertical: hs(20),
    },
    centerContent: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      gap: hs(20),
    },
    logoShell: {
      width: ws(182),
      height: ws(182),
      borderRadius: ws(30),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    brandTextWrap: {
      width: '100%',
      alignItems: 'center',
      gap: hs(6),
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(8),
      paddingHorizontal: ws(12),
      paddingVertical: hs(6),
      borderRadius: theme.radius.l,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    versionText: {
      marginBottom: hs(12),
    },
  });

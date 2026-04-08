import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@themes/theme_context';
import { useLanguage } from '@/presentation/localization/language_context';
import type { AppTheme } from '@themes/light.theme';

export const PlaceholderScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DEVOPSolution</Text>
      <Text style={styles.subtitle}>HR Platform</Text>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: theme.typography.sizes.display,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.secondary,
    },
    subtitle: {
      fontSize: theme.typography.sizes.heading,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.primary,
      marginTop: 8,
    },
  });

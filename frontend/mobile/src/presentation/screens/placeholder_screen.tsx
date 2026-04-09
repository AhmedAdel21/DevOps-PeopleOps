import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@themes/theme_context';
import { useLanguage } from '@/presentation/localization/language_context';
import type { AppTheme } from '@themes/index';
import { Mail, Lock, Eye } from 'lucide-react-native';
export const PlaceholderScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={{ alignItems: 'center', marginTop: 24, gap: 12 }}>
      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: theme.colors.foreground }}>
        Inter Regular — the quick brown fox
      </Text>
      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: theme.colors.foreground }}>
        Inter Medium — the quick brown fox
      </Text>
      <Text style={{
        fontFamily: 'Inter-SemiBold', fontSize: 16, color: theme.colors.foreground
      }}>
        Inter SemiBold — the quick brown fox
      </Text>
      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: theme.colors.foreground }}>
        Inter Bold — the quick brown fox
      </Text>

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
        <Mail size={24} color={theme.colors.primary} />
        <Lock size={24} color={theme.colors.primary} />
        <Eye size={24} color={theme.colors.primary} />
      </View>
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

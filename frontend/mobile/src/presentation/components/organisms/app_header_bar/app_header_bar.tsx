import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppAvatar } from '@/presentation/components/molecules';
import { AppText } from '@/presentation/components/atoms';

export interface AppHeaderBarProps {
  /** Full name shown as initials in the avatar. */
  userName: string;
  avatarUrl?: string | null;
  onAvatarPress?: () => void;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
}

export const AppHeaderBar: React.FC<AppHeaderBarProps> = ({
  userName,
  avatarUrl,
  onAvatarPress,
  title,
  subtitle,
  style,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  return (
    <View style={[styles.bar, style]}>
      <Pressable
        onPress={onAvatarPress}
        hitSlop={8}
        disabled={!onAvatarPress}
        accessibilityRole="button"
        accessibilityLabel="profile"
      >
        <AppAvatar
          name={userName}
          imageUrl={avatarUrl}
          size="md"
          backgroundColor={theme.colors.primary}
          textColor={theme.colors.primaryForeground}
        />
      </Pressable>

      {(title || subtitle) && (
        <View style={styles.textColumn}>
          {title && (
            <AppText
              variant="subtitle"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </AppText>
          )}
          {subtitle && (
            <AppText
              variant="caption"
              color={theme.colors.mutedForeground}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </AppText>
          )}
        </View>
      )}
    </View>
  );
};

const buildStyles = (theme: AppTheme) =>
  StyleSheet.create({
    bar: {
      width: '100%',
      paddingHorizontal: ws(20),
      paddingVertical: hs(8),
      marginTop: hs(16),
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.m,
    },
    textColumn: {
      flex: 1,
      gap: hs(2),
    },
  });

import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppText } from '../app_text';

export type AppBadgeVariant =
    | 'neutral'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error';

export interface AppBadgeProps {
    label: string;
    variant?: AppBadgeVariant;
    style?: ViewStyle;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
    label,
    variant = 'neutral',
    style,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => buildStyles(theme), [theme]);
    const palette = resolvePalette(theme, variant);

    return (
        <View style={[styles.base, { backgroundColor: palette.bg }, style]}>
            <AppText variant="small" color={palette.fg} weight="medium">
                {label}
            </AppText>
        </View>
    );
};

const resolvePalette = (
    theme: AppTheme,
    variant: AppBadgeVariant,
): { bg: string; fg: string } => {
    switch (variant) {
        case 'primary':
            return { bg: theme.colors.primaryLight, fg: theme.colors.primary };
        case 'secondary':
            return { bg: theme.colors.secondaryLight, fg: theme.colors.secondary };
        case 'success':
            return {
                bg: theme.colors.status.success.light,
                fg: theme.colors.status.success.foreground,
            };
        case 'warning':
            return {
                bg: theme.colors.status.warning.light,
                fg: theme.colors.status.warning.foreground,
            };
        case 'error':
            return {
                bg: theme.colors.status.error.light,
                fg: theme.colors.status.error.foreground,
            };
        case 'neutral':
        default:
            return { bg: theme.colors.muted, fg: theme.colors.mutedForeground };
    }
};

const buildStyles = (theme: AppTheme) =>
    StyleSheet.create({
        base: {
            alignSelf: 'flex-start',
            borderRadius: theme.radius.pill,
            paddingVertical: hs(4),
            paddingHorizontal: ws(12),
        },
    });

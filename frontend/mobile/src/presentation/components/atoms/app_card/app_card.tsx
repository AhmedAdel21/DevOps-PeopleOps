import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle, ViewProps } from 'react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { AppText } from '../app_text';

export interface AppCardProps extends ViewProps {
    title?: string;
    description?: string;
    contentStyle?: ViewStyle;
    children?: React.ReactNode;
}

export const AppCard: React.FC<AppCardProps> = ({
    title,
    description,
    style,
    contentStyle,
    children,
    ...rest
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => buildStyles(theme), [theme]);

    return (
        <View style={[styles.card, style]} {...rest}>
            {(title || description) && (
                <View style={styles.header}>
                    {title ? (
                        <AppText variant="cardTitle" color={theme.colors.cardForeground}>
                            {title}
                        </AppText>
                    ) : null}
                    {description ? (
                        <AppText variant="caption" color={theme.colors.mutedForeground}>
                            {description}
                        </AppText>
                    ) : null}
                </View>
            )}

            <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
    );
};

const buildStyles = (theme: AppTheme) =>
    StyleSheet.create({
        card: {
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.m,
            padding: theme.spacing.l,
            gap: theme.spacing.m,
        },
        header: {
            gap: theme.spacing.xs,
        },
        content: {
            gap: theme.spacing.m,
        },
    });
import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import {
    CircleAlert,
    CircleCheck,
    Info,
    TriangleAlert,
    type LucideIcon,
} from 'lucide-react-native';
import { useTheme, type AppTheme, type StatusColor } from '@themes/index';
import { ws } from '@/presentation/utils/scaling';
import { AppText } from '../app_text';

export type AppAlertVariant = 'error' | 'warning' | 'success' | 'info';


export interface AppAlertBannerProps {
    variant: AppAlertVariant;
    message: string;
    icon?: LucideIcon;
    style?: ViewStyle;
}

const defaultIcon: Record<AppAlertVariant, LucideIcon> = {
    error: CircleAlert,
    warning: TriangleAlert,
    success: CircleCheck,
    info: Info,
};

export const AppAlertBanner: React.FC<AppAlertBannerProps> = ({
    variant,
    message,
    icon,
    style,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => buildStyles(theme), [theme]);

    const palette: StatusColor = theme.colors.status[variant];
    const Icon = icon ?? defaultIcon[variant];

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: palette.light },
                style,
            ]}
        >
            <Icon size={ws(18)} color={palette.base} />
            <AppText
                variant="caption"
                color={palette.foreground}
                weight="medium"
                style={styles.message}
            >
                {message}
            </AppText>
        </View>
    );
};

const buildStyles = (theme: AppTheme) =>
    StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: ws(10),
            paddingHorizontal: ws(14),
            paddingVertical: ws(12),
            borderRadius: theme.radius.m,
        },
        message: {
            flex: 1,
        },
    });
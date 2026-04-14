import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { ws } from '@/presentation/utils/scaling';
import { AppText, type AppTextVariant } from '@/presentation/components/atoms';

export type AppAvatarSize = 'sm' | 'md' | 'lg';

export interface AppAvatarProps {
    /** Full name or initials. If a full name is provided, the first two
     *  word-initials are extracted. */
    name: string;
    size?: AppAvatarSize;
    /** Override background color (defaults to theme.colors.secondary). */
    backgroundColor?: string;
    /** Override text color (defaults to theme.colors.secondaryForeground). */
    textColor?: string;
    style?: ViewStyle;
}

const SIZE_MAP: Record<AppAvatarSize, { diameter: number; textVariant: AppTextVariant }> = {
    sm: { diameter: 32, textVariant: 'caption' },
    md: { diameter: 40, textVariant: 'label' },
    lg: { diameter: 56, textVariant: 'subtitle' },
};

export const AppAvatar: React.FC<AppAvatarProps> = ({
    name,
    size = 'md',
    backgroundColor,
    textColor,
    style,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => buildStyles(theme), [theme]);
    const { diameter, textVariant } = SIZE_MAP[size];
    const px = ws(diameter);
    const initials = getInitials(name);

    return (
        <View
            style={[
                styles.base,
                {
                    width: px,
                    height: px,
                    borderRadius: px / 2,
                    backgroundColor: backgroundColor ?? theme.colors.secondary,
                },
                style,
            ]}
        >
            <AppText
                variant={textVariant}
                color={textColor ?? theme.colors.secondaryForeground}
                weight="semibold"
            >
                {initials}
            </AppText>
        </View>
    );
};

const getInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const parts = trimmed.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
};

const buildStyles = (_theme: AppTheme) =>
    StyleSheet.create({
        base: {
            alignItems: 'center',
            justifyContent: 'center',
        },
    });

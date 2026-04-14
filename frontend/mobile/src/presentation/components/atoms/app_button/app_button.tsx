import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View,
    ViewStyle,
    PressableProps,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { ws, hs } from '@/presentation/utils/scaling';
import { AppText, type AppTextVariant } from '../app_text';

export type AppButtonVariant =
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'outlineDestructive'
    | 'ghost'
    | 'destructive';

export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends Omit<PressableProps, 'style' | 'children'> {
    label: string;
    onPress?: () => void;
    variant?: AppButtonVariant;
    size?: AppButtonSize;
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
}

export const AppButton: React.FC<AppButtonProps> = ({
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
    ...rest
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => buildStyles(theme), [theme]);

    const containerStyle = [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
    ];

    const textColor = resolveTextColor(theme, variant);
    const textVariant: AppTextVariant = size === 'sm' ? 'caption' : size === 'lg' ? 'bodyLg' : 'label';
    const iconSize = size === 'sm' ? ws(14) : size === 'lg' ? ws(20) : ws(18);

    return (
        <Pressable
            onPress={loading || disabled ? undefined : onPress}
            style={({ pressed }) => [containerStyle, pressed && !disabled && !loading && styles.pressed]}
            disabled={disabled || loading} {...rest}>
            {loading ? (
                <ActivityIndicator size="small" color={textColor} />
            ) : (
                <View style={styles.content}>
                    {LeftIcon ? <LeftIcon size={iconSize} color={textColor} /> : null}
                    <AppText variant={textVariant} color={textColor} weight="medium">
                        {label}
                    </AppText>
                    {RightIcon ? <RightIcon size={iconSize} color={textColor} /> : null}
                </View>
            )}
        </Pressable>
    );
};

const resolveTextColor = (theme: AppTheme, variant: AppButtonVariant): string => {
    switch (variant) {
        case 'primary': return theme.colors.primaryForeground;
        case 'secondary': return theme.colors.secondaryForeground;
        case 'outline': return theme.colors.foreground;
        case 'outlineDestructive': return theme.colors.destructive;
        case 'ghost': return theme.colors.foreground;
        case 'destructive': return theme.colors.destructiveForeground;
    }
};

const buildStyles = (theme: AppTheme) =>
    StyleSheet.create({
        base: {
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor: 'transparent',
        },
        content: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.s,
        },
        fullWidth: { alignSelf: 'stretch' },
        pressed: { opacity: 0.85 },
        disabled: { opacity: 0.5 },

        // sizes
        sm: { paddingVertical: hs(6), paddingHorizontal: ws(12) },
        md: { paddingVertical: hs(10), paddingHorizontal: ws(20) },
        lg: { paddingVertical: hs(12), paddingHorizontal: ws(24) },

        // variants
        primary: {
            backgroundColor: theme.colors.primary,
        },
        secondary: {
            backgroundColor: theme.colors.secondary,
        },
        outline: {
            backgroundColor: 'transparent',
            borderColor: theme.colors.borderStrong,
        },
        outlineDestructive: {
            backgroundColor: 'transparent',
            borderColor: theme.colors.destructive,
        },
        ghost: {
            backgroundColor: 'transparent',
        },
        destructive: {
            backgroundColor: theme.colors.destructive,
        },
    });

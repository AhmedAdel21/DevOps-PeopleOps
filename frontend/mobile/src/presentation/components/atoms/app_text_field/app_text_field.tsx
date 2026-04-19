import React, { useMemo, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from 'react-native';
import { CircleAlert, type LucideIcon } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppText } from '../app_text';

export interface AppTextFieldProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    onRightIconPress?: () => void;
    disabled?: boolean;
    containerStyle?: ViewStyle;
}

export const AppTextField: React.FC<AppTextFieldProps> = ({
    label,
    error,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    onRightIconPress,
    disabled = false,
    containerStyle,
    onFocus,
    onBlur,
    ...textInputProps
}) => {
    const { theme } = useTheme();
    const [focused, setFocused] = useState(false);
    const styles = useMemo(() => buildStyles(theme), [theme]);

    const borderColor = error
        ? theme.colors.status.error.base
        : focused
            ? theme.colors.primary
            : theme.colors.border;

    const iconColor = error
        ? theme.colors.status.error.base
        : theme.colors.mutedForeground;

    return (
        <View style={[styles.container, containerStyle]}>
            {label ? (
                <AppText variant="label" color={theme.colors.foreground}>
                    {label}
                </AppText>
            ) : null}

            <View
                style={[
                    styles.field,
                    { borderColor },
                    disabled && styles.fieldDisabled,
                ]}
            >
                {LeftIcon ? (
                    <LeftIcon size={ws(18)} color={iconColor} style={styles.leftIcon} />
                ) : null}

                <TextInput
                    style={[
                        styles.input,
                        { color: theme.colors.foreground },
                        disabled && styles.inputDisabled,
                    ]}
                    placeholderTextColor={theme.colors.mutedForeground}
                    editable={!disabled}
                    onFocus={(e) => {
                        setFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    {...textInputProps}
                />

                {RightIcon ? (
                    <Pressable
                        onPress={onRightIconPress}
                        hitSlop={8}
                        disabled={!onRightIconPress}
                        style={styles.rightIcon}
                    >
                        <RightIcon size={ws(18)} color={iconColor} />
                    </Pressable>
                ) : null}
            </View>

            {error ? (
                <View style={styles.errorRow}>
                    <CircleAlert size={ws(14)} color={theme.colors.status.error.base} />
                    <AppText
                        variant="small"
                        color={theme.colors.status.error.base}
                        weight="medium"
                    >
                        {error}
                    </AppText>
                </View>
            ) : null}
        </View>
    );
};

const buildStyles = (theme: AppTheme) =>
    StyleSheet.create({
        container: {
            gap: hs(6),
        },
        field: {
            flexDirection: 'row',
            alignItems: 'center',
            height: hs(50),
            backgroundColor: theme.colors.input,
            borderWidth: 1,
            borderRadius: theme.radius.m,
            paddingHorizontal: theme.spacing.m - ws(4),
        },
        fieldDisabled: {
            backgroundColor: theme.colors.muted,
            opacity: 0.6,
        },
        input: {
            flex: 1,
            height: '100%',
            fontSize: theme.typography.sizes.base,
            fontFamily: theme.typography.fontFamily.regular,
            includeFontPadding: true,
        },
        inputDisabled: {
            color: theme.colors.mutedForeground,
        },
        leftIcon: {
            marginEnd: theme.spacing.s,
        },
        rightIcon: {
            marginStart: theme.spacing.s,
            padding: ws(2),
        },
        errorRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: ws(6),
            marginTop: hs(2),
        },
    });


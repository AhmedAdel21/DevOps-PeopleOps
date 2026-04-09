import React, { useMemo, useRef, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    TextInput,
    View,
    ViewStyle,
} from 'react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppText } from '../../atoms/app_text';


export interface AppOtpInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    length?: number;
    error?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export const AppOtpInput: React.FC<AppOtpInputProps> = ({
    value,
    onChange,
    onComplete,
    length = 6,
    error = false,
    autoFocus = true,
    disabled = false,
    style,
}) => {
    const { theme } = useTheme();
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const styles = useMemo(() => buildStyles(theme), [theme]);

    const handleChange = (next: string) => {
        const sanitized = next.replace(/\D/g, '').slice(0, length);
        onChange(sanitized);
        if (sanitized.length === length) {
            onComplete?.(sanitized);
        }
    };

    const focusInput = () => inputRef.current?.focus();

    const cells = Array.from({ length }, (_, i) => {
        const char = value[i] ?? '';
        const isActive = focused && i === value.length;
        const isFilled = Boolean(char);

        const borderColor = error
            ? theme.colors.status.error.base
            : isActive
                ? theme.colors.primary
                : isFilled
                    ? theme.colors.borderStrong
                    : theme.colors.border;

        const borderWidth = isActive || error ? 2 : 1;

        return (
            <View
                key={i}
                style={[
                    styles.cell,
                    { borderColor, borderWidth },
                    disabled && styles.cellDisabled,
                ]}
            >
                <AppText variant="title" color={theme.colors.foreground}>
                    {char}
                </AppText>
            </View>
        );
    });

    return (
        <Pressable onPress={focusInput} style={[styles.container, style]} disabled={disabled}>
            <View style={styles.row}>{cells}</View>

            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={handleChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={length}
                autoFocus={autoFocus}
                editable={!disabled}
                caretHidden
                style={styles.hiddenInput}
            />
        </Pressable>
    );
};

const buildStyles = (theme: AppTheme) =>
    StyleSheet.create({
        container: {
            alignSelf: 'stretch',
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: theme.spacing.s,
        },
        cell: {
            flex: 1,
            height: hs(56),
            maxWidth: ws(52),
            backgroundColor: theme.colors.input,
            borderRadius: theme.radius.m,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cellDisabled: {
            opacity: 0.5,
        },
        hiddenInput: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0,
        },
    });

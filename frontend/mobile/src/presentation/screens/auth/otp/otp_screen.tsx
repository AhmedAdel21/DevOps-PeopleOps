import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
    AppAlertBanner,
    AppText,
    AppBackButton,
    AppButton,
} from '@/presentation/components/atoms';
import { AppOtpInput } from '@/presentation/components/molecules';

type OtpStatus = 'idle' | 'submitting' | 'wrong' | 'expired';

const RESEND_SECONDS = 60;

export interface OtpScreenProps {
    email: string;
    onVerify?: (code: string) => void;
    onResend?: () => void;
    onBack?: () => void;
}

export const OtpScreen: React.FC<OtpScreenProps> = ({
    email,
    onVerify,
    onResend,
    onBack,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [code, setCode] = useState('');
    const [status, setStatus] = useState<OtpStatus>('idle');
    const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isExpired = status === 'expired';
    const isWrong = status === 'wrong';
    const isSubmitting = status === 'submitting';
    const canResend = secondsLeft <= 0 && !isExpired;

    // --- Countdown timer ---
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatTime = (secs: number): string => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // --- Handlers ---
    const handleVerify = useCallback(() => {
        if (code.length < 6) return;
        setStatus('submitting');
        onVerify?.(code);
    }, [code, onVerify]);

    const handleResend = useCallback(() => {
        setCode('');
        setStatus('idle');
        setSecondsLeft(RESEND_SECONDS);
        // Restart the timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        onResend?.();
    }, [onResend]);

    const handleCodeChange = useCallback(
        (value: string) => {
            setCode(value);
            if (isWrong) setStatus('idle');
        },
        [isWrong],
    );

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Back button */}
                <AppBackButton onPress={onBack ?? (() => { })} style={styles.backButton} />

                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.headerGroup}>
                        <AppText variant="display" align="center">
                            {t('auth.otp.title')}
                        </AppText>
                        <AppText
                            variant="body"
                            align="center"
                            color={theme.colors.mutedForeground}
                        >
                            {t('auth.otp.sentTo')}{' '}
                            <AppText variant="bodyMedium" color={theme.colors.primary}>
                                {email}
                            </AppText>
                        </AppText>
                    </View>

                    {/* Expired banner */}
                    {isExpired && (
                        <AppAlertBanner
                            variant="warning"
                            message={t('auth.otp.errors.expired')}
                            style={styles.banner}
                        />
                    )}

                    {/* OTP cells */}
                    <AppOtpInput
                        value={code}
                        onChange={handleCodeChange}
                        onComplete={handleVerify}
                        error={isWrong}
                        disabled={isExpired}
                        autoFocus
                    />

                    {/* Error text (wrong code) */}
                    {isWrong && (
                        <AppText
                            variant="small"
                            color={theme.colors.status.error.base}
                            weight="medium"
                            align="center"
                        >
                            {t('auth.otp.errors.wrongCode')}
                        </AppText>
                    )}

                    {/* Resend row */}
                    <View style={styles.resendRow}>
                        {secondsLeft > 0 && !isExpired ? (
                            <AppText variant="caption" color={theme.colors.mutedForeground}>
                                {t('auth.otp.resendIn', { time: formatTime(secondsLeft) })}
                            </AppText>
                        ) : (
                            <Pressable onPress={handleResend} hitSlop={8}>
                                <AppText variant="caption" color={theme.colors.primary} weight="medium">
                                    {t('auth.otp.resendNow')}
                                </AppText>
                            </Pressable>
                        )}
                    </View>

                    {/* Verify button */}
                    <AppButton
                        label={t('auth.otp.verify')}
                        onPress={handleVerify}
                        loading={isSubmitting}
                        disabled={code.length < 6 || isExpired}
                        fullWidth
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const createStyles = (theme: AppTheme) =>
    StyleSheet.create({
        flex: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: ws(24),
            paddingVertical: hs(20),
        },
        backButton: {
            marginBottom: hs(8),
        },
        content: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.l,
        },
        headerGroup: {
            gap: theme.spacing.s,
            alignItems: 'center',
        },
        banner: {
            alignSelf: 'stretch',
        },
        resendRow: {
            alignSelf: 'center',
        },
    });
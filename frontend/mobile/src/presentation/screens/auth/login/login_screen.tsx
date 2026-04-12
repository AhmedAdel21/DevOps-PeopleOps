import React, { useCallback, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
    AppText,
    AppButton,
    AppCard,
    AppTextField,
    AppAlertBanner,
} from '@/presentation/components/atoms';   
import { AppLogo } from '@/presentation/components/molecules';

type LoginStatus = 'idle' | 'submitting' | 'invalid' | 'locked';

export interface LoginScreenProps {
    onSubmit?: (credentials: { email: string; password: string }) => void;
    onForgotPassword?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
    onSubmit,
    onForgotPassword,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<LoginStatus>('idle');

    const isLocked = status === 'locked';
    const isInvalid = status === 'invalid';
    const isSubmitting = status === 'submitting';

    const handleSubmit = useCallback(() => {
        if (!email.trim() || !password.trim()) return;
        setStatus('submitting');
        onSubmit?.({ email: email.trim(), password });
    }, [email, password, onSubmit]);

    /** Expose setStatus so the parent / redux thunk can drive state transitions. */
    // For now, simulate: uncomment the line below to test error/locked states
    // setTimeout(() => setStatus('invalid'), 1500);

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
                <View style={styles.container}>
                    {/* Logo */}
                    <AppLogo />

                    {/* Headline */}
                    <View style={styles.headlineGroup}>
                        <AppText variant="display" align="center">
                            {t('auth.loginScreen.title')}
                        </AppText>
                        <AppText
                            variant="body"
                            align="center"
                            color={theme.colors.mutedForeground}
                        >
                            {t('auth.loginScreen.subtitle')}
                        </AppText>
                    </View>

                    {/* Locked banner */}
                    {isLocked && (
                        <AppAlertBanner
                            variant="error"
                            message={t('auth.loginScreen.errors.accountLocked')}
                        />
                    )}

                    {/* Form card */}
                    <AppCard>
                        <AppTextField
                            label={t('auth.loginScreen.emailLabel')}
                            placeholder={t('auth.loginScreen.emailPlaceholder')}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (isInvalid) setStatus('idle');
                            }}
                            leftIcon={Mail}
                            error={isInvalid ? t('auth.loginScreen.errors.invalidCredentials') : undefined}
                            disabled={isLocked}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="emailAddress"
                            autoComplete="email"
                            returnKeyType="next"
                        />

                        <AppTextField
                            label={t('auth.loginScreen.passwordLabel')}
                            placeholder={t('auth.loginScreen.passwordPlaceholder')}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (isInvalid) setStatus('idle');
                            }}
                            leftIcon={Lock}
                            rightIcon={showPassword ? EyeOff : Eye}
                            onRightIconPress={() => setShowPassword((prev) => !prev)}
                            secureTextEntry={!showPassword}
                            disabled={isLocked}
                            textContentType="password"
                            autoComplete="password"
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                        />

                        {/* Forgot password link */}
                        <Pressable
                            onPress={onForgotPassword}
                            hitSlop={8}
                            style={styles.forgotRow}
                            disabled={isLocked}
                        >
                            <AppText
                                variant="caption"
                                color={isLocked ? theme.colors.mutedForeground : theme.colors.primary}
                                weight="medium"
                            >
                                {t('auth.loginScreen.forgotLink')}
                            </AppText>
                        </Pressable>
                    </AppCard>

                    {/* Submit button */}
                    <AppButton
                        label={t('auth.loginScreen.submit')}
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        disabled={isLocked || !email.trim() || !password.trim()}
                        fullWidth
                    />

                    {/* Footer */}
                    <AppText
                        variant="caption"
                        color={theme.colors.mutedForeground}
                        align="center"
                    >
                        {t('auth.loginScreen.footer')}
                    </AppText>
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
            justifyContent: 'center',
        },
        container: {
            paddingHorizontal: ws(24),
            paddingVertical: hs(20),
            gap: theme.spacing.l,
        },
        headlineGroup: {
            gap: theme.spacing.xs,
            alignItems: 'center',
        },
        forgotRow: {
            alignSelf: 'flex-end',
        },
    });
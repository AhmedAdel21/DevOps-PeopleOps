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
    AppDivider,
} from '@/presentation/components/atoms';
import { AppLogo } from '@/presentation/components/molecules';

export type LoginScreenStatus = 'idle' | 'submitting' | 'error';

export interface LoginScreenProps {
    onSubmit?: (credentials: { email: string; password: string }) => void;
    onForgotPassword?: () => void;
    onZohoSignIn?: () => void;
    status?: LoginScreenStatus;
    errorMessage?: string;
    zohoStatus?: LoginScreenStatus;
    zohoErrorMessage?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
    onSubmit,
    onForgotPassword,
    onZohoSignIn,
    status = 'idle',
    errorMessage,
    zohoStatus = 'idle',
    zohoErrorMessage,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isSubmitting = status === 'submitting';
    const isZohoSubmitting = zohoStatus === 'submitting';
    const isAnySubmitting = isSubmitting || isZohoSubmitting;
    const hasError = status === 'error' && Boolean(errorMessage);
    const hasZohoError = zohoStatus === 'error' && Boolean(zohoErrorMessage);

    const handleSubmit = useCallback(() => {
        if (!email.trim() || !password.trim()) return;
        onSubmit?.({ email: email.trim(), password });
    }, [email, password, onSubmit]);

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
                    <AppLogo />

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

                    {hasError && (
                        <AppAlertBanner
                            variant="error"
                            message={errorMessage!}
                        />
                    )}

                    <AppCard>
                        <AppTextField
                            label={t('auth.loginScreen.emailLabel')}
                            placeholder={t('auth.loginScreen.emailPlaceholder')}
                            value={email}
                            onChangeText={setEmail}
                            leftIcon={Mail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="emailAddress"
                            autoComplete="email"
                            returnKeyType="next"
                            editable={!isAnySubmitting}
                        />

                        <AppTextField
                            label={t('auth.loginScreen.passwordLabel')}
                            placeholder={t('auth.loginScreen.passwordPlaceholder')}
                            value={password}
                            onChangeText={setPassword}
                            leftIcon={Lock}
                            rightIcon={showPassword ? EyeOff : Eye}
                            onRightIconPress={() => setShowPassword((prev) => !prev)}
                            secureTextEntry={!showPassword}
                            textContentType="password"
                            autoComplete="password"
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                            editable={!isAnySubmitting}
                        />

                        <Pressable
                            onPress={onForgotPassword}
                            hitSlop={8}
                            style={styles.forgotRow}
                            disabled={isAnySubmitting}
                        >
                            <AppText
                                variant="caption"
                                color={theme.colors.primary}
                                weight="medium"
                            >
                                {t('auth.loginScreen.forgotLink')}
                            </AppText>
                        </Pressable>
                    </AppCard>

                    <AppButton
                        label={t('auth.loginScreen.submit')}
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        disabled={isAnySubmitting || !email.trim() || !password.trim()}
                        fullWidth
                    />

                    <View style={styles.dividerRow}>
                        <AppDivider style={styles.dividerLine} />
                        <AppText
                            variant="caption"
                            color={theme.colors.mutedForeground}
                        >
                            {t('auth.loginScreen.orDivider')}
                        </AppText>
                        <AppDivider style={styles.dividerLine} />
                    </View>

                    <AppButton
                        label={t('auth.loginScreen.zohoSignIn')}
                        onPress={onZohoSignIn}
                        variant="outline"
                        loading={isZohoSubmitting}
                        disabled={isAnySubmitting}
                        fullWidth
                    />

                    {hasZohoError && (
                        <AppAlertBanner
                            variant="error"
                            message={zohoErrorMessage!}
                        />
                    )}

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
        dividerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.s,
        },
        dividerLine: {
            flex: 1,
        },
    });

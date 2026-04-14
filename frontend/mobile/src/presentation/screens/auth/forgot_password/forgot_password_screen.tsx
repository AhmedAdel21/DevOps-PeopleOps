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
import { Mail } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
    AppText,
    AppBackButton,
    AppButton,
    AppIconCircle,
    AppTextField,
} from '@/presentation/components/atoms';

type ForgotPasswordStatus = 'idle' | 'submitting' | 'error';

export interface ForgotPasswordScreenProps {
    onSubmit?: (email: string) => void;
    onBackToLogin?: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
    onSubmit,
    onBackToLogin,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<ForgotPasswordStatus>('idle');

    const isError = status === 'error';
    const isSubmitting = status === 'submitting';

    const handleSubmit = useCallback(() => {
        if (!email.trim()) return;
        setStatus('submitting');
        onSubmit?.(email.trim());
    }, [email, onSubmit]);

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
                <AppBackButton onPress={onBackToLogin ?? (() => { })} style={styles.backButton} />

                <View style={styles.content}>
                    {/* Icon circle */}
                    <AppIconCircle icon={Mail} />

                    {/* Headline + body */}
                    <View style={styles.textGroup}>
                        <AppText variant="display" align="center">
                            {t('auth.forgotPassword.title')}
                        </AppText>
                        <AppText
                            variant="body"
                            align="center"
                            color={theme.colors.mutedForeground}
                            style={styles.bodyText}
                        >
                            {t('auth.forgotPassword.body')}
                        </AppText>
                    </View>

                    {/* Email field */}
                    <AppTextField
                        containerStyle={styles.emailField}
                        label={t('auth.forgotPassword.emailLabel')}
                        placeholder={t('auth.forgotPassword.emailPlaceholder')}
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (isError) setStatus('idle');
                        }}
                        leftIcon={Mail}
                        error={isError ? t('auth.forgotPassword.errors.notFound') : undefined}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="emailAddress"
                        autoComplete="email"
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                    />

                    {/* Submit button */}
                    <AppButton
                        label={t('auth.forgotPassword.submit')}
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        disabled={!email.trim()}
                        fullWidth
                    />

                    {/* Back to login link */}
                    <Pressable onPress={onBackToLogin} hitSlop={8} style={styles.linkRow}>
                        <AppText
                            variant="label"
                            color={theme.colors.mutedForeground}
                        >
                            {t('auth.forgotPassword.backToLogin')}
                        </AppText>
                    </Pressable>
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
        textGroup: {
            gap: theme.spacing.s,
            alignItems: 'center',
        },
        bodyText: {
            maxWidth: ws(300),
        },
        linkRow: {
            alignSelf: 'center',
        },
        emailField: {
            width: '80%',
        },
    });
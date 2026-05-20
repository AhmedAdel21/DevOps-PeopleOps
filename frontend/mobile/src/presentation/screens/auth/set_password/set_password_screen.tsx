
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, CircleCheck } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppAlertBanner,
  AppText,
  AppBackButton,
  AppButton,
  AppCard,
  AppIconCircle,
  AppTextField,
} from '@/presentation/components/atoms';
import {
  AppPasswordStrengthMeter,
  AppPasswordRulesList,
  scorePassword,
  type AppPasswordRule,
} from '@/presentation/components/molecules';

export type SetPasswordMode = 'reset' | 'firstLogin';

/** Drives the screen's view + button state. Mirrors the slice's
 *  changePasswordStatus exactly so the wrapper can pipe it through
 *  unchanged. */
export type SetPasswordScreenStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface SetPasswordScreenProps {
  mode: SetPasswordMode;
  /** Driven by Redux changePasswordStatus when wired into firstLogin. The
   *  `reset` flow still uses local state via the legacy `setTimeout` path
   *  until the BE endpoint exists — wrapper passes `'idle'` there. */
  status?: SetPasswordScreenStatus;
  /** Pre-translated error message — surfaced as an inline AppAlertBanner
   *  above the submit button when status === 'error'. */
  errorMessage?: string;
  onSubmit?: (password: string) => void;
  onContinue?: () => void;
  onBack?: () => void;
}

export const SetPasswordScreen: React.FC<SetPasswordScreenProps> = ({
  mode,
  status = 'idle',
  errorMessage,
  onSubmit,
  onContinue,
  onBack,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mismatchError, setMismatchError] = useState(false);

  const { score } = scorePassword(password);

  const rules: AppPasswordRule[] = useMemo(
    () => [
      { label: t('auth.setPassword.rules.length'), met: password.length >= 8 },
      { label: t('auth.setPassword.rules.uppercase'), met: /[A-Z]/.test(password) },
      { label: t('auth.setPassword.rules.number'), met: /[0-9]/.test(password) },
      { label: t('auth.setPassword.rules.symbol'), met: /[^A-Za-z0-9]/.test(password) },
    ],
    [password, t],
  );

  const submitting = status === 'submitting';
  const allRulesMet = rules.every((r) => r.met);
  const canSubmit = allRulesMet && confirmPassword.length > 0 && !submitting;

  const handleSubmit = useCallback(() => {
    if (password !== confirmPassword) {
      setMismatchError(true);
      return;
    }
    onSubmit?.(password);
    // The parent dispatches the change-password thunk and pipes
    // `status === 'success'` back, which flips this screen to the success
    // view. No local fake `setTimeout` — the success screen now correctly
    // requires actual BE confirmation.
  }, [password, confirmPassword, onSubmit]);

  // ─── Success view ───
  // Only the slice-driven `success` status flips this. The screen no
  // longer fakes success with a timer.
  if (status === 'success') {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successSpacer} />
        <View style={styles.successContent}>
          <AppIconCircle
            icon={CircleCheck}
            backgroundColor={theme.colors.status.success.light}
            iconColor={theme.colors.status.success.base}
          />
          <AppText variant="display" align="center">
            {t('auth.setPassword.success.title')}
          </AppText>
          <AppText
            variant="body"
            align="center"
            color={theme.colors.mutedForeground}
            style={styles.successBody}
          >
            {t('auth.setPassword.success.body')}
          </AppText>
        </View>
        <View style={styles.successSpacer} />
        <AppButton
          label={t('auth.setPassword.success.continue')}
          onPress={onContinue ?? (() => {})}
          fullWidth
          style={styles.successButton}
        />
      </View>
    );
  }

  // ─── Form view ───
  const title =
    mode === 'reset'
      ? t('auth.setPassword.resetTitle')
      : t('auth.setPassword.firstLoginTitle');

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
        <AppBackButton onPress={onBack ?? (() => {})} style={styles.backButton} />

        <View style={styles.formContent}>
          {/* Title */}
          <AppText variant="display" align="center">
            {title}
          </AppText>

          {/* Card wrapping the form */}
          <AppCard>
            {/* New password */}
            <AppTextField
              label={t('auth.setPassword.newLabel')}
              placeholder={t('auth.setPassword.newPlaceholder')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (mismatchError) setMismatchError(false);
              }}
              leftIcon={Lock}
              rightIcon={showPassword ? EyeOff : Eye}
              onRightIconPress={() => setShowPassword((prev) => !prev)}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="next"
            />

            {/* Strength meter */}
            {password.length > 0 && (
              <AppPasswordStrengthMeter password={password} />
            )}

            {/* Rules checklist */}
            {password.length > 0 && (
              <AppPasswordRulesList rules={rules} />
            )}

            {/* Confirm password */}
            <AppTextField
              label={t('auth.setPassword.confirmLabel')}
              placeholder={t('auth.setPassword.confirmPlaceholder')}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (mismatchError) setMismatchError(false);
              }}
              leftIcon={Lock}
              rightIcon={showConfirm ? EyeOff : Eye}
              onRightIconPress={() => setShowConfirm((prev) => !prev)}
              secureTextEntry={!showConfirm}
              error={mismatchError ? t('auth.setPassword.errors.mismatch') : undefined}
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={canSubmit ? handleSubmit : undefined}
            />
          </AppCard>

          {/* Submit button + inline error (when the slice rejects). */}
          {status === 'error' && errorMessage ? (
            <AppAlertBanner variant="error" message={errorMessage} />
          ) : null}
          <AppButton
            label={t('auth.setPassword.submit')}
            onPress={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
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
    formContent: {
      flex: 1,
      justifyContent: 'center',
      gap: theme.spacing.l,
    },

    // Success view
    successContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: ws(24),
      paddingVertical: hs(20),
    },
    successSpacer: {
      flex: 1,
    },
    successContent: {
      alignItems: 'center',
      gap: theme.spacing.m,
    },
    successBody: {
      maxWidth: ws(300),
    },
    successButton: {
      marginBottom: hs(12),
    },
  });

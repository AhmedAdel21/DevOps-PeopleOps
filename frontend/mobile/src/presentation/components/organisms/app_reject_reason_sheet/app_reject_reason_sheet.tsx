import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppBottomSheet, AppButton, AppText } from '@/presentation/components/atoms';

export interface AppRejectReasonSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the trimmed, non-empty reason when the user submits. */
  onSubmit: (reason: string) => void;
  submitting: boolean;
}

/**
 * Reject-reason capture sheet, shared by the Approval Detail screen and the
 * Team Approvals list (swipe-left → Reject → tap). The backend accepts +
 * echoes `reviewerComment` but does not persist it (B3) — the copy
 * (`team.detail.reject.*`) is softened accordingly. Owns the textarea state
 * so callers only deal with the resulting reason. KeyboardAvoidingView is
 * required on iOS or the input hides behind the keyboard.
 */
export const AppRejectReasonSheet: React.FC<AppRejectReasonSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  submitting,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [reason, setReason] = useState('');

  // Reset the draft whenever the sheet is dismissed/reopened.
  useEffect(() => {
    if (!visible) setReason('');
  }, [visible]);

  const trimmed = reason.trim();

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightFraction={0.5}>
      {/* No flex:1 here — AppBottomSheet sizes its inner container to the
          content height, so a flex child collapses to 0 (empty sheet).
          KeyboardAvoidingView 'padding' still lifts the input above the
          keyboard without needing flex. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetBody}>
          <AppText variant="cardTitle" weight="semibold">
            {t('team.detail.reject.title')}
          </AppText>
          <AppText
            variant="caption"
            color={theme.colors.mutedForeground}
            style={styles.sheetSub}
          >
            {t('team.detail.reject.subtitle')}
          </AppText>
          <TextInput
            style={styles.reasonInput}
            placeholder={t('team.detail.reject.placeholder')}
            placeholderTextColor={theme.colors.mutedForeground}
            value={reason}
            onChangeText={setReason}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.btnRow}>
            <AppButton
              label={t('common.cancel')}
              variant="outline"
              onPress={onClose}
              disabled={submitting}
              fullWidth
              style={styles.btnFlex}
            />
            <AppButton
              label={t('team.detail.reject.submit')}
              variant="destructive"
              onPress={() => onSubmit(trimmed)}
              loading={submitting}
              disabled={trimmed.length === 0}
              fullWidth
              style={styles.btnFlex}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppBottomSheet>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    sheetBody: {
      paddingHorizontal: ws(20),
      paddingTop: hs(8),
      paddingBottom: hs(24),
      gap: hs(12),
    },
    sheetSub: {},
    reasonInput: {
      minHeight: hs(96),
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: ws(12),
      color: theme.colors.foreground,
      backgroundColor: theme.colors.input,
    },
    btnRow: { flexDirection: 'row', gap: ws(12) },
    btnFlex: { flex: 1 },
  });

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Sun, Moon, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppBottomSheet,
  AppButton,
  AppText,
} from '@/presentation/components/atoms';

export type ThemeMode = 'light' | 'dark';

export interface ThemePickerSheetProps {
  visible: boolean;
  currentMode: ThemeMode;
  onClose: () => void;
  onConfirm: (mode: ThemeMode) => void;
}

interface ThemeOption {
  mode: ThemeMode;
  icon: LucideIcon;
  accentKey: 'primary' | 'info';
}

const THEME_OPTIONS: ThemeOption[] = [
  { mode: 'light', icon: Sun, accentKey: 'primary' },
  { mode: 'dark', icon: Moon, accentKey: 'info' },
];

const resolveAccent = (
  theme: AppTheme,
  key: 'primary' | 'info',
): { base: string; light: string } => {
  if (key === 'primary') {
    return { base: theme.colors.primary, light: theme.colors.primaryLight };
  }
  return {
    base: theme.colors.status.info.base,
    light: theme.colors.status.info.light,
  };
};

export const ThemePickerSheet: React.FC<ThemePickerSheetProps> = ({
  visible,
  currentMode,
  onClose,
  onConfirm,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selected, setSelected] = useState<ThemeMode>(currentMode);

  // Reset selection to the active theme each time the sheet opens
  useEffect(() => {
    if (visible) {
      setSelected(currentMode);
    }
  }, [visible, currentMode]);

  const handleConfirm = useCallback(() => {
    onConfirm(selected);
  }, [onConfirm, selected]);

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightFraction={0.5}>
      <View style={styles.content}>
        <AppText variant="title" align="center">
          {t('profile.themeSheet.title')}
        </AppText>

        <View style={styles.cards}>
          {THEME_OPTIONS.map((option) => {
            const isSelected = selected === option.mode;
            const accent = resolveAccent(theme, option.accentKey);
            const Icon = option.icon;

            return (
              <Pressable
                key={option.mode}
                onPress={() => setSelected(option.mode)}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: isSelected ? theme.colors.primaryInk : theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor:
                        accent.light,
                    },
                  ]}
                >
                  <Icon size={ws(24)} color={accent.base} />
                </View>

                <View style={styles.cardText}>
                  <AppText variant="cardTitle">
                    {t(`profile.themeSheet.modes.${option.mode}.title`)}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedForeground}>
                    {t(`profile.themeSheet.modes.${option.mode}.body`)}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected
                        ? theme.colors.primaryInk
                        : theme.colors.borderStrong,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: theme.colors.primaryInk },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <AppButton
          label={t('profile.themeSheet.confirm')}
          onPress={handleConfirm}
          fullWidth
          style={styles.confirm}
        />

        <Pressable onPress={onClose} hitSlop={8} style={styles.cancelRow}>
          <AppText
            variant="label"
            color={theme.colors.mutedForeground}
            align="center"
          >
            {t('profile.themeSheet.cancel')}
          </AppText>
        </Pressable>
      </View>
    </AppBottomSheet>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: ws(20),
      paddingTop: hs(8),
      paddingBottom: hs(12),
      gap: hs(12),
    },
    cards: {
      gap: hs(12),
      marginTop: hs(4),
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: ws(16),
      borderRadius: theme.radius.m,
      borderWidth: 1,
      gap: ws(16),
    },
    iconBox: {
      width: ws(48),
      height: ws(48),
      borderRadius: theme.radius.m,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardText: {
      flex: 1,
      gap: hs(2),
    },
    radio: {
      width: ws(22),
      height: ws(22),
      borderRadius: ws(11),
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioDot: {
      width: ws(10),
      height: ws(10),
      borderRadius: ws(5),
    },
    confirm: {
      marginTop: hs(8),
    },
    cancelRow: {
      paddingVertical: hs(8),
    },
  });

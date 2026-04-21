import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CalendarDays, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppBottomSheet, AppText } from '@/presentation/components/atoms';

export type RequestType = 'vacation' | 'permission';

export interface RequestTypePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: RequestType) => void;
}

interface Option {
  type: RequestType;
  titleKey: string;
  bodyKey: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
}

const OPTIONS: Option[] = [
  {
    type: 'vacation',
    titleKey: 'leave.newRequest.typeSheet.vacation.title',
    bodyKey: 'leave.newRequest.typeSheet.vacation.body',
    Icon: CalendarDays,
  },
  {
    type: 'permission',
    titleKey: 'leave.newRequest.typeSheet.permission.title',
    bodyKey: 'leave.newRequest.typeSheet.permission.body',
    Icon: Clock,
  },
];

export const RequestTypePickerSheet: React.FC<RequestTypePickerSheetProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightFraction={0.42}>
      <View style={styles.content}>
        <AppText variant="title" align="center">
          {t('leave.newRequest.typeSheet.title')}
        </AppText>

        <View style={styles.cards}>
          {OPTIONS.map(({ type, titleKey, bodyKey, Icon }) => (
            <Pressable
              key={type}
              style={({ pressed }) => [
                styles.card,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: pressed ? theme.colors.muted : theme.colors.card,
                },
              ]}
              onPress={() => onSelect(type)}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <Icon size={ws(24)} color={theme.colors.primary} />
              </View>
              <View style={styles.cardText}>
                <AppText variant="cardTitle">{t(titleKey)}</AppText>
                <AppText variant="caption" color={theme.colors.mutedForeground}>
                  {t(bodyKey)}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </AppBottomSheet>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: ws(20),
      paddingTop: hs(8),
      paddingBottom: hs(24),
      gap: hs(16),
    },
    cards: {
      gap: hs(12),
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(16),
      padding: ws(16),
      borderRadius: theme.radius.m,
      borderWidth: 1,
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
  });

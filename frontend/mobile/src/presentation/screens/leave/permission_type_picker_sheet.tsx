import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Timer, LogOut, Coffee, CalendarMinus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppBottomSheet,
  AppButton,
  AppDivider,
  AppText,
} from '@/presentation/components/atoms';
import type { PermissionType } from '@/domain/entities';
import type { SerializablePermissionQuota } from '@/presentation/store/slices';

export const PERMISSION_TYPE_KEY: Record<PermissionType, string> = {
  Late:      'leave.permissions.types.late',
  Early:     'leave.permissions.types.early',
  MiddleDay: 'leave.permissions.types.middleDay',
  HalfDay:   'leave.permissions.types.halfDay',
};

interface PermissionTypeOption {
  type: PermissionType;
  dotColorKey: 'warning' | 'success' | 'info' | 'custom';
  customColor?: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
}

const TYPE_OPTIONS: PermissionTypeOption[] = [
  { type: 'Late',      dotColorKey: 'warning', Icon: Timer },
  { type: 'Early',     dotColorKey: 'success', Icon: LogOut },
  { type: 'MiddleDay', dotColorKey: 'info',    Icon: Coffee },
  { type: 'HalfDay',   dotColorKey: 'custom',  customColor: '#8B5CF6', Icon: CalendarMinus },
];

export interface PermissionTypePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: PermissionType) => void;
  selected: PermissionType | null;
  quota: SerializablePermissionQuota | null;
}

export const PermissionTypePickerSheet: React.FC<PermissionTypePickerSheetProps> = ({
  visible,
  onClose,
  onSelect,
  selected,
  quota,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [localSelected, setLocalSelected] = useState<PermissionType | null>(selected);

  useEffect(() => {
    if (visible) setLocalSelected(selected);
  }, [visible, selected]);

  const resolveDotColor = useCallback(
    (opt: PermissionTypeOption): string => {
      if (opt.dotColorKey === 'custom') return opt.customColor!;
      return theme.colors.status[opt.dotColorKey].base;
    },
    [theme],
  );

  const handleSelect = useCallback(() => {
    if (localSelected) onSelect(localSelected);
  }, [localSelected, onSelect]);

  const confirmDotColor = localSelected
    ? resolveDotColor(TYPE_OPTIONS.find(o => o.type === localSelected)!)
    : theme.colors.mutedForeground;

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightFraction={0.72}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="cardTitle" weight="semibold">
            {t('leave.newPermissionRequest.typeSheet.title')}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedForeground}>
            {t('leave.newPermissionRequest.typeSheet.subtitle')}
          </AppText>
        </View>
        {quota && (
          <View style={[styles.quotaBadge, { backgroundColor: theme.colors.status.info.light }]}>
            <AppText variant="micro" color={theme.colors.status.info.foreground} weight="semibold">
              {t('leave.newPermissionRequest.typeSheet.quotaBadge', {
                used: quota.permissionsUsed,
                allowed: quota.permissionsAllowed,
              })}
            </AppText>
          </View>
        )}
        <AppDivider />
      </View>

      {/* Type list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {TYPE_OPTIONS.map((opt, idx) => {
          const isSelected = localSelected === opt.type;
          const dotColor = resolveDotColor(opt);
          const Icon = opt.Icon;

          return (
            <React.Fragment key={opt.type}>
              {idx > 0 && <AppDivider />}
              <Pressable
                style={({ pressed }) => [
                  styles.typeRow,
                  pressed && { backgroundColor: theme.colors.muted },
                ]}
                onPress={() => setLocalSelected(opt.type)}
              >
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
                <View style={styles.iconWrap}>
                  <Icon size={ws(20)} color={theme.colors.mutedForeground} />
                </View>
                <AppText variant="label" weight="medium" style={styles.typeLabel}>
                  {t(PERMISSION_TYPE_KEY[opt.type])}
                </AppText>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.borderStrong,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
            </React.Fragment>
          );
        })}
      </ScrollView>

      {/* Confirm area */}
      <View style={[styles.confirmArea, { borderTopColor: theme.colors.border }]}>
        {localSelected && (
          <View style={styles.selectedSummary}>
            <View style={[styles.summaryDot, { backgroundColor: confirmDotColor }]} />
            <AppText variant="small" color={theme.colors.mutedForeground}>
              {t(PERMISSION_TYPE_KEY[localSelected])}
            </AppText>
          </View>
        )}
        <AppButton
          label={t('leave.newPermissionRequest.typeSheet.select')}
          variant="primary"
          fullWidth
          disabled={!localSelected}
          onPress={handleSelect}
        />
      </View>
    </AppBottomSheet>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: ws(20),
      gap: hs(8),
      paddingBottom: hs(4),
    },
    headerText: {
      gap: hs(2),
    },
    quotaBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: ws(10),
      paddingVertical: hs(4),
      borderRadius: theme.radius.pill,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: ws(20),
      paddingVertical: hs(4),
    },
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(12),
      paddingVertical: hs(14),
    },
    dot: {
      width: ws(10),
      height: ws(10),
      borderRadius: ws(5),
    },
    iconWrap: {
      width: ws(24),
      alignItems: 'center',
    },
    typeLabel: {
      flex: 1,
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
    confirmArea: {
      paddingHorizontal: ws(20),
      paddingTop: hs(16),
      paddingBottom: hs(8),
      borderTopWidth: 1,
      gap: hs(10),
    },
    selectedSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(8),
    },
    summaryDot: {
      width: ws(10),
      height: ws(10),
      borderRadius: ws(5),
    },
  });

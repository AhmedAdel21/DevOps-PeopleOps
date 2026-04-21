import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppAlertBanner,
  AppBottomSheet,
  AppButton,
  AppDivider,
  AppText,
} from '@/presentation/components/atoms';
import type { LeaveType } from '@/domain/entities';
import type { SerializableLeaveBalance } from '@/presentation/store/slices';
import { useAppSelector } from '@/presentation/store/hooks';
import { selectLeaveBalances } from '@/presentation/store/selectors';

const LEAVE_TYPE_KEY: Record<LeaveType, string> = {
  Annual:        'leave.balances.leaveTypes.annual',
  Casual:        'leave.balances.leaveTypes.casual',
  Sick:          'leave.balances.leaveTypes.sick',
  Compassionate: 'leave.balances.leaveTypes.compassionate',
  Unpaid:        'leave.balances.leaveTypes.unpaid',
  Hajj:          'leave.balances.leaveTypes.hajj',
  Marriage:      'leave.balances.leaveTypes.marriage',
};

const LEAVE_TYPE_COLOR: Record<LeaveType, keyof AppTheme['colors']['leaveTypes']> = {
  Annual:        'annual',
  Casual:        'casual',
  Sick:          'sick',
  Compassionate: 'compassionate',
  Unpaid:        'unpaid',
  Hajj:          'hajj',
  Marriage:      'marriage',
};

const LEAVE_TYPE_ORDER: LeaveType[] = [
  'Annual', 'Casual', 'Sick', 'Compassionate', 'Unpaid', 'Hajj', 'Marriage',
];

export interface LeaveTypePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: LeaveType) => void;
  selected: LeaveType | null;
  showSameDayWarning?: boolean;
  showPastDateInfo?: boolean;
}

export const LeaveTypePickerSheet: React.FC<LeaveTypePickerSheetProps> = ({
  visible,
  onClose,
  onSelect,
  selected,
  showSameDayWarning = false,
  showPastDateInfo = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const balances = useAppSelector(selectLeaveBalances);
  const [localSelected, setLocalSelected] = useState<LeaveType | null>(selected);

  useEffect(() => {
    if (visible) setLocalSelected(selected);
  }, [visible, selected]);

  const getBalance = useCallback(
    (type: LeaveType): SerializableLeaveBalance | undefined =>
      balances.find(b => b.type === type),
    [balances],
  );

  const handleConfirm = useCallback(() => {
    if (localSelected) onSelect(localSelected);
  }, [localSelected, onSelect]);

  const selectedBalance = localSelected ? getBalance(localSelected) : undefined;
  const confirmDotColor = localSelected
    ? theme.colors.leaveTypes[LEAVE_TYPE_COLOR[localSelected]]
    : theme.colors.mutedForeground;

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightFraction={0.82}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="cardTitle" weight="semibold">
          {t('leave.newVacationRequest.leaveTypeSheet.title')}
        </AppText>
        <AppText variant="caption" color={theme.colors.mutedForeground}>
          {t('leave.newVacationRequest.leaveTypeSheet.subtitle')}
        </AppText>
        {showSameDayWarning && (
          <AppAlertBanner
            variant="warning"
            message={t('leave.newVacationRequest.sameDayWarning')}
          />
        )}
        {showPastDateInfo && (
          <AppAlertBanner
            variant="info"
            message={t('leave.newVacationRequest.pastDateInfo')}
          />
        )}
        <AppDivider />
      </View>

      {/* Type list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {LEAVE_TYPE_ORDER.map((type, idx) => {
          const balance = getBalance(type);
          const isSelected = localSelected === type;
          const dotColor = theme.colors.leaveTypes[LEAVE_TYPE_COLOR[type]];

          const rightLabel = balance?.unlimited
            ? t('leave.balances.unlimited')
            : balance?.remaining !== undefined && balance.remaining !== null
            ? t('leave.newVacationRequest.leaveTypeSheet.remaining', {
                count: balance.remaining,
              })
            : '';

          return (
            <React.Fragment key={type}>
              {idx > 0 && <AppDivider />}
              <Pressable
                style={({ pressed }) => [
                  styles.typeRow,
                  pressed && { backgroundColor: theme.colors.muted },
                ]}
                onPress={() => setLocalSelected(type)}
              >
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
                <AppText variant="label" weight="medium" style={styles.typeLabel}>
                  {t(LEAVE_TYPE_KEY[type])}
                </AppText>
                <AppText variant="small" color={theme.colors.mutedForeground}>
                  {rightLabel}
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
        {localSelected && selectedBalance && (
          <View style={styles.selectedSummary}>
            <View style={[styles.summaryDot, { backgroundColor: confirmDotColor }]} />
            <AppText variant="small" color={theme.colors.mutedForeground}>
              {t(LEAVE_TYPE_KEY[localSelected])}
              {!selectedBalance.unlimited &&
                selectedBalance.remaining !== null &&
                `  ·  ${t('leave.newVacationRequest.leaveTypeSheet.remaining', {
                  count: selectedBalance.remaining,
                })}`}
            </AppText>
          </View>
        )}
        <AppButton
          label={t('leave.newVacationRequest.leaveTypeSheet.select')}
          variant="primary"
          fullWidth
          disabled={!localSelected}
          onPress={handleConfirm}
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

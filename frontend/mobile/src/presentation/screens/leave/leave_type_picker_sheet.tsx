import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { useAppSelector } from '@/presentation/store/hooks';
import {
  selectAvailableLeaveTypes,
  selectAvailableLeaveTypesFetchError,
  selectAvailableLeaveTypesFetchStatus,
  selectLeaveBalances,
} from '@/presentation/store/selectors';
import type {
  SerializableLeaveBalance,
  SerializableLeaveType,
} from '@/presentation/store/slices';

const pickLocalizedName = (t: SerializableLeaveType, lang: string): string =>
  lang.startsWith('ar') ? t.nameAr : t.nameEn;

export interface LeaveTypePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: SerializableLeaveType) => void;
  selected: SerializableLeaveType | null;
  showStartDateRequired?: boolean;
}

export const LeaveTypePickerSheet: React.FC<LeaveTypePickerSheetProps> = ({
  visible,
  onClose,
  onSelect,
  selected,
  showStartDateRequired = false,
}) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const availableTypes = useAppSelector(selectAvailableLeaveTypes);
  const fetchStatus    = useAppSelector(selectAvailableLeaveTypesFetchStatus);
  const fetchError     = useAppSelector(selectAvailableLeaveTypesFetchError);
  const balances       = useAppSelector(selectLeaveBalances);

  const [localSelected, setLocalSelected] = useState<SerializableLeaveType | null>(selected);

  useEffect(() => {
    if (visible) setLocalSelected(selected);
  }, [visible, selected]);

  const getBalance = useCallback(
    (typeId: number): SerializableLeaveBalance | undefined =>
      balances.find(b => b.typeId === typeId),
    [balances],
  );

  const handleConfirm = useCallback(() => {
    if (localSelected) onSelect(localSelected);
  }, [localSelected, onSelect]);

  const selectedBalance = localSelected ? getBalance(localSelected.id) : undefined;
  const confirmDotColor = localSelected?.colorHex ?? theme.colors.mutedForeground;

  const formatRemaining = (balance: SerializableLeaveBalance | undefined): string => {
    if (!balance) return '';
    if (balance.isUnlimited) return t('leave.balances.unlimited');
    return t('leave.newVacationRequest.leaveTypeSheet.remaining', {
      count: balance.remainingDays,
    });
  };

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
        {showStartDateRequired && (
          <AppAlertBanner
            variant="info"
            message={t('leave.newVacationRequest.leaveTypeSheet.pickStartDateFirst')}
          />
        )}
        {fetchError && (
          <AppAlertBanner variant="error" message={fetchError.message} />
        )}
        <AppDivider />
      </View>

      {/* Type list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {fetchStatus === 'pending' && availableTypes.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : availableTypes.length === 0 && !showStartDateRequired ? (
          <View style={styles.loadingWrap}>
            <AppText variant="small" color={theme.colors.mutedForeground} align="center">
              {t('leave.newVacationRequest.leaveTypeSheet.empty')}
            </AppText>
          </View>
        ) : (
          availableTypes.map((type, idx) => {
            const balance = getBalance(type.id);
            const isSelected = localSelected?.id === type.id;
            const localizedName = pickLocalizedName(type, i18n.language);

            const badges: string[] = [];
            if (type.requiresMedicalCertificate) {
              badges.push(t('leave.newVacationRequest.leaveTypeSheet.medicalBadge'));
            }
            if (type.isOncePerCareer) {
              badges.push(t('leave.newVacationRequest.leaveTypeSheet.oncePerCareerBadge'));
            }

            return (
              <React.Fragment key={type.id}>
                {idx > 0 && <AppDivider />}
                <Pressable
                  style={({ pressed }) => [
                    styles.typeRow,
                    pressed && { backgroundColor: theme.colors.muted },
                  ]}
                  onPress={() => setLocalSelected(type)}
                >
                  <View style={[styles.dot, { backgroundColor: type.colorHex }]} />
                  <View style={styles.typeLabelWrap}>
                    <AppText variant="label" weight="medium">
                      {localizedName}
                    </AppText>
                    {badges.length > 0 && (
                      <AppText variant="micro" color={theme.colors.mutedForeground}>
                        {badges.join(' · ')}
                      </AppText>
                    )}
                  </View>
                  <AppText variant="small" color={theme.colors.mutedForeground}>
                    {formatRemaining(balance)}
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
          })
        )}
      </ScrollView>

      {/* Confirm area */}
      <View style={[styles.confirmArea, { borderTopColor: theme.colors.border }]}>
        {localSelected && (
          <View style={styles.selectedSummary}>
            <View style={[styles.summaryDot, { backgroundColor: confirmDotColor }]} />
            <AppText variant="small" color={theme.colors.mutedForeground}>
              {pickLocalizedName(localSelected, i18n.language)}
              {selectedBalance && !selectedBalance.isUnlimited &&
                `  ·  ${t('leave.newVacationRequest.leaveTypeSheet.remaining', {
                  count: selectedBalance.remainingDays,
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
    loadingWrap: {
      paddingVertical: hs(32),
      alignItems: 'center',
      justifyContent: 'center',
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
    typeLabelWrap: {
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

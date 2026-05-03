import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronDown } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppAlertBanner,
  AppBackButton,
  AppButton,
  AppDivider,
  AppPermissionGate,
  AppText,
} from '@/presentation/components/atoms';
import { AppAttachmentPicker } from '@/presentation/components/molecules';
import { Permissions } from '@/core/auth';
import type { UploadedAttachment } from '@/domain/repositories';
import { useAppDispatch, useAppSelector } from '@/presentation/store/hooks';
import {
  fetchAvailableLeaveTypes,
  submitLeaveRequest,
} from '@/presentation/store/slices';
import type { SerializableLeaveType } from '@/presentation/store/slices';
import {
  selectAvailableLeaveTypes,
  selectAvailableLeaveTypesFetchStatus,
  selectLastSubmitResult,
  selectSubmitLeaveError,
  selectSubmitLeaveStatus,
} from '@/presentation/store/selectors';
import type { LeaveStackParamList } from '@/presentation/navigation/types';
import { LeaveTypePickerSheet } from './leave_type_picker_sheet';

// ── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatShortDate = (d: Date): string =>
  `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const computeDays = (from: Date, to: Date): number =>
  Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;

const addDays = (d: Date, days: number): Date => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

const isSameLocalDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const pickLocalizedName = (t: SerializableLeaveType, lang: string): string =>
  lang.startsWith('ar') ? t.nameAr : t.nameEn;

// ── Map domain error codes to i18n keys ─────────────────────────────────────

/**
 * Codes whose message is generic; we translate via a fixed i18n key.
 * Codes that carry dynamic detail (past-date-exceeded, insufficient-balance,
 * consecutive-limit) should use the BE-provided errorMessage directly because
 * it embeds the relevant number/date.
 */
const ERROR_CODE_I18N_KEY: Partial<Record<string, string>> = {
  'invalid-leave-type':     'leave.newVacationRequest.errors.codes.invalidLeaveType',
  'leave-type-inactive':    'leave.newVacationRequest.errors.codes.leaveTypeInactive',
  'once-per-career':        'leave.newVacationRequest.errors.codes.oncePerCareer',
  'same-day-not-allowed':   'leave.newVacationRequest.errors.codes.sameDayNotAllowed',
  'past-date-not-allowed':  'leave.newVacationRequest.errors.codes.pastDateNotAllowed',
  'date-overlap':           'leave.newVacationRequest.errors.codes.dateOverlap',
  'unauthenticated':        'leave.newVacationRequest.errors.codes.unauthenticated',
  'network':                'leave.newVacationRequest.errors.codes.network',
};

// ── Picker modal ─────────────────────────────────────────────────────────────

interface PickerModalProps {
  visible: boolean;
  value: Date;
  min?: Date;
  max?: Date;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
  cancelLabel: string;
  confirmLabel: string;
  cardBg: string;
}

const PickerModal: React.FC<PickerModalProps> = ({
  visible,
  value,
  min,
  max,
  onConfirm,
  onCancel,
  cancelLabel,
  confirmLabel,
  cardBg,
}) => {
  const [pending, setPending] = useState(value);

  useEffect(() => {
    if (visible) setPending(value);
  }, [visible, value]);

  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={pending}
        mode="date"
        display="default"
        minimumDate={min}
        maximumDate={max}
        onChange={(evt, d) => {
          if (evt.type === 'set' && d) onConfirm(d);
          else onCancel();
        }}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={pickerStyles.overlay}>
        <Pressable style={pickerStyles.backdrop} onPress={onCancel} />
        <View style={[pickerStyles.sheet, { backgroundColor: cardBg }]}>
          <View style={pickerStyles.toolbar}>
            <Pressable onPress={onCancel} hitSlop={8}>
              <AppText variant="label" color="#6B7280">{cancelLabel}</AppText>
            </Pressable>
            <Pressable onPress={() => onConfirm(pending)} hitSlop={8}>
              <AppText variant="label" color="#FF6633">{confirmLabel}</AppText>
            </Pressable>
          </View>
          <DateTimePicker
            value={pending}
            mode="date"
            display="spinner"
            minimumDate={min}
            maximumDate={max}
            onChange={(_, d) => { if (d) setPending(d); }}
          />
        </View>
      </View>
    </Modal>
  );
};

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});

// ── Screen ───────────────────────────────────────────────────────────────────

export const NewVacationRequestScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation =
    useNavigation<NativeStackNavigationProp<LeaveStackParamList>>();

  const dispatch = useAppDispatch();
  const submitStatus    = useAppSelector(selectSubmitLeaveStatus);
  const submitError     = useAppSelector(selectSubmitLeaveError);
  const submitResult    = useAppSelector(selectLastSubmitResult);
  const availableTypes  = useAppSelector(selectAvailableLeaveTypes);
  const availableStatus = useAppSelector(selectAvailableLeaveTypesFetchStatus);

  // Form state
  const [fromDate,   setFromDate]   = useState<Date | null>(null);
  const [toDate,     setToDate]     = useState<Date | null>(null);
  const [leaveType,  setLeaveType]  = useState<SerializableLeaveType | null>(null);
  const [notes,      setNotes]      = useState('');
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [dateErr,    setDateErr]    = useState<string | undefined>();
  const [typeErr,    setTypeErr]    = useState<string | undefined>();

  // Picker state
  const [pickerOpen,  setPickerOpen]  = useState<'from' | 'to' | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());
  const [sheetOpen,   setSheetOpen]   = useState(false);

  // Fetch available leave types whenever the start date changes.
  useEffect(() => {
    if (fromDate) {
      dispatch(fetchAvailableLeaveTypes({ startDate: toIsoDate(fromDate) }));
    }
  }, [dispatch, fromDate]);

  // Drop the selected leave type if it is no longer returned by the BE.
  useEffect(() => {
    if (leaveType && availableStatus === 'loaded') {
      const stillAvailable = availableTypes.some(x => x.id === leaveType.id);
      if (!stillAvailable) setLeaveType(null);
    }
  }, [availableTypes, availableStatus, leaveType]);

  // Navigate back after successful submit. The submit result stays in the
  // store so the list screen can show the weekend / attendance-conflict
  // banner — it's cleared there on dismiss or on the next submit.
  const prevStatus = useRef(submitStatus);
  useEffect(() => {
    if (prevStatus.current === 'pending' && submitStatus === 'idle' && submitResult) {
      navigation.goBack();
    }
    prevStatus.current = submitStatus;
  }, [submitStatus, submitResult, navigation]);

  // ── Date helpers ────────────────────────────────────────────────────────────

  const durationDays = useMemo(() => {
    if (!fromDate || !toDate) return null;
    const d = computeDays(fromDate, toDate);
    return d > 0 ? d : null;
  }, [fromDate, toDate]);

  const isStartDateToday = useMemo(() => {
    if (!fromDate) return false;
    return isSameLocalDay(fromDate, new Date());
  }, [fromDate]);

  const sameDayBlocked = Boolean(
    leaveType && !leaveType.allowSameDay && isStartDateToday,
  );

  const endDateMax = useMemo(() => {
    if (!fromDate || !leaveType?.maxConsecutiveDays) return undefined;
    return addDays(fromDate, leaveType.maxConsecutiveDays - 1);
  }, [fromDate, leaveType]);

  // Cap toDate if a max-consecutive rule shrinks below the currently selected range.
  useEffect(() => {
    if (toDate && endDateMax && toDate > endDateMax) {
      setToDate(endDateMax);
    }
  }, [toDate, endDateMax]);

  const openFromPicker = useCallback(() => {
    setPickerValue(fromDate ?? new Date());
    setPickerOpen('from');
  }, [fromDate]);

  const openToPicker = useCallback(() => {
    if (!fromDate) {
      setDateErr(t('leave.newVacationRequest.errors.startDateFirst'));
      return;
    }
    setPickerValue(toDate ?? fromDate);
    setPickerOpen('to');
  }, [toDate, fromDate, t]);

  const applyDate = useCallback(
    (d: Date) => {
      if (pickerOpen === 'from') {
        setFromDate(d);
        if (toDate && d > toDate) setToDate(null);
      } else {
        setToDate(d);
      }
      setPickerOpen(null);
      setDateErr(undefined);
    },
    [pickerOpen, toDate],
  );

  const handleLeaveTypeSelect = useCallback((type: SerializableLeaveType) => {
    setLeaveType(type);
    setSheetOpen(false);
    setTypeErr(undefined);
  }, []);

  const openTypeSheet = useCallback(() => {
    if (!fromDate) {
      setDateErr(t('leave.newVacationRequest.errors.startDateFirst'));
      return;
    }
    setSheetOpen(true);
  }, [fromDate, t]);

  const handleSubmit = useCallback(() => {
    let hasError = false;
    if (!fromDate || !toDate) {
      setDateErr(t('leave.newVacationRequest.errors.dateRequired'));
      hasError = true;
    }
    if (!leaveType) {
      setTypeErr(t('leave.newVacationRequest.errors.leaveTypeRequired'));
      hasError = true;
    }
    if (sameDayBlocked) {
      setTypeErr(t('leave.newVacationRequest.errors.codes.sameDayNotAllowed'));
      hasError = true;
    }
    if (hasError) return;

    dispatch(submitLeaveRequest({
      leaveTypeId: leaveType!.id,
      startDate: toIsoDate(fromDate!),
      endDate: toIsoDate(toDate!),
      notes: notes.trim() || undefined,
      attachmentIds: attachments.length > 0 ? attachments.map(a => a.id) : undefined,
    }));
  }, [fromDate, toDate, leaveType, sameDayBlocked, notes, attachments, dispatch, t]);

  const isSubmitting = submitStatus === 'pending';

  // Compose a user-facing error message from the submit error.
  const errorMessage = useMemo(() => {
    if (!submitError) return null;
    const i18nKey = ERROR_CODE_I18N_KEY[submitError.leaveCode];
    if (i18nKey) return t(i18nKey);
    // Fallback to BE-provided dynamic message (insufficient-balance, past-date-exceeded, consecutive-limit).
    return submitError.message;
  }, [submitError, t]);

  const submitSummary = useMemo(() => {
    if (!durationDays || !leaveType) return null;
    return t('leave.newVacationRequest.submitSummary', {
      count: durationDays,
      leaveType: pickLocalizedName(leaveType, i18n.language),
    });
  }, [durationDays, leaveType, t, i18n.language]);

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      {/* Nav header */}
      <View style={styles.navHeader}>
        <AppBackButton onPress={() => navigation.goBack()} />
        <AppText variant="title">{t('leave.newVacationRequest.navTitle')}</AppText>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: hs(100) + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Select dates ── */}
        <AppText variant="bodyLg" weight="semibold">
          {t('leave.newVacationRequest.datesSection')}
        </AppText>

        <View style={[styles.card, dateErr && styles.cardError]}>
          <Pressable style={styles.dateRow} onPress={openFromPicker}>
            <AppText
              variant="label"
              color={fromDate ? theme.colors.foreground : theme.colors.mutedForeground}
            >
              {fromDate ? formatShortDate(fromDate) : t('leave.newVacationRequest.startDate')}
            </AppText>
            <ChevronDown size={ws(16)} color={theme.colors.mutedForeground} />
          </Pressable>
          <AppDivider />
          <Pressable style={styles.dateRow} onPress={openToPicker}>
            <AppText
              variant="label"
              color={toDate ? theme.colors.foreground : theme.colors.mutedForeground}
            >
              {toDate ? formatShortDate(toDate) : t('leave.newVacationRequest.endDate')}
            </AppText>
            <ChevronDown size={ws(16)} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>

        {dateErr && (
          <AppText variant="small" color={theme.colors.status.error.base}>{dateErr}</AppText>
        )}

        {durationDays && (
          <View style={[styles.durationChip, { backgroundColor: theme.colors.status.success.light }]}>
            <AppText variant="small" weight="medium" color={theme.colors.status.success.foreground}>
              {t('leave.newVacationRequest.duration', { count: durationDays })}
            </AppText>
          </View>
        )}

        {/* ── Leave type ── */}
        <AppText variant="bodyLg" weight="semibold">
          {t('leave.newVacationRequest.leaveTypeSection')}
        </AppText>

        <Pressable
          style={[styles.card, styles.selectRow, typeErr && styles.cardError]}
          onPress={openTypeSheet}
        >
          <AppText
            variant="label"
            color={leaveType ? theme.colors.foreground : theme.colors.mutedForeground}
            style={{ flex: 1 }}
          >
            {leaveType
              ? pickLocalizedName(leaveType, i18n.language)
              : t('leave.newVacationRequest.selectLeaveType')}
          </AppText>
          <ChevronDown size={ws(16)} color={theme.colors.mutedForeground} />
        </Pressable>

        {typeErr && (
          <AppText variant="small" color={theme.colors.status.error.base}>{typeErr}</AppText>
        )}

        {/* Leave-type-specific warnings */}
        {leaveType?.requiresMedicalCertificate && (
          <AppAlertBanner
            variant="info"
            message={t('leave.newVacationRequest.medicalCertificateNote')}
          />
        )}
        {leaveType?.isOncePerCareer && (
          <AppAlertBanner
            variant="info"
            message={t('leave.newVacationRequest.oncePerCareerNote')}
          />
        )}
        {leaveType && !leaveType.allowSameDay && isStartDateToday && (
          <AppAlertBanner
            variant="warning"
            message={t('leave.newVacationRequest.errors.codes.sameDayNotAllowed')}
          />
        )}
        {leaveType?.maxConsecutiveDays !== undefined &&
          leaveType?.maxConsecutiveDays !== null && (
            <AppAlertBanner
              variant="info"
              message={t('leave.newVacationRequest.maxConsecutiveNote', {
                count: leaveType.maxConsecutiveDays,
              })}
            />
          )}

        {/* API error */}
        {errorMessage && (
          <AppAlertBanner variant="error" message={errorMessage} />
        )}

        {/* ── Notes ── */}
        <AppText variant="bodyLg" weight="semibold">
          {t('leave.newVacationRequest.notesSection')}
        </AppText>

        <View style={[styles.card, styles.notesCard]}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('leave.newVacationRequest.notesPlaceholder')}
            placeholderTextColor={theme.colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.notesInput, { color: theme.colors.foreground }]}
          />
        </View>

        {/* ── Attachments ── */}
        <AppPermissionGate permission={Permissions.Attachment.Upload}>
          <AppText variant="bodyLg" weight="semibold">
            Attachments
          </AppText>
          <AppAttachmentPicker
            attachments={attachments}
            onChange={setAttachments}
            disabled={isSubmitting}
          />
        </AppPermissionGate>

        {/* ── Summary ── */}
        {fromDate && toDate && leaveType && durationDays && (
          <>
            <AppText variant="bodyLg" weight="semibold">
              {t('leave.newVacationRequest.summarySection')}
            </AppText>
            <View style={styles.card}>
              <SummaryRow
                label={t('leave.newVacationRequest.summaryLeaveType')}
                value={pickLocalizedName(leaveType, i18n.language)}
                theme={theme}
              />
              <AppDivider />
              <SummaryRow
                label={t('leave.newVacationRequest.summaryFrom')}
                value={formatShortDate(fromDate)}
                theme={theme}
              />
              <AppDivider />
              <SummaryRow
                label={t('leave.newVacationRequest.summaryTo')}
                value={formatShortDate(toDate)}
                theme={theme}
              />
              <AppDivider />
              <SummaryRow
                label={t('leave.newVacationRequest.summaryDuration')}
                value={`${durationDays} ${
                  durationDays === 1
                    ? t('leave.requests.durationDay')
                    : t('leave.requests.durationDays', { count: durationDays })
                }`}
                theme={theme}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Sticky submit ── */}
      <View
        style={[
          styles.submitArea,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            paddingBottom: hs(16) + insets.bottom,
          },
        ]}
      >
        {submitSummary && (
          <AppText variant="small" color={theme.colors.mutedForeground} align="center">
            {submitSummary}
          </AppText>
        )}
        <AppButton
          label={t('leave.newVacationRequest.submitButton')}
          variant="primary"
          fullWidth
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={sameDayBlocked}
        />
      </View>

      {/* ── Pickers ── */}
      <PickerModal
        visible={pickerOpen === 'from'}
        value={pickerValue}
        onConfirm={applyDate}
        onCancel={() => setPickerOpen(null)}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.confirm')}
        cardBg={theme.colors.card}
      />
      <PickerModal
        visible={pickerOpen === 'to'}
        value={pickerValue}
        min={fromDate ?? undefined}
        max={endDateMax}
        onConfirm={applyDate}
        onCancel={() => setPickerOpen(null)}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.confirm')}
        cardBg={theme.colors.card}
      />

      {/* ── Leave type sheet ── */}
      <LeaveTypePickerSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={handleLeaveTypeSelect}
        selected={leaveType}
        showStartDateRequired={!fromDate}
      />
    </SafeAreaView>
  );
};

// ── Summary row ───────────────────────────────────────────────────────────────

interface SummaryRowProps {
  label: string;
  value: string;
  theme: AppTheme;
}

const SummaryRow: React.FC<SummaryRowProps> = ({ label, value, theme }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: hs(12), paddingHorizontal: ws(16) }}>
    <AppText variant="small" color={theme.colors.mutedForeground}>{label}</AppText>
    <AppText variant="small" weight="medium">{value}</AppText>
  </View>
);

// ── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    navHeader: {
      height: hs(56),
      paddingHorizontal: ws(16),
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(12),
    },
    navSpacer: {
      width: ws(32),
    },
    scroll: {
      paddingHorizontal: ws(20),
      gap: hs(12),
    },
    card: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.m,
      overflow: 'hidden',
    },
    cardError: {
      borderColor: theme.colors.status.error.base,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ws(16),
      height: hs(48),
    },
    durationChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: ws(12),
      paddingVertical: hs(6),
      borderRadius: theme.radius.pill,
    },
    selectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ws(16),
      height: hs(48),
    },
    notesCard: {
      padding: ws(12),
    },
    notesInput: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.sizes.base,
      minHeight: hs(96),
      padding: 0,
    },
    submitArea: {
      paddingHorizontal: ws(20),
      paddingTop: hs(16),
      borderTopWidth: 1,
      gap: hs(8),
    },
  });

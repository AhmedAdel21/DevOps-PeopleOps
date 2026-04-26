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
import { Calendar, ChevronDown } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppAlertBanner,
  AppBackButton,
  AppButton,
  AppDivider,
  AppText,
} from '@/presentation/components/atoms';
import { AppAttachmentPicker } from '@/presentation/components/molecules';
import type { PermissionType } from '@/domain/entities';
import type { UploadedAttachment } from '@/domain/repositories';
import { useAppDispatch, useAppSelector } from '@/presentation/store/hooks';
import { submitPermissionRequest } from '@/presentation/store/slices';
import {
  selectRequestPermissionStatus,
  selectRequestPermissionError,
  selectPermissionQuota,
} from '@/presentation/store/selectors';
import type { LeaveStackParamList } from '@/presentation/navigation/types';
import {
  PermissionTypePickerSheet,
  PERMISSION_TYPE_KEY,
} from './permission_type_picker_sheet';

// ── Date / time helpers ──────────────────────────────────────────────────────

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatFullDate = (d: Date): string =>
  `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const formatShortDate = (d: Date): string =>
  `${d.getDate()} ${MONTHS[d.getMonth()]}`;

const formatTime = (d: Date): string => {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const computeDurationMinutes = (start: Date, end: Date): number =>
  Math.round((end.getTime() - start.getTime()) / 60000);

const formatDuration = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// ── Picker modal ─────────────────────────────────────────────────────────────

interface PickerModalProps {
  visible: boolean;
  value: Date;
  mode: 'date' | 'time';
  onConfirm: (d: Date) => void;
  onCancel: () => void;
  cancelLabel: string;
  confirmLabel: string;
  cardBg: string;
}

const PickerModal: React.FC<PickerModalProps> = ({
  visible,
  value,
  mode,
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
        mode={mode}
        display="default"
        is24Hour
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
            mode={mode}
            display="spinner"
            is24Hour
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

// ── Screen ────────────────────────────────────────────────────────────────────

type PickerField = 'date' | 'startTime' | 'endTime';

export const NewPermissionRequestScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation =
    useNavigation<NativeStackNavigationProp<LeaveStackParamList>>();

  const dispatch        = useAppDispatch();
  const submitStatus    = useAppSelector(selectRequestPermissionStatus);
  const submitError     = useAppSelector(selectRequestPermissionError);
  const quota           = useAppSelector(selectPermissionQuota);

  // Form state
  const [permType,   setPermType]   = useState<PermissionType | null>(null);
  const [date,       setDate]       = useState<Date | null>(null);
  const [startTime,  setStartTime]  = useState<Date | null>(null);
  const [endTime,    setEndTime]    = useState<Date | null>(null);
  const [notes,      setNotes]      = useState('');
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [typeErr,    setTypeErr]    = useState<string | undefined>();
  const [dateErr,    setDateErr]    = useState<string | undefined>();
  const [timeErr,    setTimeErr]    = useState<string | undefined>();

  // Picker state
  const [pickerOpen,  setPickerOpen]  = useState<PickerField | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);

  // Navigate back after successful submit
  const prevStatus = useRef(submitStatus);
  useEffect(() => {
    if (prevStatus.current === 'pending' && submitStatus === 'idle') {
      navigation.goBack();
    }
    prevStatus.current = submitStatus;
  }, [submitStatus, navigation]);

  const durationMinutes = useMemo(() => {
    if (!startTime || !endTime) return null;
    const mins = computeDurationMinutes(startTime, endTime);
    return mins > 0 ? mins : null;
  }, [startTime, endTime]);

  const durationStr = useMemo(() => {
    if (durationMinutes === null) return null;
    return formatDuration(durationMinutes);
  }, [durationMinutes]);

  const openPicker = useCallback(
    (field: PickerField) => {
      if (field === 'date') {
        setPickerValue(date ?? new Date());
      } else if (field === 'startTime') {
        setPickerValue(startTime ?? new Date());
      } else {
        setPickerValue(endTime ?? startTime ?? new Date());
      }
      setPickerOpen(field);
    },
    [date, startTime, endTime],
  );

  const applyPicker = useCallback(
    (d: Date) => {
      if (pickerOpen === 'date') {
        setDate(d);
        setDateErr(undefined);
      } else if (pickerOpen === 'startTime') {
        setStartTime(d);
        setTimeErr(undefined);
      } else if (pickerOpen === 'endTime') {
        setEndTime(d);
        setTimeErr(undefined);
      }
      setPickerOpen(null);
    },
    [pickerOpen],
  );

  const handleTypeSelect = useCallback((type: PermissionType) => {
    setPermType(type);
    setTypeSheetOpen(false);
    setTypeErr(undefined);
  }, []);

  const handleSubmit = useCallback(() => {
    let hasError = false;
    if (!permType) {
      setTypeErr(t('leave.newPermissionRequest.errors.typeRequired'));
      hasError = true;
    }
    if (!date) {
      setDateErr(t('leave.newPermissionRequest.errors.dateRequired'));
      hasError = true;
    }
    if (!startTime || !endTime) {
      setTimeErr(t('leave.newPermissionRequest.errors.timeRequired'));
      hasError = true;
    } else if (endTime <= startTime) {
      setTimeErr(t('leave.newPermissionRequest.errors.invalidTime'));
      hasError = true;
    }
    if (hasError) return;

    dispatch(submitPermissionRequest({
      permissionType: permType!,
      date: toIsoDate(date!),
      startTime: formatTime(startTime!),
      endTime: formatTime(endTime!),
      notes: notes.trim() || undefined,
      attachmentIds: attachments.length > 0 ? attachments.map(a => a.id) : undefined,
    }));
  }, [permType, date, startTime, endTime, notes, attachments, dispatch, t]);

  const isSubmitting = submitStatus === 'pending';
  const isHalfDay    = permType === 'HalfDay';

  const quotaResetDate = useMemo(() => {
    if (!quota) return '';
    const [, m, d] = quota.monthResetsAt.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]}`;
  }, [quota]);

  const submitSummary = useMemo(() => {
    if (!durationStr || !permType || !date) return null;
    return t('leave.newPermissionRequest.submitSummary', {
      duration: durationStr,
      type: t(PERMISSION_TYPE_KEY[permType]),
      date: formatShortDate(date),
    });
  }, [durationStr, permType, date, t]);

  const permTypeDotColor = useMemo(() => {
    if (!permType) return theme.colors.mutedForeground;
    const map: Record<PermissionType, string> = {
      Late:      theme.colors.status.warning.base,
      Early:     theme.colors.status.success.base,
      MiddleDay: theme.colors.status.info.base,
      HalfDay:   '#8B5CF6',
    };
    return map[permType];
  }, [permType, theme]);

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      {/* Nav header */}
      <View style={styles.navHeader}>
        <AppBackButton onPress={() => navigation.goBack()} />
        <AppText variant="title">{t('leave.newPermissionRequest.navTitle')}</AppText>
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
        {/* ── Permission type ── */}
        <AppText variant="bodyLg" weight="semibold">
          {t('leave.newPermissionRequest.typeSection')}
        </AppText>

        <Pressable
          style={[styles.card, styles.selectRow, typeErr && styles.cardError]}
          onPress={() => setTypeSheetOpen(true)}
        >
          {permType ? (
            <View style={[styles.dot, { backgroundColor: permTypeDotColor }]} />
          ) : null}
          <AppText
            variant="label"
            color={permType ? theme.colors.foreground : theme.colors.mutedForeground}
            style={{ flex: 1 }}
          >
            {permType
              ? t(PERMISSION_TYPE_KEY[permType])
              : t('leave.newPermissionRequest.selectType')}
          </AppText>
          <ChevronDown size={ws(16)} color={theme.colors.mutedForeground} />
        </Pressable>

        {typeErr && (
          <AppText variant="small" color={theme.colors.status.error.base}>{typeErr}</AppText>
        )}

        {/* ── Date ── */}
        <AppText variant="bodyLg" weight="semibold">
          {t('leave.newPermissionRequest.dateSection')}
        </AppText>

        <Pressable
          style={[styles.card, styles.selectRow, dateErr && styles.cardError]}
          onPress={() => openPicker('date')}
        >
          <Calendar size={ws(18)} color={theme.colors.mutedForeground} />
          <AppText
            variant="label"
            color={date ? theme.colors.foreground : theme.colors.mutedForeground}
            style={{ flex: 1 }}
          >
            {date ? formatFullDate(date) : t('leave.newPermissionRequest.dateSection')}
          </AppText>
        </Pressable>

        {dateErr && (
          <AppText variant="small" color={theme.colors.status.error.base}>{dateErr}</AppText>
        )}

        {/* ── Time window ── */}
        <AppText variant="bodyLg" weight="semibold">
          {t('leave.newPermissionRequest.timeSection')}
        </AppText>

        <View style={styles.timeRow}>
          <View style={styles.timeColumn}>
            <AppText variant="small" color={theme.colors.mutedForeground}>
              {t('leave.newPermissionRequest.startLabel')}
            </AppText>
            <Pressable
              style={[styles.card, styles.timeCard, timeErr && styles.cardError]}
              onPress={() => openPicker('startTime')}
            >
              <AppText
                variant="label"
                color={startTime ? theme.colors.foreground : theme.colors.mutedForeground}
                align="center"
              >
                {startTime ? formatTime(startTime) : '—:——'}
              </AppText>
            </Pressable>
          </View>

          <AppText variant="label" color={theme.colors.mutedForeground} style={styles.timeDash}>–</AppText>

          <View style={styles.timeColumn}>
            <AppText variant="small" color={theme.colors.mutedForeground}>
              {t('leave.newPermissionRequest.endLabel')}
            </AppText>
            <Pressable
              style={[styles.card, styles.timeCard, timeErr && styles.cardError]}
              onPress={() => openPicker('endTime')}
            >
              <AppText
                variant="label"
                color={endTime ? theme.colors.foreground : theme.colors.mutedForeground}
                align="center"
              >
                {endTime ? formatTime(endTime) : '—:——'}
              </AppText>
            </Pressable>
          </View>
        </View>

        {timeErr && (
          <AppText variant="small" color={theme.colors.status.error.base}>{timeErr}</AppText>
        )}

        {durationStr && (
          <View style={[styles.durationRow, { backgroundColor: theme.colors.status.success.light }]}>
            <AppText variant="small" weight="medium" color={theme.colors.status.success.foreground}>
              {t('leave.newPermissionRequest.durationWithinLimit', { duration: durationStr })}
            </AppText>
          </View>
        )}

        {/* ── Quota banner ── */}
        {quota && (
          <AppAlertBanner
            variant="info"
            message={t('leave.newPermissionRequest.quotaBanner', {
              used: quota.permissionsUsed,
              allowed: quota.permissionsAllowed,
              date: quotaResetDate,
            })}
          />
        )}

        {/* ── Half-day banner ── */}
        {isHalfDay && (
          <AppAlertBanner
            variant="warning"
            message={t('leave.newPermissionRequest.halfDayBanner')}
          />
        )}

        {/* API error */}
        {submitError && (
          <AppAlertBanner variant="error" message={submitError.message} />
        )}

        {/* ── Notes ── */}
        <AppText variant="bodyLg" weight="semibold">
          {t('leave.newPermissionRequest.notesSection')}
        </AppText>

        <View style={[styles.card, styles.notesCard]}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('leave.newPermissionRequest.notesPlaceholder')}
            placeholderTextColor={theme.colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.notesInput, { color: theme.colors.foreground }]}
          />
        </View>

        {/* ── Attachments ── */}
        <AppText variant="bodyLg" weight="semibold">
          Attachments
        </AppText>
        <AppAttachmentPicker
          attachments={attachments}
          onChange={setAttachments}
          disabled={isSubmitting}
        />
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
          label={t('leave.newPermissionRequest.submitButton')}
          variant="primary"
          fullWidth
          onPress={handleSubmit}
          loading={isSubmitting}
        />
      </View>

      {/* ── Picker (single instance, keyed per field to force clean state) ── */}
      {pickerOpen !== null && (
        <PickerModal
          key={pickerOpen}
          visible
          value={pickerValue}
          mode={pickerOpen === 'date' ? 'date' : 'time'}
          onConfirm={applyPicker}
          onCancel={() => setPickerOpen(null)}
          cancelLabel={t('common.cancel')}
          confirmLabel={t('common.confirm')}
          cardBg={theme.colors.card}
        />
      )}

      {/* ── Permission type sheet ── */}
      <PermissionTypePickerSheet
        visible={typeSheetOpen}
        onClose={() => setTypeSheetOpen(false)}
        onSelect={handleTypeSelect}
        selected={permType}
        quota={quota}
      />
    </SafeAreaView>
  );
};

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
    selectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(10),
      paddingHorizontal: ws(16),
      height: hs(48),
    },
    dot: {
      width: ws(10),
      height: ws(10),
      borderRadius: ws(5),
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: ws(12),
    },
    timeColumn: {
      flex: 1,
      gap: hs(6),
    },
    timeCard: {
      height: hs(48),
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeDash: {
      paddingBottom: hs(14),
    },
    durationRow: {
      paddingHorizontal: ws(12),
      paddingVertical: hs(8),
      borderRadius: theme.radius.m,
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

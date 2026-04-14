import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Building, Clock, House, type LucideIcon } from 'lucide-react-native';
import DateTimePicker, {
    DateTimePickerAndroid,
    type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
    AppBottomSheet,
    AppButton,
    AppText,
} from '@/presentation/components/atoms';

export type WorkMode = 'office' | 'remote';

export interface SignInLocationSheetProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (mode: WorkMode, time: Date) => void;
}

interface ModeOption {
    mode: WorkMode;
    icon: LucideIcon;
    accentKey: 'primary' | 'info';
}

const MODE_OPTIONS: ModeOption[] = [
    { mode: 'office', icon: Building, accentKey: 'primary' },
    { mode: 'remote', icon: House, accentKey: 'info' },
];

export const SignInLocationSheet: React.FC<SignInLocationSheetProps> = ({
    visible,
    onClose,
    onConfirm,
}) => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [selected, setSelected] = useState<WorkMode | null>(null);
    const [signInTime, setSignInTime] = useState<Date>(() => new Date());
    const [iosPickerOpen, setIosPickerOpen] = useState(false);

    // When the sheet (re)opens, snap the time back to "now" so it's a fresh
    // sign-in by default and the subtitle stays in sync.
    useEffect(() => {
        if (visible) {
            setSignInTime(new Date());
        }
    }, [visible]);

    const date = signInTime.toLocaleDateString(i18n.language, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    const timeText = signInTime.toLocaleTimeString(i18n.language, {
        hour: 'numeric',
        minute: '2-digit',
    });
    const subtitle = t('home.signInSheet.subtitle', { date, time: timeText });

    const handlePickerChange = (event: DateTimePickerEvent, picked?: Date) => {
        if (event.type === 'set' && picked) {
            setSignInTime(picked);
        }
    };

    const openTimePicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                mode: 'time',
                value: signInTime,
                is24Hour: false,
                onChange: handlePickerChange,
            });
        } else {
            setIosPickerOpen((prev) => !prev);
        }
    };

    const handleConfirm = () => {
        if (!selected) return;
        onConfirm(selected, signInTime);
        setSelected(null);
        setIosPickerOpen(false);
    };

    const handleClose = () => {
        setSelected(null);
        setIosPickerOpen(false);
        onClose();
    };

    return (
        <AppBottomSheet visible={visible} onClose={handleClose} heightFraction={0.6}>
            <View style={styles.content}>
                <AppText variant="title" align="center">
                    {t('home.signInSheet.title')}
                </AppText>
                <AppText
                    variant="caption"
                    align="center"
                    color={theme.colors.mutedForeground}
                    style={styles.subtitle}
                >
                    {subtitle}
                </AppText>

                <Pressable
                    onPress={openTimePicker}
                    style={[
                        styles.timeRow,
                        {
                            backgroundColor: theme.colors.muted,
                            borderColor: theme.colors.border,
                        },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t('home.signInSheet.timeLabel')}
                >
                    <View
                        style={[
                            styles.timeIconBox,
                            { backgroundColor: theme.colors.background },
                        ]}
                    >
                        <Clock size={ws(20)} color={theme.colors.primary} />
                    </View>
                    <View style={styles.timeTextCol}>
                        <AppText
                            variant="caption"
                            color={theme.colors.mutedForeground}
                        >
                            {t('home.signInSheet.timeLabel')}
                        </AppText>
                        <AppText variant="cardTitle">{timeText}</AppText>
                    </View>
                </Pressable>

                {Platform.OS === 'ios' && iosPickerOpen && (
                    <DateTimePicker
                        mode="time"
                        display="spinner"
                        value={signInTime}
                        onChange={handlePickerChange}
                        themeVariant={theme.dark ? 'dark' : 'light'}
                        style={styles.iosPicker}
                    />
                )}

                <View style={styles.cards}>
                    {MODE_OPTIONS.map((option) => {
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
                                        backgroundColor: isSelected
                                            ? accent.light
                                            : theme.colors.card,
                                        borderColor: isSelected
                                            ? accent.base
                                            : theme.colors.border,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.iconBox,
                                        {
                                            backgroundColor: isSelected
                                                ? theme.colors.background
                                                : accent.light,
                                        },
                                    ]}
                                >
                                    <Icon size={ws(24)} color={accent.base} />
                                </View>

                                <View style={styles.cardText}>
                                    <AppText variant="cardTitle">
                                        {t(`home.signInSheet.modes.${option.mode}.title`)}
                                    </AppText>
                                    <AppText
                                        variant="caption"
                                        color={theme.colors.mutedForeground}
                                    >
                                        {t(`home.signInSheet.modes.${option.mode}.body`)}
                                    </AppText>
                                </View>

                                <View
                                    style={[
                                        styles.radio,
                                        {
                                            borderColor: isSelected
                                                ? accent.base
                                                : theme.colors.borderStrong,
                                        },
                                    ]}
                                >
                                    {isSelected && (
                                        <View
                                            style={[
                                                styles.radioDot,
                                                { backgroundColor: accent.base },
                                            ]}
                                        />
                                    )}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                <AppButton
                    label={t('home.signInSheet.confirm')}
                    onPress={handleConfirm}
                    disabled={!selected}
                    fullWidth
                    style={styles.confirm}
                />

                <Pressable onPress={handleClose} hitSlop={8} style={styles.cancelRow}>
                    <AppText
                        variant="label"
                        color={theme.colors.mutedForeground}
                        align="center"
                    >
                        {t('home.signInSheet.cancel')}
                    </AppText>
                </Pressable>
            </View>
        </AppBottomSheet>
    );
};

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

const createStyles = (theme: AppTheme) =>
    StyleSheet.create({
        content: {
            paddingHorizontal: ws(20),
            paddingTop: hs(8),
            paddingBottom: hs(12),
            gap: hs(12),
        },
        subtitle: {
            marginTop: hs(-4),
        },
        timeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: ws(12),
            paddingVertical: hs(10),
            paddingHorizontal: ws(14),
            borderRadius: theme.radius.m,
            borderWidth: 1,
        },
        timeIconBox: {
            width: ws(36),
            height: ws(36),
            borderRadius: theme.radius.m,
            alignItems: 'center',
            justifyContent: 'center',
        },
        timeTextCol: {
            flex: 1,
            gap: hs(2),
        },
        iosPicker: {
            alignSelf: 'center',
            width: '100%',
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

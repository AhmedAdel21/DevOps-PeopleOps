import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
    Building,
    Clock4,
    House,
    type LucideIcon,
} from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
    AppBadge,
    AppButton,
    AppCard,
    AppText,
} from '@/presentation/components/atoms';
import { AppHeaderBar } from '@/presentation/components/organisms';
import {
    SignInLocationSheet,
    type WorkMode,
} from './sign_in_location_sheet';

export type HomeStatus = 'notSignedIn' | 'signedInOffice' | 'signedInRemote';

export type RecentMode = 'office' | 'remote';

export interface RecentEntry {
    id: string;
    /** Localized short date, e.g. "Mon, 7 Apr". */
    date: string;
    mode: RecentMode;
    /** Localized duration, e.g. "8h 12m". */
    duration: string;
    /** True when the day was completed (sign-in + sign-out captured). */
    complete: boolean;
    /** Whether the badge should use the success/highlight color. */
    highlight?: boolean;
}

export interface HomeScreenProps {
    userName?: string;
    annualLeaveDays?: number;
    casualLeaveDays?: number;
    hasUnreadNotifications?: boolean;
    recentEntries?: RecentEntry[];
    /** Initial status; the screen owns the state internally and updates on
     *  sign-in/sign-out until a real attendance domain wires this up. */
    initialStatus?: HomeStatus;
    onOpenNotifications?: () => void;
    onOpenProfile?: () => void;
    onViewHistory?: () => void;
}

const DEFAULT_RECENT: RecentEntry[] = [
    { id: '1', date: 'Mon, 7 Apr', mode: 'office', duration: '8h 12m', complete: true, highlight: true },
    { id: '2', date: 'Sun, 6 Apr', mode: 'remote', duration: '7h 45m', complete: true },
    { id: '3', date: 'Sat, 5 Apr', mode: 'office', duration: '4h 30m', complete: false },
];

interface StatusVisuals {
    accentColor: string;
    iconBg: string;
    iconColor: string;
    icon: LucideIcon;
    titleKey: string;
    subtitleKey: string;
    todayLabelKey: string;
    todayDotColor: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
    userName = 'Ahmed',
    annualLeaveDays = 18,
    casualLeaveDays = 4,
    hasUnreadNotifications = true,
    recentEntries = DEFAULT_RECENT,
    initialStatus = 'notSignedIn',
    onOpenNotifications,
    onOpenProfile,
    onViewHistory,
}) => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [status, setStatus] = useState<HomeStatus>(initialStatus);
    const [signInSheetVisible, setSignInSheetVisible] = useState(false);
    const [signedInSince, setSignedInSince] = useState<Date | null>(null);

    const isSignedIn = status !== 'notSignedIn';

    const greeting = useMemo(
        () => buildGreeting(userName, t),
        [userName, t],
    );

    const today = useMemo(
        () =>
            new Date().toLocaleDateString(i18n.language, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }),
        [i18n.language],
    );

    const visuals = useMemo(
        () => buildStatusVisuals(theme, status),
        [theme, status],
    );

    const sinceLabel = useMemo(() => {
        if (!signedInSince || !isSignedIn) return null;
        const time = signedInSince.toLocaleTimeString(i18n.language, {
            hour: 'numeric',
            minute: '2-digit',
        });
        const elapsedMs = Date.now() - signedInSince.getTime();
        const elapsed = formatElapsed(elapsedMs);
        return t(`${visuals.subtitleKey}`, { time, elapsed });
    }, [signedInSince, isSignedIn, i18n.language, t, visuals.subtitleKey]);

    const handleOpenSignIn = useCallback(() => {
        setSignInSheetVisible(true);
    }, []);

    const handleCloseSignIn = useCallback(() => {
        setSignInSheetVisible(false);
    }, []);

    const handleConfirmSignIn = useCallback((mode: WorkMode, time: Date) => {
        setStatus(mode === 'office' ? 'signedInOffice' : 'signedInRemote');
        setSignedInSince(time);
        setSignInSheetVisible(false);
    }, []);

    const handleSignOut = useCallback(() => {
        setStatus('notSignedIn');
        setSignedInSince(null);
    }, []);

    return (
        <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
            <AppHeaderBar
                userName={userName}
                hasUnreadNotifications={hasUnreadNotifications}
                onAvatarPress={onOpenProfile}
                onNotificationsPress={onOpenNotifications}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Greeting */}
                <View style={styles.greeting}>
                    <AppText variant="title">{greeting}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedForeground}>
                        {today}
                    </AppText>
                </View>

                {/* Status card — accent + icon + copy swap per status */}
                <AppCard
                    style={[
                        styles.statusCard,
                        { borderLeftColor: visuals.accentColor },
                    ]}
                    contentStyle={styles.statusContent}
                >
                    <View
                        style={[
                            styles.statusIconBox,
                            { backgroundColor: visuals.iconBg },
                        ]}
                    >
                        <visuals.icon size={ws(24)} color={visuals.iconColor} />
                    </View>
                    <View style={styles.statusText}>
                        <AppText variant="cardTitle">{t(visuals.titleKey)}</AppText>
                        <AppText variant="caption" color={theme.colors.mutedForeground}>
                            {isSignedIn && sinceLabel
                                ? sinceLabel
                                : t(visuals.subtitleKey)}
                        </AppText>
                    </View>
                </AppCard>

                {/* CTA — Sign In (primary) or Sign Out (outline destructive) */}
                {isSignedIn ? (
                    <AppButton
                        label={t('home.signOut')}
                        onPress={handleSignOut}
                        variant="outlineDestructive"
                        fullWidth
                    />
                ) : (
                    <AppButton
                        label={t('home.notSignedIn.signInCta')}
                        onPress={handleOpenSignIn}
                        fullWidth
                    />
                )}

                {/* Today summary strip — only in signed-in states */}
                {isSignedIn && (
                    <View style={styles.todayStrip}>
                        <View
                            style={[
                                styles.todayDot,
                                { backgroundColor: visuals.todayDotColor },
                            ]}
                        />
                        <AppText variant="caption">
                            {t(visuals.todayLabelKey)}
                        </AppText>
                    </View>
                )}

                {/* Leave balance — only when not signed in */}
                {!isSignedIn && (
                    <View style={styles.leaveRow}>
                        <AppBadge
                            label={t('home.leaveBalance.annual', { count: annualLeaveDays })}
                        />
                        <AppBadge
                            label={t('home.leaveBalance.casual', { count: casualLeaveDays })}
                        />
                        <AppBadge label={t('home.leaveBalance.sick')} />
                    </View>
                )}

                {/* Recent section */}
                <View style={styles.recentSection}>
                    <AppText variant="cardTitle">{t('home.recentTitle')}</AppText>

                    {recentEntries.map((entry) => (
                        <View key={entry.id} style={styles.recentRow}>
                            <AppText
                                variant="caption"
                                color={theme.colors.mutedForeground}
                                style={styles.recentDate}
                            >
                                {entry.date}
                            </AppText>
                            <AppBadge
                                label={t(`home.mode.${entry.mode}`)}
                                variant={entry.highlight ? 'success' : 'neutral'}
                            />
                            <AppText
                                variant="caption"
                                color={theme.colors.foreground}
                                weight="medium"
                                style={styles.recentDuration}
                            >
                                {entry.duration}
                            </AppText>
                            <View
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: entry.complete
                                            ? theme.colors.status.success.base
                                            : theme.colors.mutedForeground,
                                    },
                                ]}
                            />
                        </View>
                    ))}

                    <Pressable
                        onPress={onViewHistory}
                        hitSlop={8}
                        disabled={!onViewHistory}
                    >
                        <AppText
                            variant="caption"
                            color={theme.colors.primary}
                            align="center"
                        >
                            {t('home.historyLink')}
                        </AppText>
                    </Pressable>
                </View>
            </ScrollView>

            <SignInLocationSheet
                visible={signInSheetVisible}
                onClose={handleCloseSignIn}
                onConfirm={handleConfirmSignIn}
            />
        </SafeAreaView>
    );
};

const buildStatusVisuals = (
    theme: AppTheme,
    status: HomeStatus,
): StatusVisuals => {
    switch (status) {
        case 'signedInOffice':
            return {
                accentColor: theme.colors.status.success.base,
                iconBg: theme.colors.status.success.light,
                iconColor: theme.colors.status.success.base,
                icon: Building,
                titleKey: 'home.signedInOffice.statusTitle',
                subtitleKey: 'home.signedInOffice.statusSubtitle',
                todayLabelKey: 'home.signedInOffice.todayLabel',
                todayDotColor: theme.colors.status.success.base,
            };
        case 'signedInRemote':
            return {
                accentColor: theme.colors.status.info.base,
                iconBg: theme.colors.status.info.light,
                iconColor: theme.colors.status.info.base,
                icon: House,
                titleKey: 'home.signedInRemote.statusTitle',
                subtitleKey: 'home.signedInRemote.statusSubtitle',
                todayLabelKey: 'home.signedInRemote.todayLabel',
                todayDotColor: theme.colors.status.info.base,
            };
        case 'notSignedIn':
        default:
            return {
                accentColor: theme.colors.mutedForeground,
                iconBg: theme.colors.muted,
                iconColor: theme.colors.mutedForeground,
                icon: Clock4,
                titleKey: 'home.notSignedIn.statusTitle',
                subtitleKey: 'home.notSignedIn.statusSubtitle',
                todayLabelKey: '',
                todayDotColor: theme.colors.mutedForeground,
            };
    }
};

const buildGreeting = (
    name: string,
    t: (key: string, options?: Record<string, unknown>) => string,
): string => {
    const hour = new Date().getHours();
    const key =
        hour < 12
            ? 'home.greetingMorning'
            : hour < 18
                ? 'home.greetingAfternoon'
                : 'home.greetingEvening';
    return t(key, { name });
};

const formatElapsed = (ms: number): string => {
    const totalMinutes = Math.max(0, Math.floor(ms / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
};

const createStyles = (theme: AppTheme) =>
    StyleSheet.create({
        flex: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        scrollContent: {
            paddingHorizontal: ws(20),
            paddingVertical: hs(20),
            gap: theme.spacing.l,
        },
        greeting: {
            gap: hs(4),
        },
        statusCard: {
            borderLeftWidth: 4,
        },
        statusContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.m - ws(4),
        },
        statusIconBox: {
            width: ws(48),
            height: ws(48),
            borderRadius: theme.radius.m,
            alignItems: 'center',
            justifyContent: 'center',
        },
        statusText: {
            flex: 1,
            gap: hs(4),
        },
        todayStrip: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.s,
        },
        todayDot: {
            width: ws(8),
            height: ws(8),
            borderRadius: ws(4),
        },
        leaveRow: {
            flexDirection: 'row',
            gap: theme.spacing.s,
        },
        recentSection: {
            gap: hs(12),
        },
        recentRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: hs(12),
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            gap: theme.spacing.s,
        },
        recentDate: {
            minWidth: ws(70),
        },
        recentDuration: {
            marginLeft: 'auto',
        },
        dot: {
            width: ws(8),
            height: ws(8),
            borderRadius: ws(4),
        },
    });

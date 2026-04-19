import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    AppAlertBanner,
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
import {
    useAppDispatch,
    useAppSelector,
} from '@/presentation/store/hooks';
import {
    fetchAttendanceStatus,
    signInAttendance,
    signOutAttendance,
    clearAttendanceErrors,
} from '@/presentation/store/slices';
import {
    selectAttendanceCurrent,
    selectAttendanceFetchError,
    selectAttendanceFetchStatus,
    selectAttendanceSignInError,
    selectAttendanceSignInStatus,
    selectAttendanceSignOutError,
    selectAttendanceSignOutStatus,
} from '@/presentation/store/selectors';
import type { AttendanceErrorCode } from '@/domain/errors';
import { attendanceLog } from '@/core/logger';
import { ServiceLocator } from '@/di/service_locator';
import { DiKeys } from '@/core/keys/di.key';
import type { SlackOAuthRemoteDataSource } from '@/data/data_sources/slack/slack_oauth.remote_data_source';

export type HomeStatus = 'notSignedIn' | 'signedInOffice' | 'signedInRemote';

export type RecentMode = 'office' | 'remote';

export interface RecentEntry {
    id: string;
    date: string;
    mode: RecentMode;
    duration: string;
    complete: boolean;
    highlight?: boolean;
}

export interface HomeScreenProps {
    userName?: string;
    annualLeaveDays?: number;
    casualLeaveDays?: number;
    hasUnreadNotifications?: boolean;
    recentEntries?: RecentEntry[];
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

const ERROR_I18N_KEY: Record<AttendanceErrorCode, string> = {
    unauthenticated: 'home.errors.sessionExpired',
    'employee-not-linked': 'home.errors.employeeNotLinked',
    'invalid-state': 'home.errors.invalidState',
    'slack-oauth-required': 'home.errors.slackOAuthRequired',
    network: 'home.errors.network',
    unknown: 'home.errors.generic',
};

const resolveErrorCode = (code: string | undefined): AttendanceErrorCode => {
    if (!code?.startsWith('attendance/')) return 'unknown';
    const tail = code.slice('attendance/'.length) as AttendanceErrorCode;
    return tail in ERROR_I18N_KEY ? tail : 'unknown';
};

const domainToHomeStatus = (
    status: 'not_signed_in' | 'in_office' | 'wfh',
): HomeStatus => {
    switch (status) {
        case 'in_office':
            return 'signedInOffice';
        case 'wfh':
            return 'signedInRemote';
        default:
            return 'notSignedIn';
    }
};

const workModeToPlace = (mode: WorkMode) =>
    mode === 'office' ? ('in_office' as const) : ('wfh' as const);

export const HomeScreen: React.FC<HomeScreenProps> = ({
    userName: userNameProp,
    annualLeaveDays = 18,
    casualLeaveDays = 4,
    hasUnreadNotifications = true,
    recentEntries = DEFAULT_RECENT,
    onOpenNotifications,
    onOpenProfile,
    onViewHistory,
}) => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const dispatch = useAppDispatch();
    const current = useAppSelector(selectAttendanceCurrent);
    const fetchStatus = useAppSelector(selectAttendanceFetchStatus);
    const fetchError = useAppSelector(selectAttendanceFetchError);
    const signInStatus = useAppSelector(selectAttendanceSignInStatus);
    const signInError = useAppSelector(selectAttendanceSignInError);
    const signOutStatus = useAppSelector(selectAttendanceSignOutStatus);
    const signOutError = useAppSelector(selectAttendanceSignOutError);

    const [signInSheetVisible, setSignInSheetVisible] = useState(false);

    // null = still checking, true/false = result
    const [slackConnected, setSlackConnected] = useState<boolean | null>(null);

    const checkSlackStatus = useCallback(() => {
        const slackDs = ServiceLocator.get<SlackOAuthRemoteDataSource>(
            DiKeys.SLACK_OAUTH_DATA_SOURCE,
        );
        slackDs
            .getConnectionStatus()
            .then(connected => setSlackConnected(connected))
            .catch(() => setSlackConnected(false));
    }, []);

    // Fetch current attendance status and Slack connection status on mount.
    useEffect(() => {
        attendanceLog.info(
            'screen',
            'HomeScreen mount → dispatching fetchAttendanceStatus',
        );
        dispatch(fetchAttendanceStatus());
        checkSlackStatus();
    }, [dispatch, checkSlackStatus]);

    // Re-check Slack status when the user returns from the profile screen
    // (e.g. after completing OAuth). Uses the Linking deep-link for connected
    // and also handles the case where the user navigates back normally.
    useEffect(() => {
        const { Linking } = require('react-native');
        const sub = Linking.addEventListener('url', ({ url }: { url: string }) => {
            if (url === 'devops-peopleops://slack-oauth/connected') {
                checkSlackStatus();
            }
        });
        return () => sub.remove();
    }, [checkSlackStatus]);

    const status: HomeStatus = domainToHomeStatus(
        current?.status ?? 'not_signed_in',
    );
    const isSignedIn = status !== 'notSignedIn';

    const userName = current?.displayName ?? userNameProp ?? 'there';

    const signedInSince = useMemo(() => {
        if (!current?.signInAtIso) return null;
        return new Date(current.signInAtIso);
    }, [current?.signInAtIso]);

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

    const errorMessage = useMemo(() => {
        const err = signInError ?? signOutError ?? fetchError;
        if (!err) return null;
        return t(ERROR_I18N_KEY[resolveErrorCode(err.code)]);
    }, [signInError, signOutError, fetchError, t]);

    const isBusy =
        fetchStatus === 'pending' ||
        signInStatus === 'pending' ||
        signOutStatus === 'pending';

    // Block attendance actions until the Slack connection check completes and
    // confirms the user has completed OAuth. null = loading, false = not connected.
    const slackReady = slackConnected === true;

    const handleOpenSignIn = useCallback(() => {
        dispatch(clearAttendanceErrors());
        setSignInSheetVisible(true);
    }, [dispatch]);

    const handleCloseSignIn = useCallback(() => {
        setSignInSheetVisible(false);
    }, []);

    const handleConfirmSignIn = useCallback(
        async (mode: WorkMode, _time: Date) => {
            const place = workModeToPlace(mode);
            attendanceLog.info(
                'screen',
                `HomeScreen → confirm sign-in (mode=${mode}, place=${place})`,
            );
            setSignInSheetVisible(false);
            await dispatch(signInAttendance({ place }));
        },
        [dispatch],
    );

    const handleSignOut = useCallback(async () => {
        attendanceLog.info('screen', 'HomeScreen → sign-out pressed');
        await dispatch(signOutAttendance());
    }, [dispatch]);

    const handleDismissError = useCallback(() => {
        dispatch(clearAttendanceErrors());
    }, [dispatch]);

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
                <View style={styles.greeting}>
                    <AppText variant="title">{greeting}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedForeground}>
                        {today}
                    </AppText>
                </View>

                {slackConnected === false && (
                    <Pressable onPress={onOpenProfile}>
                        <AppAlertBanner
                            variant="warning"
                            message={`${t('home.slackBanner.message')} ${t('home.slackBanner.cta')} →`}
                        />
                    </Pressable>
                )}

                {errorMessage && (
                    <Pressable onPress={handleDismissError}>
                        <AppAlertBanner variant="error" message={errorMessage} />
                    </Pressable>
                )}

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

                {isSignedIn ? (
                    <AppButton
                        label={t('home.signOut')}
                        onPress={handleSignOut}
                        variant="outlineDestructive"
                        loading={signOutStatus === 'pending'}
                        disabled={isBusy || !slackReady}
                        fullWidth
                    />
                ) : (
                    <AppButton
                        label={t('home.notSignedIn.signInCta')}
                        onPress={handleOpenSignIn}
                        loading={fetchStatus === 'pending' && !current}
                        disabled={isBusy || !slackReady}
                        fullWidth
                    />
                )}

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

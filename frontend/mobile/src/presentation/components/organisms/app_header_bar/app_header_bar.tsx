import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppAvatar } from '@/presentation/components/molecules';

export interface AppHeaderBarProps {
    /** Full name shown as initials in the avatar. */
    userName: string;
    hasUnreadNotifications?: boolean;
    onAvatarPress?: () => void;
    onNotificationsPress?: () => void;
    style?: ViewStyle;
}

export const AppHeaderBar: React.FC<AppHeaderBarProps> = ({
    userName,
    hasUnreadNotifications = false,
    onAvatarPress,
    onNotificationsPress,
    style,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => buildStyles(theme), [theme]);

    return (
        <View style={[styles.bar, style]}>
            <Pressable
                onPress={onAvatarPress}
                hitSlop={8}
                disabled={!onAvatarPress}
                accessibilityRole="button"
                accessibilityLabel="profile"
            >
                <AppAvatar name={userName} size="md" backgroundColor={theme.colors.primary} textColor={theme.colors.primaryForeground} />
            </Pressable>

            <Pressable
                onPress={onNotificationsPress}
                hitSlop={8}
                disabled={!onNotificationsPress}
                style={styles.bellWrap}
                accessibilityRole="button"
                accessibilityLabel="notifications"
            >
                <Bell size={ws(22)} color={theme.colors.foreground} />
                {hasUnreadNotifications && (
                    <View
                        style={[
                            styles.dot,
                            { backgroundColor: theme.colors.destructive },
                        ]}
                    />
                )}
            </Pressable>
        </View>
    );
};

const buildStyles = (_theme: AppTheme) =>
    StyleSheet.create({
        bar: {
            width: '100%',
            height: hs(56),
            paddingHorizontal: ws(20),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        bellWrap: {
            width: ws(22),
            height: ws(22),
            alignItems: 'center',
            justifyContent: 'center',
        },
        dot: {
            position: 'absolute',
            top: 0,
            right: 0,
            width: ws(8),
            height: ws(8),
            borderRadius: ws(4),
        },
    });

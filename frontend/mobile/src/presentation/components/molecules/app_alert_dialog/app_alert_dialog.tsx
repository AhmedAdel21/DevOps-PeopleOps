import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppButton, AppText } from '@/presentation/components/atoms';

export interface AppAlertDialogProps {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    cancelLabel?: string;
    onCancel?: () => void;
    icon?: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    destructive?: boolean;
    dismissOnBackdrop?: boolean;
}

export const AppAlertDialog: React.FC<AppAlertDialogProps> = ({
    visible,
    title,
    message,
    confirmLabel,
    onConfirm,
    cancelLabel,
    onCancel,
    icon: Icon,
    iconColor,
    iconBg,
    destructive = false,
    dismissOnBackdrop = false,
}) => {
    const { theme } = useTheme();
    const styles = buildStyles(theme);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.92)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 180,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    damping: 16,
                    stiffness: 220,
                    mass: 0.8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.92);
        }
    }, [visible, fadeAnim, scaleAnim]);

    const handleBackdropPress = () => {
        if (dismissOnBackdrop) {
            (onCancel ?? onConfirm)();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onCancel ?? onConfirm}
        >
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
                <Animated.View
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.colors.card,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {Icon ? (
                        <View
                            style={[
                                styles.iconCircle,
                                {
                                    backgroundColor:
                                        iconBg ??
                                        (destructive
                                            ? theme.colors.status.error.light
                                            : theme.colors.primaryLight),
                                },
                            ]}
                        >
                            <Icon
                                size={ws(28)}
                                color={
                                    iconColor ??
                                    (destructive
                                        ? theme.colors.status.error.base
                                        : theme.colors.primary)
                                }
                            />
                        </View>
                    ) : null}

                    <AppText variant="subtitle" align="center" weight="bold">
                        {title}
                    </AppText>
                    <AppText
                        variant="body"
                        align="center"
                        color={theme.colors.mutedForeground}
                    >
                        {message}
                    </AppText>

                    <View style={styles.actions}>
                        {cancelLabel && onCancel ? (
                            <AppButton
                                label={cancelLabel}
                                variant="outline"
                                onPress={onCancel}
                                fullWidth
                            />
                        ) : null}
                        <AppButton
                            label={confirmLabel}
                            variant={destructive ? 'destructive' : 'primary'}
                            onPress={onConfirm}
                            fullWidth
                        />
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const buildStyles = (theme: AppTheme) =>
    StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: ws(24),
        },
        card: {
            width: '100%',
            maxWidth: ws(360),
            borderRadius: theme.radius.xl,
            paddingHorizontal: ws(24),
            paddingTop: hs(24),
            paddingBottom: hs(20),
            gap: hs(10),
            alignItems: 'center',
            elevation: 8,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
        },
        iconCircle: {
            width: ws(60),
            height: ws(60),
            borderRadius: ws(30),
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: hs(4),
        },
        actions: {
            width: '100%',
            gap: hs(10),
            marginTop: hs(12),
        },
    });

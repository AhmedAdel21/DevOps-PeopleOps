import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View,
    ViewStyle,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@themes/index';
import { ws, hs } from '@/presentation/utils/scaling';

export interface AppBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    /** Max height as fraction of screen (0–1). Default 0.7 */
    heightFraction?: number;
    children: React.ReactNode;
    style?: ViewStyle;
}

export const AppBottomSheet: React.FC<AppBottomSheetProps> = ({
    visible,
    onClose,
    heightFraction = 0.7,
    children,
    style,
}) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, slideAnim, fadeAnim]);

    const maxHeight = screenHeight * heightFraction;

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [maxHeight, 0],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            {/* Sheet — DS glass: real blur on iOS, DS opacity fallback on
                Android. It sits over the dimmed backdrop, so glass always
                has colour behind it to refract. */}
            {/* Outer: shadow + radius + transform, NO overflow:hidden so
                the indigo shadow actually renders. Inner: clipped glass. */}
            <Animated.View
                style={[
                    styles.sheetOuter,
                    theme.shadow.lg,
                    {
                        borderTopLeftRadius: ws(16),
                        borderTopRightRadius: ws(16),
                        transform: [{ translateY }],
                    },
                ]}
            >
                <View
                    style={[
                        styles.sheetInner,
                        {
                            maxHeight,
                            borderColor: theme.glass.stroke,
                            borderWidth: 1,
                            borderTopLeftRadius: ws(16),
                            borderTopRightRadius: ws(16),
                            paddingBottom: insets.bottom,
                        },
                        style,
                    ]}
                >
                    {Platform.OS === 'ios' && (
                        <BlurView
                            style={StyleSheet.absoluteFill}
                            blurType={theme.dark ? 'dark' : 'light'}
                            blurAmount={theme.glass.blurStrong}
                            reducedTransparencyFallbackColor={theme.glass.fillStrong}
                        />
                    )}
                    <View
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                backgroundColor:
                                    Platform.OS === 'ios'
                                        ? theme.glass.fill
                                        : theme.glass.fillStrong,
                            },
                        ]}
                    />

                    {/* Handle */}
                    <View style={styles.handleRow}>
                        <View
                            style={[
                                styles.handle,
                                { backgroundColor: theme.colors.borderStrong },
                            ]}
                        />
                    </View>

                    {children}
                </View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sheetOuter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    sheetInner: {
        overflow: 'hidden',
    },
    handleRow: {
        alignItems: 'center',
        paddingTop: hs(10),
        paddingBottom: hs(6),
    },
    handle: {
        width: ws(36),
        height: hs(4),
        borderRadius: 2,
    },
});

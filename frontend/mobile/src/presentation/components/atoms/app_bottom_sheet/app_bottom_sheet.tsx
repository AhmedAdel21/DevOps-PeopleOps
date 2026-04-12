import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import { useTheme } from '@themes/index';
import { ws, hs } from '@/presentation/utils/scaling';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

    const maxHeight = SCREEN_HEIGHT * heightFraction;

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

            {/* Sheet */}
            <Animated.View
                style={[
                    styles.sheet,
                    {
                        maxHeight,
                        backgroundColor: theme.colors.card,
                        borderTopLeftRadius: ws(16),
                        borderTopRightRadius: ws(16),
                        transform: [{ translateY }],
                    },
                    style,
                ]}
            >
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
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
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

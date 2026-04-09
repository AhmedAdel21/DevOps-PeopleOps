import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@themes/index';
import { ws } from '@/presentation/utils/scaling';

export interface AppBackButtonProps {
    onPress: () => void;
    color?: string;
    size?: number;
    style?: ViewStyle;
}

export const AppBackButton: React.FC<AppBackButtonProps> = ({
    onPress,
    color,
    size = 24,
    style,
}) => {
    const { theme } = useTheme();

    return (
        <Pressable
            onPress={onPress}
            hitSlop={12}
            style={({ pressed }) => [
                styles.base,
                { width: ws(size + 8), height: ws(size + 8) },
                pressed && styles.pressed,
                style,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
        >
            <ArrowLeft size={ws(size)} color={color ?? theme.colors.foreground} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
    },
    pressed: {
        opacity: 0.6,
    },
});
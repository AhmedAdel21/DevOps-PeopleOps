import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@themes/index';
import { ws } from '@/presentation/utils/scaling';

export interface AppIconCircleProps {
    icon: LucideIcon;
    size?: number;              // outer diameter (default 80)
    iconSize?: number;          // defaults to ~60% of size
    backgroundColor?: string;   // defaults to theme.colors.primaryLight
    iconColor?: string;         // defaults to theme.colors.primary
    style?: ViewStyle;
}


export const AppIconCircle: React.FC<AppIconCircleProps> = ({
    icon: Icon,
    size = 80,
    iconSize,
    backgroundColor,
    iconColor,
    style,
}) => {
    const { theme } = useTheme();

    const diameter = ws(size);
    const resolvedIconSize = ws(iconSize ?? Math.round(size * 0.48));

    return (
        <View
            style={[
                styles.base,
                {
                    width: diameter,
                    height: diameter,
                    borderRadius: diameter / 2,
                    backgroundColor: backgroundColor ?? theme.colors.primaryLight,
                },
                style,
            ]}
        >
            <Icon size={resolvedIconSize} color={iconColor ?? theme.colors.primary} />
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

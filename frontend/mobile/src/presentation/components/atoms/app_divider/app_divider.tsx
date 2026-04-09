import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@themes/index';
import { hs } from '@/presentation/utils/scaling';

export interface AppDividerProps {
    color?: string;
    thickness?: number;
    style?: ViewStyle;
}


export const AppDivider: React.FC<AppDividerProps> = ({ color, thickness = 1, style }) => {
    const { theme } = useTheme();

    return (
        <View
            style={[
                styles.base,
                {
                    height: hs(thickness),
                    backgroundColor: color ?? theme.colors.divider,
                },
                style,
            ]}
        />
    );
};


const styles = StyleSheet.create({
    base: {
        alignSelf: 'stretch',
    },
});
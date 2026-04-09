import React, { useMemo } from 'react';
import { Text, TextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme, type AppTheme } from '@themes/index';

export type AppTextVariant =
    | 'hero'       // 32 / bold
    | 'display'    // 28 / bold
    | 'title'      // 24 / bold
    | 'subtitle'   // 20 / semibold
    | 'cardTitle'  // 18 / semibold
    | 'bodyLg'     // 16 / regular
    | 'body'       // 15 / regular (default)
    | 'bodyMedium' // 15 / medium
    | 'label'      // 14 / medium
    | 'labelRegular' // 14 / regular
    | 'caption'    // 13 / regular
    | 'small'      // 12 / regular
    | 'micro';     // 11 / regular

type WeightKey = 'regular' | 'medium' | 'semibold' | 'bold';

export interface AppTextProps extends TextProps {
    variant?: AppTextVariant;
    color?: string;
    weight?: WeightKey;
    align?: TextStyle['textAlign'];
    children?: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
    variant = 'body',
    color,
    weight,
    align,
    style,
    children,
    ...rest
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => buildStyles(theme), [theme]);

    const override: TextStyle = {
        ...(color ? { color } : null),
        ...(align ? { textAlign: align } : null),
        ...(weight ? { fontFamily: theme.typography.fontFamily[weight] } : null),
    };

    return (
        <Text style={[styles.base, styles[variant], override, style]} {...rest}>
            {children}
        </Text>
    );
};

const buildStyles = (theme: AppTheme) => {
    const { sizes, fontFamily } = theme.typography;
    const foreground = theme.colors.foreground;

    return StyleSheet.create({
        base: {
            color: foreground,
            includeFontPadding: false,
        },
        hero: { fontFamily: fontFamily.bold, fontSize: sizes.hero },
        display: { fontFamily: fontFamily.bold, fontSize: sizes.display },
        title: { fontFamily: fontFamily.bold, fontSize: sizes.title },
        subtitle: { fontFamily: fontFamily.semibold, fontSize: sizes.xxl },
        cardTitle: { fontFamily: fontFamily.semibold, fontSize: sizes.xl },
        bodyLg: { fontFamily: fontFamily.regular, fontSize: sizes.lg },
        body: { fontFamily: fontFamily.regular, fontSize: sizes.md },
        bodyMedium: { fontFamily: fontFamily.medium, fontSize: sizes.md },
        label: { fontFamily: fontFamily.medium, fontSize: sizes.base },
        labelRegular: { fontFamily: fontFamily.regular, fontSize: sizes.base },
        caption: { fontFamily: fontFamily.regular, fontSize: sizes.sm },
        small: { fontFamily: fontFamily.regular, fontSize: sizes.sm },
        micro: { fontFamily: fontFamily.regular, fontSize: sizes.xs },
    });
};
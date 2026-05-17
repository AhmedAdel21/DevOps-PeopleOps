import React, { useMemo } from 'react';
import { Text, TextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme, type AppTheme, type FontFamily } from '@themes/index';
import { letterSpacing as ls } from '@themes/index';
import { useTranslation } from 'react-i18next';
import { useFontFamily } from '@/presentation/hooks/use_font_family';

export type AppTextVariant =
    | 'hero'       // 32 / bold
    | 'display'    // 28 / bold
    | 'title'      // 24 / bold
    | 'subtitle'   // 20 / semibold
    | 'cardTitle'  // 18 / semibold
    | 'eyebrow'    // 12 / semibold / uppercase / accent — DS section label
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
    const fontFamily = useFontFamily();
    const { i18n } = useTranslation();
    const isArabic = i18n.language?.toLowerCase().startsWith('ar') ?? false;
    const styles = useMemo(
        () => buildStyles(theme, fontFamily, isArabic),
        [theme, fontFamily, isArabic],
    );

    const override: TextStyle = {
        ...(color ? { color } : null),
        ...(align ? { textAlign: align } : null),
        ...(weight ? { fontFamily: fontFamily[weight] } : null),
    };

    return (
        <Text style={[styles.base, styles[variant], override, style]} {...rest}>
            {children}
        </Text>
    );
};

const buildStyles = (
    theme: AppTheme,
    fontFamily: FontFamily,
    isArabic: boolean,
) => {
    const { sizes } = theme.typography;
    const foreground = theme.colors.foreground;

    // DS letter-spacing is in em; RN wants absolute points (em * size).
    // Cairo does not tolerate tracking — Arabic always gets 0.
    const track = (em: number, size: number) => (isArabic ? 0 : em * size);

    return StyleSheet.create({
        base: {
            color: foreground,
            includeFontPadding: false,
        },
        hero: { fontFamily: fontFamily.bold, fontSize: sizes.hero, letterSpacing: track(ls.tight, sizes.hero) },
        display: { fontFamily: fontFamily.bold, fontSize: sizes.display, letterSpacing: track(ls.tight, sizes.display) },
        title: { fontFamily: fontFamily.bold, fontSize: sizes.title, letterSpacing: track(ls.tight, sizes.title) },
        subtitle: { fontFamily: fontFamily.semibold, fontSize: sizes.xxl, letterSpacing: track(ls.snug, sizes.xxl) },
        cardTitle: { fontFamily: fontFamily.semibold, fontSize: sizes.xl, letterSpacing: track(ls.snug, sizes.xl) },
        eyebrow: {
            fontFamily: fontFamily.semibold,
            fontSize: sizes.sm,
            color: theme.colors.accentHover, // --brand-accent-700
            textTransform: 'uppercase',
            letterSpacing: track(ls.eyebrow, sizes.sm),
        },
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

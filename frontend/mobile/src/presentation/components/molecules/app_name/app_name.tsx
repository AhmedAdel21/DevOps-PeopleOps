
import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { AppText } from '../../atoms/app_text';
import { AppLogo } from '../app_logo';

export interface AppNameProps {
    /** Show the DevOps PeopleOps logo above the text. Default true. */
    showLogo?: boolean;
    /** Override the displayed app name. Defaults to the hardcoded brand. */
    name?: string;
    /** Override the tagline. Defaults to i18n key auth.splash.tagline. */
    tagline?: string;
    style?: ViewStyle;
}

export const AppName: React.FC<AppNameProps> = ({
    showLogo = true,
    name,
    tagline,
    style,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => buildStyles(theme), [theme]);

    const resolvedTagline =
        tagline ?? (t('auth.splash.tagline') as string);

    return (
        <View style={[styles.container, style]}>
            {showLogo ? <AppLogo /> : null}
            <AppText variant="display" align="center">
                {name ?? 'DevopTime'}
            </AppText>
            <AppText
                variant="bodyLg"
                align="center"
                color={theme.colors.mutedForeground}
            >
                {resolvedTagline}
            </AppText>
        </View>
    );
};

const buildStyles = (theme: AppTheme) =>
    StyleSheet.create({
        container: {
            alignItems: 'center',
            gap: theme.spacing.s,
        },
    });
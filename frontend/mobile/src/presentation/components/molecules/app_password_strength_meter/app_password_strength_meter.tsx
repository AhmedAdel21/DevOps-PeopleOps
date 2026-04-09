import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs } from '@/presentation/utils/scaling';
import { AppText } from '../../atoms/app_text';
import { scorePassword, type AppPasswordStrength } from './score_password';

export interface AppPasswordStrengthMeterProps {
    password: string;
    barCount?: number;
    style?: ViewStyle;
}

export const AppPasswordStrengthMeter: React.FC<AppPasswordStrengthMeterProps> = ({
    password,
    barCount = 4,
    style,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => buildStyles(theme), [theme]);

    const { score, labelKey } = scorePassword(password);
    const barColor = resolveBarColor(theme, score);

    return (
        <View style={[styles.container, style]}>
            <View style={styles.barsRow}>
                {Array.from({ length: barCount }, (_, i) => {
                    const filled = i < score;
                    return (
                        <View
                            key={i}
                            style={[
                                styles.bar,
                                { backgroundColor: filled ? barColor : theme.colors.muted },
                            ]}
                        />
                    );
                })}
            </View>
            {password ? (
                <AppText variant="small" color={barColor} weight="medium">
                    {t(`auth.setPassword.strength.${labelKey}`) as string}
                </AppText>
            ) : null}
        </View>
    );
};

const resolveBarColor = (theme: AppTheme, score: AppPasswordStrength): string => {
    if (score <= 1) return theme.colors.status.error.base;
    if (score === 2) return theme.colors.status.warning.base;
    if (score === 3) return theme.colors.status.warning.base;
    return theme.colors.status.success.base;
};

const buildStyles = (theme: AppTheme) =>
    StyleSheet.create({
        container: {
            gap: theme.spacing.xs,
        },
        barsRow: {
            flexDirection: 'row',
            gap: theme.spacing.xs,
        },
        bar: {
            flex: 1,
            height: hs(4),
            borderRadius: theme.radius.s,
        },
    });
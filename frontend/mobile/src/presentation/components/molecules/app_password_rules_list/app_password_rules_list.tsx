import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { ws } from '@/presentation/utils/scaling';
import { AppText } from '../../atoms/app_text';


export interface AppPasswordRule {
    /** Human-readable rule text (usually from i18n). */
    label: string;
    /** Whether the current password satisfies this rule. */
    met: boolean;
}

export interface AppPasswordRulesListProps {
    rules: AppPasswordRule[];
    style?: ViewStyle;
}

export const AppPasswordRulesList: React.FC<AppPasswordRulesListProps> = ({
    rules,
    style,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => buildStyles(theme), [theme]);

    return (
        <View style={[styles.container, style]}>
            {rules.map((rule, i) => {
                const Icon = rule.met ? Check : X;
                const color = rule.met
                    ? theme.colors.status.success.base
                    : theme.colors.mutedForeground;

                return (
                    <View key={i} style={styles.row}>
                        <Icon size={ws(14)} color={color} />
                        <AppText
                            variant="small"
                            color={rule.met ? theme.colors.foreground : theme.colors.mutedForeground}
                        >
                            {rule.label}
                        </AppText>
                    </View>
                );
            })}
        </View>
    );
};

const buildStyles = (theme: AppTheme) =>
    StyleSheet.create({
        container: {
            gap: theme.spacing.xs,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.s,
        },
    });

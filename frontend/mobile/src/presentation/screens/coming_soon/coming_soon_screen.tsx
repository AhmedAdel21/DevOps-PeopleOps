import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Construction, type LucideIcon } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppText, AppIconCircle } from '@/presentation/components/atoms';

export interface ComingSoonScreenProps {
    title: string;
    icon?: LucideIcon;
    body?: string;
}

export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = ({
    title,
    icon = Construction,
    body,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
            <View style={styles.content}>
                <AppIconCircle
                    icon={icon}
                    size={80}
                    backgroundColor={theme.colors.muted}
                    iconColor={theme.colors.mutedForeground}
                />
                <AppText variant="title" align="center">
                    {title}
                </AppText>
                <AppText
                    variant="body"
                    align="center"
                    color={theme.colors.mutedForeground}
                    style={styles.body}
                >
                    {body ?? t('comingSoon.body')}
                </AppText>
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme: AppTheme) =>
    StyleSheet.create({
        flex: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        content: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: ws(32),
            gap: hs(16),
        },
        body: {
            maxWidth: ws(280),
        },
    });

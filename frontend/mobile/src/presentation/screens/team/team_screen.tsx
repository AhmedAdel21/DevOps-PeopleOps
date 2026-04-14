import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react-native';
import { ComingSoonScreen } from '@/presentation/screens/coming_soon';

export const TeamScreen: React.FC = () => {
    const { t } = useTranslation();
    return <ComingSoonScreen title={t('tabs.team')} icon={Users} />;
};

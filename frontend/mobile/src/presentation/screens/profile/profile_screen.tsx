import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react-native';
import { ComingSoonScreen } from '@/presentation/screens/coming_soon';

export const ProfileScreen: React.FC = () => {
    const { t } = useTranslation();
    return <ComingSoonScreen title={t('tabs.profile')} icon={User} />;
};

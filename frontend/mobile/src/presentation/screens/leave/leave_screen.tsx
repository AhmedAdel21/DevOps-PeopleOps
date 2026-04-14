import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react-native';
import { ComingSoonScreen } from '@/presentation/screens/coming_soon';

export const LeaveScreen: React.FC = () => {
    const { t } = useTranslation();
    return <ComingSoonScreen title={t('tabs.vacations')} icon={CalendarDays} />;
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScanLine } from 'lucide-react-native';
import { ComingSoonScreen } from '@/presentation/screens/coming_soon';

export const AttendanceScreen: React.FC = () => {
    const { t } = useTranslation();
    return <ComingSoonScreen title={t('tabs.attendance')} icon={ScanLine} />;
};

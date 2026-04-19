import React, { createContext, useCallback, useContext, useState } from 'react';
import { Alert, I18nManager, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import './i18n';

interface LanguageContextValue {
  t: TFunction;
  isRTL: boolean;
  language: string;
  remountKey: number;
  changeLanguage: (lng: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [remountKey, setRemountKey] = useState(0);

  const isRTL = i18n.language === 'ar';

  const changeLanguage = useCallback(
    async (lng: string) => {
      await i18n.changeLanguage(lng);
      const shouldBeRTL = lng === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
        setRemountKey((k) => k + 1);
        if (Platform.OS === 'ios') {
          Alert.alert(
            i18n.t('profile.rtlRestart.title'),
            i18n.t('profile.rtlRestart.body'),
            [{ text: i18n.t('profile.rtlRestart.ok') }],
          );
        }
      }
    },
    [i18n],
  );

  const value: LanguageContextValue = {
    t,
    isRTL,
    language: i18n.language,
    remountKey,
    changeLanguage,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, I18nManager } from 'react-native';
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
  const reconciledRef = useRef(false);

  const isRTL = i18n.language === 'ar';

  // Reconcile native layout direction with the loaded language on app boot.
  // After a user switches language, I18nManager.forceRTL may not fully persist
  // before the process is killed, leaving the next launch with text in one
  // language but layout in the other direction. This catches that mismatch
  // and prompts the user to restart once more so the two stay in sync.
  useEffect(() => {
    if (reconciledRef.current) return;
    if (!i18n.language || i18n.language === 'cimode') return;

    const shouldBeRTL = i18n.language === 'ar';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      Alert.alert(
        i18n.t('profile.rtlRestart.title'),
        i18n.t('profile.rtlRestart.body'),
        [{ text: i18n.t('profile.rtlRestart.ok') }],
      );
    }
    reconciledRef.current = true;
  }, [i18n.language, i18n]);

  const changeLanguage = useCallback(
    async (lng: string) => {
      await i18n.changeLanguage(lng);
      const shouldBeRTL = lng === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
        setRemountKey((k) => k + 1);
        // Native layout direction (both iOS and Android) requires a full process
        // restart after forceRTL. JS remount alone only updates the React tree —
        // native views keep their old layout direction until relaunch.
        Alert.alert(
          i18n.t('profile.rtlRestart.title'),
          i18n.t('profile.rtlRestart.body'),
          [{ text: i18n.t('profile.rtlRestart.ok') }],
        );
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

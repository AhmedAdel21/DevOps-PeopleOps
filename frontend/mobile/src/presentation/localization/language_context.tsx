import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNRestart from 'react-native-restart';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { RotateCcw } from 'lucide-react-native';
import { StorageKeys } from '@/core/keys/storage.key';
import { useDialog } from '@/presentation/components/molecules';
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
  const { showDialog } = useDialog();

  const isRTL = i18n.language === 'ar';

  const promptRestart = useCallback(() => {
    showDialog({
      title: i18n.t('profile.rtlRestart.title'),
      message: i18n.t('profile.rtlRestart.body'),
      confirmLabel: i18n.t('profile.rtlRestart.ok'),
      icon: RotateCcw,
      onConfirm: () => RNRestart.restart(),
    });
  }, [i18n, showDialog]);

  // Reconcile native layout direction with the persisted language on app boot.
  // After a user switches language, I18nManager.forceRTL may not fully persist
  // before the process is killed, leaving the next launch with text in one
  // language but layout in the other direction.
  //
  // We read AsyncStorage directly (same source the i18n detector uses) instead
  // of i18n.language, because i18n.language is initially the fallback ('en')
  // before the async detector resolves — reading it too early would produce a
  // false-positive mismatch against the previously saved language.
  useEffect(() => {
    if (reconciledRef.current) return;
    reconciledRef.current = true;

    AsyncStorage.getItem(StorageKeys.LANGUAGE).then((savedLang) => {
      const effective = savedLang || 'en';
      const shouldBeRTL = effective === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
        promptRestart();
      }
    });
  }, [promptRestart]);

  const changeLanguage = useCallback(
    async (lng: string) => {
      await i18n.changeLanguage(lng);
      const shouldBeRTL = lng === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
        setRemountKey((k) => k + 1);
        // Native layout direction requires a full process restart after
        // forceRTL. The themed dialog triggers RNRestart on confirm.
        promptRestart();
      }
    },
    [i18n, promptRestart],
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

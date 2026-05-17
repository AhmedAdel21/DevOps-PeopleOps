import { useTranslation } from 'react-i18next';
import { fontFamilyFor, type FontFamily } from '@/presentation/themes/typography';

/**
 * Resolves the active font family map (Livvic for EN, Cairo for AR) from
 * the current i18n language.
 *
 * Deliberately reads `react-i18next`'s global instance, NOT the custom
 * `LanguageProvider` context: dialogs render under `DialogProvider`,
 * which is mounted *outside* `LanguageProvider` (LanguageProvider needs
 * `useDialog` for its RTL-restart prompt, so it must sit inside it).
 * Depending on `useLanguage` here would crash every `AppText` inside a
 * dialog. The i18n instance is global (initialised by `./i18n`) and
 * `useTranslation` re-renders on language change, so this is both
 * provider-independent and reactive.
 */
export function useFontFamily(): FontFamily {
  const { i18n } = useTranslation();
  return fontFamilyFor(i18n.language);
}

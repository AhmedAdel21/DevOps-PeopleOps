# Language Picker — Profile Screen

**Date:** 2026-04-16  
**Status:** Approved

---

## Overview

Add a language-selection row to the Profile screen. Tapping it opens a bottom sheet where the user can switch between English and Arabic. The sheet follows the exact same design pattern as `SignInLocationSheet` — `AppBottomSheet` with radio cards.

---

## Architecture

### New file

**`frontend/mobile/src/presentation/screens/profile/language_picker_sheet.tsx`**

A pure presentational component that accepts:

```ts
interface LanguagePickerSheetProps {
  visible: boolean;
  currentLanguage: string;
  onClose: () => void;
  onConfirm: (lng: string) => void;
}
```

Internally renders:
- `AppBottomSheet` (same as `SignInLocationSheet`)
- Two radio cards — EN and AR — using the same card/icon/radio-dot pattern
- Pre-selects `currentLanguage` on open
- Confirm button (disabled until a selection differs or is made) calls `onConfirm(selected)`
- Cancel text pressable calls `onClose()`

Language options defined as a constant array (mirrors `MODE_OPTIONS` in `SignInLocationSheet`):

```ts
const LANGUAGE_OPTIONS = [
  { code: 'en', icon: Globe, accentKey: 'primary' },
  { code: 'ar', icon: Globe, accentKey: 'info' },
];
```

Both use `Globe` from `lucide-react-native`. EN uses `primary` accent, AR uses `info` accent — same accent resolution as the sign-in sheet.

### Modified files

**`profile_screen.tsx`**
- Import `useLanguage` from `@/presentation/localization/language_context`
- Add `sheetVisible` boolean state
- Add a tappable row inside the existing `AppCard` (below the email row) — shows label on the left, current language code + chevron on the right
- Render `<LanguagePickerSheet>` controlled by `sheetVisible`
- `onConfirm`: call `changeLanguage(lng)` then close sheet

**`languages/en.ts` and `languages/ar.ts`**  
Add a `profile` key at the top level:

```ts
// en
profile: {
  languageRow: 'Language',
  languageSheet: {
    title: 'Select Language',
    confirm: 'Apply',
    cancel: 'Cancel',
    languages: {
      en: { title: 'English', body: 'Switch app to English' },
      ar: { title: 'Arabic (عربي)', body: 'Switch app to Arabic' },
    },
  },
},

// ar
profile: {
  languageRow: 'اللغة',
  languageSheet: {
    title: 'اختر اللغة',
    confirm: 'تطبيق',
    cancel: 'إلغاء',
    languages: {
      en: { title: 'الإنجليزية', body: 'تغيير التطبيق إلى الإنجليزية' },
      ar: { title: 'العربية', body: 'تغيير التطبيق إلى العربية' },
    },
  },
},
```

---

## Data flow

```
ProfileScreen
  → useLanguage() → { language, changeLanguage }
  → taps language row → sheetVisible = true
  → LanguagePickerSheet(visible, currentLanguage)
      → user selects lng → taps Confirm
      → onConfirm(lng)
  → ProfileScreen.onConfirm
      → changeLanguage(lng)   // persists to AsyncStorage, handles RTL
      → sheetVisible = false
```

`changeLanguage` is already implemented in `language_context.tsx`:
- Calls `i18n.changeLanguage(lng)` → triggers re-render of all `useTranslation()` consumers
- Calls `I18nManager.forceRTL(true/false)` for AR/EN
- Persists the choice to `AsyncStorage` under `StorageKeys.LANGUAGE`

---

## RTL note

RTL layout changes require an app restart to fully apply (React Native limitation). No in-app banner is shown — this is acceptable for now since text direction updates immediately and layout direction updates on next cold start.

---

## Error handling

No error handling needed. `changeLanguage` is fire-and-forget; `AsyncStorage` failures are non-critical and already swallowed by the i18n language detector.

---

## Out of scope

- More than 2 languages
- Restart prompt / snackbar
- Settings card (no other settings to group with yet)

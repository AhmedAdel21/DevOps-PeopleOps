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

**`language_context.tsx`**
- Add `remountKey: number` to `LanguageContextValue`
- Add `remountKey` state (starts at `0`) to `LanguageProvider`
- In `changeLanguage`: after `I18nManager.forceRTL(shouldBeRTL)`, call `setRemountKey(k => k + 1)`
- Expose `remountKey` in context value

**`app.tsx`**
- Add `AppRoot` component (inside `LanguageProvider`) that reads `remountKey` via `useLanguage()` and renders `<AppContent key={remountKey} />`
- Replace `<AppContent />` with `<AppRoot />` inside `App`

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

`changeLanguage` is updated in `language_context.tsx` to also trigger a full tree remount when RTL direction flips:
- Calls `i18n.changeLanguage(lng)` → triggers re-render of all `useTranslation()` consumers
- Calls `I18nManager.forceRTL(true/false)` for AR/EN
- Increments `remountKey` in context state when RTL direction changes
- Persists the choice to `AsyncStorage` under `StorageKeys.LANGUAGE`

`app.tsx` gains a thin `AppRoot` wrapper that passes `remountKey` as `key` to `AppContent`, forcing a full React subtree remount when RTL flips. Redux store lives outside this boundary so all auth/store state survives. Navigation stack resets (user lands at auth or home per Redux auth state) — acceptable for a language direction change.

---

## RTL handling

RTL changes apply immediately without an app restart. The remount-key pattern is used:

1. `I18nManager.forceRTL(shouldBeRTL)` sets the native flag
2. `setRemountKey(k => k + 1)` in `LanguageProvider` increments a counter exposed via context
3. `AppRoot` in `app.tsx` passes this as `key` to `AppContent`, triggering unmount + remount
4. The remounted tree renders fresh with the correct RTL layout

Same-direction switches (e.g. EN→EN) do not increment `remountKey` and cause no remount.

---

## Error handling

No error handling needed. `changeLanguage` is fire-and-forget; `AsyncStorage` failures are non-critical and already swallowed by the i18n language detector.

---

## Out of scope

- More than 2 languages
- Restart prompt / snackbar
- Settings card (no other settings to group with yet)

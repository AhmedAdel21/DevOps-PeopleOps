# Language Picker — Profile Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a language-selection row to the Profile screen that opens an `AppBottomSheet` with EN/AR radio cards, applying RTL layout changes immediately (no app restart) via a remount-key pattern.

**Architecture:** `LanguageProvider` gains a `remountKey` counter that increments when RTL direction flips; `app.tsx` passes it as `key` to `AppContent`, forcing a React subtree remount. A new `LanguagePickerSheet` component mirrors the `SignInLocationSheet` design (radio cards, confirm/cancel). `ProfileScreen` gains a tappable language row that opens this sheet.

**Tech Stack:** React Native, i18next / react-i18next, React Context, `I18nManager` (built-in RN), `lucide-react-native`, `AppBottomSheet`

---

## File Map

| Action | Path |
|--------|------|
| Modify | `frontend/mobile/src/presentation/localization/languages/en.ts` |
| Modify | `frontend/mobile/src/presentation/localization/languages/ar.ts` |
| Modify | `frontend/mobile/src/presentation/localization/language_context.tsx` |
| Modify | `frontend/mobile/src/app.tsx` |
| Create | `frontend/mobile/src/presentation/screens/profile/language_picker_sheet.tsx` |
| Modify | `frontend/mobile/src/presentation/screens/profile/profile_screen.tsx` |

---

### Task 1: Add `profile` i18n strings

**Files:**
- Modify: `frontend/mobile/src/presentation/localization/languages/en.ts`
- Modify: `frontend/mobile/src/presentation/localization/languages/ar.ts`

- [ ] **Step 1: Add `profile` key to `en.ts`**

Open `frontend/mobile/src/presentation/localization/languages/en.ts`. After the last top-level key (`comingSoon`), add:

```ts
  profile: {
    languageRow: 'Language',
    languageSheet: {
      title: 'Select Language',
      confirm: 'Apply',
      cancel: 'Cancel',
      languages: {
        en: { title: 'English', body: 'Switch app to English' },
        ar: { title: 'Arabic', body: 'Switch app to Arabic' },
      },
    },
  },
```

- [ ] **Step 2: Add `profile` key to `ar.ts`**

Open `frontend/mobile/src/presentation/localization/languages/ar.ts`. After the `comingSoon` key, add:

```ts
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

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/mobile/src/presentation/localization/languages/en.ts \
        frontend/mobile/src/presentation/localization/languages/ar.ts
git commit -m "feat(i18n): add profile language picker strings for en and ar"
```

---

### Task 2: Add `remountKey` to `LanguageContext`

**Files:**
- Modify: `frontend/mobile/src/presentation/localization/language_context.tsx`
- Test: `frontend/mobile/__tests__/language_context.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/mobile/__tests__/language_context.test.tsx`:

```tsx
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { LanguageProvider, useLanguage } from '../src/presentation/localization/language_context';

// Capture context values from inside the tree
let captured: ReturnType<typeof useLanguage> | null = null;

const Consumer = () => {
  captured = useLanguage();
  return null;
};

const renderTree = () =>
  ReactTestRenderer.create(
    <LanguageProvider>
      <Consumer />
    </LanguageProvider>,
  );

beforeEach(() => {
  captured = null;
});

test('useLanguage exposes remountKey starting at 0', async () => {
  await ReactTestRenderer.act(async () => {
    renderTree();
  });
  expect(captured!.remountKey).toBe(0);
});

test('remountKey increments when switching to a different RTL direction', async () => {
  await ReactTestRenderer.act(async () => {
    renderTree();
  });
  const keyBefore = captured!.remountKey;

  // Switch from 'en' (LTR) to 'ar' (RTL) — direction changes, key must increment
  await ReactTestRenderer.act(async () => {
    await captured!.changeLanguage('ar');
  });
  expect(captured!.remountKey).toBe(keyBefore + 1);
});

test('remountKey does NOT increment when direction stays the same', async () => {
  await ReactTestRenderer.act(async () => {
    renderTree();
  });

  // Start is 'en'. Switch to another LTR language (still 'en' in this app) — no direction change
  await ReactTestRenderer.act(async () => {
    await captured!.changeLanguage('en');
  });
  const keyAfterFirst = captured!.remountKey;

  await ReactTestRenderer.act(async () => {
    await captured!.changeLanguage('en');
  });
  expect(captured!.remountKey).toBe(keyAfterFirst);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend/mobile && npx jest __tests__/language_context.test.tsx --no-coverage
```

Expected: FAIL — `remountKey` is not defined on the context value.

- [ ] **Step 3: Update `language_context.tsx`**

Replace the entire file with:

```tsx
import React, { createContext, useCallback, useContext, useState } from 'react';
import { I18nManager } from 'react-native';
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend/mobile && npx jest __tests__/language_context.test.tsx --no-coverage
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/mobile/src/presentation/localization/language_context.tsx \
        frontend/mobile/__tests__/language_context.test.tsx
git commit -m "feat(i18n): add remountKey to LanguageContext for no-restart RTL switching"
```

---

### Task 3: Wire remount key in `app.tsx`

**Files:**
- Modify: `frontend/mobile/src/app.tsx`

- [ ] **Step 1: Update `app.tsx`**

Replace the entire file with:

```tsx
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/presentation/store';
import { bootstrapAuth } from '@/presentation/store/slices';
import { ThemeProvider, useTheme } from '@themes/theme_context';
import { LanguageProvider, useLanguage } from '@/presentation/localization/language_context';
import { RootNavigation } from '@/presentation/navigation/root_navigation';
import { ServiceLocator } from '@/di';

// Initialize DI before any render
ServiceLocator.initialize();

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    store.dispatch(bootstrapAuth());
  }, []);

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigation />
    </>
  );
}

function AppRoot() {
  const { remountKey } = useLanguage();
  return <AppContent key={remountKey} />;
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AppRoot />
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}
```

- [ ] **Step 2: Run existing app test**

```bash
cd frontend/mobile && npx jest __tests__/App.test.tsx --no-coverage
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/mobile/src/app.tsx
git commit -m "feat(i18n): wire remountKey in AppRoot for instant RTL layout switching"
```

---

### Task 4: Create `LanguagePickerSheet`

**Files:**
- Create: `frontend/mobile/src/presentation/screens/profile/language_picker_sheet.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/mobile/src/presentation/screens/profile/language_picker_sheet.tsx`:

```tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Globe, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppBottomSheet,
  AppButton,
  AppText,
} from '@/presentation/components/atoms';

export interface LanguagePickerSheetProps {
  visible: boolean;
  currentLanguage: string;
  onClose: () => void;
  onConfirm: (lng: string) => void;
}

interface LanguageOption {
  code: string;
  icon: LucideIcon;
  accentKey: 'primary' | 'info';
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', icon: Globe, accentKey: 'primary' },
  { code: 'ar', icon: Globe, accentKey: 'info' },
];

const resolveAccent = (
  theme: AppTheme,
  key: 'primary' | 'info',
): { base: string; light: string } => {
  if (key === 'primary') {
    return { base: theme.colors.primary, light: theme.colors.primaryLight };
  }
  return {
    base: theme.colors.status.info.base,
    light: theme.colors.status.info.light,
  };
};

export const LanguagePickerSheet: React.FC<LanguagePickerSheetProps> = ({
  visible,
  currentLanguage,
  onClose,
  onConfirm,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selected, setSelected] = useState<string>(currentLanguage);

  // Reset selection to current language each time the sheet opens
  useEffect(() => {
    if (visible) {
      setSelected(currentLanguage);
    }
  }, [visible, currentLanguage]);

  const handleConfirm = () => {
    onConfirm(selected);
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightFraction={0.5}>
      <View style={styles.content}>
        <AppText variant="title" align="center">
          {t('profile.languageSheet.title')}
        </AppText>

        <View style={styles.cards}>
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = selected === option.code;
            const accent = resolveAccent(theme, option.accentKey);
            const Icon = option.icon;

            return (
              <Pressable
                key={option.code}
                onPress={() => setSelected(option.code)}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected
                      ? accent.light
                      : theme.colors.card,
                    borderColor: isSelected
                      ? accent.base
                      : theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.background
                        : accent.light,
                    },
                  ]}
                >
                  <Icon size={ws(24)} color={accent.base} />
                </View>

                <View style={styles.cardText}>
                  <AppText variant="cardTitle">
                    {t(`profile.languageSheet.languages.${option.code}.title`)}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedForeground}>
                    {t(`profile.languageSheet.languages.${option.code}.body`)}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected
                        ? accent.base
                        : theme.colors.borderStrong,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: accent.base },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <AppButton
          label={t('profile.languageSheet.confirm')}
          onPress={handleConfirm}
          fullWidth
          style={styles.confirm}
        />

        <Pressable onPress={onClose} hitSlop={8} style={styles.cancelRow}>
          <AppText
            variant="label"
            color={theme.colors.mutedForeground}
            align="center"
          >
            {t('profile.languageSheet.cancel')}
          </AppText>
        </Pressable>
      </View>
    </AppBottomSheet>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: ws(20),
      paddingTop: hs(8),
      paddingBottom: hs(12),
      gap: hs(12),
    },
    cards: {
      gap: hs(12),
      marginTop: hs(4),
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: ws(16),
      borderRadius: theme.radius.m,
      borderWidth: 1,
      gap: ws(16),
    },
    iconBox: {
      width: ws(48),
      height: ws(48),
      borderRadius: theme.radius.m,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardText: {
      flex: 1,
      gap: hs(2),
    },
    radio: {
      width: ws(22),
      height: ws(22),
      borderRadius: ws(11),
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioDot: {
      width: ws(10),
      height: ws(10),
      borderRadius: ws(5),
    },
    confirm: {
      marginTop: hs(8),
    },
    cancelRow: {
      paddingVertical: hs(8),
    },
  });
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/mobile/src/presentation/screens/profile/language_picker_sheet.tsx
git commit -m "feat(profile): add LanguagePickerSheet with radio card design"
```

---

### Task 5: Add language row to `ProfileScreen`

**Files:**
- Modify: `frontend/mobile/src/presentation/screens/profile/profile_screen.tsx`

- [ ] **Step 1: Update `profile_screen.tsx`**

Replace the entire file with:

```tsx
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LogOut, ChevronRight } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppText,
  AppButton,
  AppCard,
} from '@/presentation/components/atoms';
import {
  useAppDispatch,
  useAppSelector,
} from '@/presentation/store/hooks';
import { logout } from '@/presentation/store/slices';
import {
  selectCurrentUser,
  selectLogoutStatus,
} from '@/presentation/store/selectors';
import { authLog } from '@/core/logger';
import { useLanguage } from '@/presentation/localization/language_context';
import { LanguagePickerSheet } from './language_picker_sheet';

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const logoutStatus = useAppSelector(selectLogoutStatus);

  const { language, changeLanguage } = useLanguage();
  const [langSheetVisible, setLangSheetVisible] = useState(false);

  const handleLogout = useCallback(() => {
    authLog.info('navigation', 'ProfileScreen logout button pressed');
    dispatch(logout());
  }, [dispatch]);

  const handleLanguageConfirm = useCallback(
    async (lng: string) => {
      setLangSheetVisible(false);
      await changeLanguage(lng);
    },
    [changeLanguage],
  );

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
      >
        <AppText variant="display">{t('tabs.profile')}</AppText>

        <AppCard>
          <View style={styles.row}>
            <AppText
              variant="caption"
              color={theme.colors.mutedForeground}
            >
              {t('auth.loginScreen.emailLabel')}
            </AppText>
            <AppText variant="body">
              {user?.email ?? user?.displayName ?? '—'}
            </AppText>
          </View>

          <View style={styles.divider} />

          <Pressable
            style={styles.langRow}
            onPress={() => setLangSheetVisible(true)}
            hitSlop={4}
          >
            <AppText variant="body">{t('profile.languageRow')}</AppText>
            <View style={styles.langRight}>
              <AppText variant="body" color={theme.colors.mutedForeground}>
                {language.toUpperCase()}
              </AppText>
              <ChevronRight
                size={ws(18)}
                color={theme.colors.mutedForeground}
              />
            </View>
          </Pressable>
        </AppCard>

        <AppButton
          label={t('auth.logout')}
          onPress={handleLogout}
          loading={logoutStatus === 'pending'}
          disabled={logoutStatus === 'pending'}
          variant="outlineDestructive"
          leftIcon={LogOut}
          fullWidth
        />
      </ScrollView>

      <LanguagePickerSheet
        visible={langSheetVisible}
        currentLanguage={language}
        onClose={() => setLangSheetVisible(false)}
        onConfirm={handleLanguageConfirm}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      paddingHorizontal: ws(24),
      paddingVertical: hs(24),
      gap: theme.spacing.l,
    },
    row: {
      gap: theme.spacing.xs,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: hs(4),
    },
    langRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: hs(4),
    },
    langRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ws(4),
    },
  });
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run full test suite**

```bash
cd frontend/mobile && npx jest --no-coverage
```

Expected: all tests PASS.

- [ ] **Step 4: Manual verification checklist**

Run the app (`npx react-native run-ios` or `run-android`) and verify:

- [ ] Profile screen shows email row, then a divider, then a "Language" row with "EN" and a chevron
- [ ] Tapping the language row opens the bottom sheet
- [ ] Sheet shows two radio cards: English (selected, primary accent) and Arabic (info accent) when current language is EN
- [ ] Tapping Arabic card selects it (card highlights, radio dot fills)
- [ ] Tapping "Apply" closes the sheet and the app text updates to Arabic immediately
- [ ] Language row now shows "AR"
- [ ] Tapping the row again shows Arabic card pre-selected
- [ ] Tapping "Cancel" closes the sheet without changing language
- [ ] RTL layout applies immediately (text aligns right, chevron flips) — no restart required

- [ ] **Step 5: Commit**

```bash
git add frontend/mobile/src/presentation/screens/profile/profile_screen.tsx
git commit -m "feat(profile): add language picker row and sheet to profile screen"
```

# Infrastructure Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the Clean Architecture infrastructure for the DEVOPSolution HR app — folder structure, path aliases, DI, Redux store, navigation, theming, i18n, responsive utils — so domain code can be added immediately.

**Architecture:** Three-layer Clean Architecture (Domain → Data → Presentation) with manual ServiceLocator DI, Redux Toolkit for state, React Navigation native stack, i18next for bilingual (EN/AR) support with RTL, and a theme context with light/dark modes using DEVOPSolution brand colors.

**Tech Stack:** React Native 0.85, TypeScript strict, Redux Toolkit, React Navigation (Native Stack), i18next, AsyncStorage, babel-plugin-module-resolver

---

All paths are relative to `frontend/mobile/`.

## File Map

### Core Layer
| File | Responsibility |
|------|---------------|
| `src/core/types/index.ts` | Nullable, Optional, Brand type helpers |
| `src/core/keys/storage.key.ts` | AsyncStorage key constants |

### Domain Layer
| File | Responsibility |
|------|---------------|
| `src/domain/entities/index.ts` | BaseEntity interface |
| `src/domain/errors/domain_error.ts` | DomainError class |
| `src/domain/use_cases/index.ts` | Abstract UseCase base class |
| `src/domain/repositories/index.ts` | Empty barrel (populated later) |
| `src/domain/index.ts` | Domain barrel export |

### Data Layer
| File | Responsibility |
|------|---------------|
| `src/data/dtos/index.ts` | Empty barrel |
| `src/data/mappers/index.ts` | Empty barrel |
| `src/data/data_sources/index.ts` | Empty barrel |
| `src/data/repositories/index.ts` | Empty barrel |
| `src/data/index.ts` | Data barrel export |

### DI Layer
| File | Responsibility |
|------|---------------|
| `src/di/config.ts` | AppConfig constants |
| `src/di/service_locator.ts` | ServiceLocator class with register/get/reset |
| `src/di/index.ts` | DI barrel export |

### Presentation — Store
| File | Responsibility |
|------|---------------|
| `src/presentation/store/index.ts` | configureStore with empty reducers |
| `src/presentation/store/hooks.ts` | useAppDispatch, useAppSelector, SerializableDomainError |

### Presentation — Themes
| File | Responsibility |
|------|---------------|
| `src/presentation/themes/light.theme.ts` | Light theme object |
| `src/presentation/themes/dark.theme.ts` | Dark theme object |
| `src/presentation/themes/theme_context.tsx` | ThemeProvider + useTheme hook |

### Presentation — Localization
| File | Responsibility |
|------|---------------|
| `src/presentation/localization/languages/en.ts` | English translations |
| `src/presentation/localization/languages/ar.ts` | Arabic translations |
| `src/presentation/localization/i18n.ts` | i18next init + language detector |
| `src/presentation/localization/language_context.tsx` | LanguageProvider + useLanguage hook |

### Presentation — Utils
| File | Responsibility |
|------|---------------|
| `src/presentation/utils/scaling.ts` | ws(), hs(), fs() responsive scaling |

### Presentation — Navigation
| File | Responsibility |
|------|---------------|
| `src/presentation/navigation/types.ts` | RootStackParamList |
| `src/presentation/navigation/navigation_ref.ts` | navigationRef + navigate/resetTo/goBack |
| `src/presentation/navigation/require_auth.tsx` | Auth guard wrapper (pass-through for now) |
| `src/presentation/navigation/root_navigation.tsx` | NavigationContainer + Stack.Navigator |

### Presentation — Screens
| File | Responsibility |
|------|---------------|
| `src/presentation/screens/placeholder_screen.tsx` | Temporary placeholder screen |

### Root Files
| File | Responsibility |
|------|---------------|
| `tsconfig.json` | Add path aliases |
| `babel.config.js` | Add module-resolver plugin |
| `index.js` | Update import path for App |
| `App.tsx` | Move to src/, rewrite with provider tree |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install production dependencies**

```bash
cd frontend/mobile && npm install @reduxjs/toolkit react-redux @react-navigation/native @react-navigation/native-stack react-native-screens i18next react-i18next @react-native-async-storage/async-storage
```

- [ ] **Step 2: Install dev dependencies**

```bash
cd frontend/mobile && npm install --save-dev babel-plugin-module-resolver
```

- [ ] **Step 3: Verify installation**

Run: `cd frontend/mobile && cat package.json | grep -E "redux|navigation|i18next|async-storage|module-resolver"`
Expected: All 9 packages listed

---

### Task 2: Configure Path Aliases

**Files:**
- Modify: `tsconfig.json`
- Modify: `babel.config.js`

- [ ] **Step 1: Update tsconfig.json**

Replace the entire file with:

```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "types": ["jest"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@assets/*": ["./src/assets/*"],
      "@themes/*": ["./src/presentation/themes/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/node_modules", "**/Pods"]
}
```

- [ ] **Step 2: Update babel.config.js**

Replace the entire file with:

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@assets': './src/assets',
          '@themes': './src/presentation/themes',
        },
      },
    ],
  ],
};
```

- [ ] **Step 3: Commit**

```bash
git add frontend/mobile/tsconfig.json frontend/mobile/babel.config.js frontend/mobile/package.json frontend/mobile/package-lock.json
git commit -m "chore: install dependencies and configure path aliases"
```

---

### Task 3: Create Core Layer

**Files:**
- Create: `src/core/types/index.ts`
- Create: `src/core/keys/storage.key.ts`

- [ ] **Step 1: Create core types**

```typescript
// src/core/types/index.ts

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type Brand<T, B extends string> = T & { readonly _brand: B };
```

- [ ] **Step 2: Create storage keys**

```typescript
// src/core/keys/storage.key.ts

export const StorageKeys = {
  THEME: '@devopsolution/theme',
  LANGUAGE: '@devopsolution/language',
  SESSION: '@devopsolution/session',
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add frontend/mobile/src/core/
git commit -m "feat: add core types and storage key constants"
```

---

### Task 4: Create Domain Layer

**Files:**
- Create: `src/domain/entities/index.ts`
- Create: `src/domain/errors/domain_error.ts`
- Create: `src/domain/use_cases/index.ts`
- Create: `src/domain/repositories/index.ts`
- Create: `src/domain/index.ts`

- [ ] **Step 1: Create BaseEntity**

```typescript
// src/domain/entities/index.ts

export interface BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

- [ ] **Step 2: Create DomainError**

```typescript
// src/domain/errors/domain_error.ts

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
```

- [ ] **Step 3: Create UseCase base class**

```typescript
// src/domain/use_cases/index.ts

export abstract class UseCase<TInput, TOutput> {
  abstract execute(input: TInput): Promise<TOutput>;
}
```

- [ ] **Step 4: Create empty repositories barrel**

```typescript
// src/domain/repositories/index.ts

// Repository interfaces will be defined here as domain modules are added.
```

- [ ] **Step 5: Create domain barrel export**

```typescript
// src/domain/index.ts

export * from './entities';
export * from './errors/domain_error';
export * from './use_cases';
export * from './repositories';
```

- [ ] **Step 6: Commit**

```bash
git add frontend/mobile/src/domain/
git commit -m "feat: add domain layer base classes (BaseEntity, UseCase, DomainError)"
```

---

### Task 5: Create Data Layer (Empty Shell)

**Files:**
- Create: `src/data/dtos/index.ts`
- Create: `src/data/mappers/index.ts`
- Create: `src/data/data_sources/index.ts`
- Create: `src/data/repositories/index.ts`
- Create: `src/data/index.ts`

- [ ] **Step 1: Create all data barrel files**

```typescript
// src/data/dtos/index.ts
// DTOs will be defined here as API integrations are added.
```

```typescript
// src/data/mappers/index.ts
// Mappers will be defined here as DTOs and entities are added.
```

```typescript
// src/data/data_sources/index.ts
// Data sources (remote + mock) will be defined here.
```

```typescript
// src/data/repositories/index.ts
// Repository implementations will be defined here.
```

```typescript
// src/data/index.ts
export * from './dtos';
export * from './mappers';
export * from './data_sources';
export * from './repositories';
```

- [ ] **Step 2: Commit**

```bash
git add frontend/mobile/src/data/
git commit -m "feat: add data layer empty shell (dtos, mappers, data_sources, repositories)"
```

---

### Task 6: Create DI Layer

**Files:**
- Create: `src/di/config.ts`
- Create: `src/di/service_locator.ts`
- Create: `src/di/index.ts`

- [ ] **Step 1: Create AppConfig**

```typescript
// src/di/config.ts

export const AppConfig = {
  API_BASE_URL: 'https://api.devopsolution.com',
  USE_MOCK: true,
  MOCK_DELAY_MS: 800,
  PAGE_SIZE: 20,
} as const;
```

- [ ] **Step 2: Create ServiceLocator**

```typescript
// src/di/service_locator.ts

export class ServiceLocator {
  private static registry = new Map<string, unknown>();

  static initialize(): void {
    ServiceLocator.registry.clear();
    // Use case registrations will be added here as domain modules are built.
  }

  static register<T>(key: string, instance: T): void {
    ServiceLocator.registry.set(key, instance);
  }

  static get<T>(key: string): T {
    const instance = ServiceLocator.registry.get(key);
    if (instance === undefined) {
      throw new Error(`ServiceLocator: No instance registered for key "${key}"`);
    }
    return instance as T;
  }

  static reset(): void {
    ServiceLocator.registry.clear();
  }
}
```

- [ ] **Step 3: Create DI barrel export**

```typescript
// src/di/index.ts

export { AppConfig } from './config';
export { ServiceLocator } from './service_locator';
```

- [ ] **Step 4: Commit**

```bash
git add frontend/mobile/src/di/
git commit -m "feat: add DI layer (AppConfig, ServiceLocator)"
```

---

### Task 7: Create Responsive Scaling Utilities

**Files:**
- Create: `src/presentation/utils/scaling.ts`

- [ ] **Step 1: Create scaling utilities**

```typescript
// src/presentation/utils/scaling.ts

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (iPhone 14 Pro)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

/**
 * Width scale — for horizontal dimensions: padding-x, margin-x, width, borderRadius, icon size
 */
export function ws(size: number): number {
  return Math.round(size * widthScale);
}

/**
 * Height scale — for vertical dimensions: padding-y, margin-y, height
 */
export function hs(size: number): number {
  return Math.round(size * heightScale);
}

/**
 * Font scale — for all font sizes. Uses moderate scaling to avoid extremes.
 */
export function fs(size: number): number {
  const scale = (widthScale + heightScale) / 2;
  const moderateScale = 0.5;
  return Math.round(size + (scale - 1) * size * moderateScale);
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/mobile/src/presentation/utils/
git commit -m "feat: add responsive scaling utilities (ws, hs, fs)"
```

---

### Task 8: Create Redux Store Shell

**Files:**
- Create: `src/presentation/store/index.ts`
- Create: `src/presentation/store/hooks.ts`

- [ ] **Step 1: Create store configuration**

```typescript
// src/presentation/store/index.ts

import { combineReducers, configureStore } from '@reduxjs/toolkit';

const rootReducer = combineReducers({
  // Slices will be added here as domain modules are built.
  _placeholder: (state: null = null) => state,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

- [ ] **Step 2: Create typed hooks**

```typescript
// src/presentation/store/hooks.ts

import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export interface SerializableDomainError {
  code: string;
  message: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/mobile/src/presentation/store/
git commit -m "feat: add Redux store shell with typed hooks"
```

---

### Task 9: Create Theme System

**Files:**
- Create: `src/presentation/themes/light.theme.ts`
- Create: `src/presentation/themes/dark.theme.ts`
- Create: `src/presentation/themes/theme_context.tsx`

- [ ] **Step 1: Create light theme**

```typescript
// src/presentation/themes/light.theme.ts

import { fs } from '@/presentation/utils/scaling';

export const lightTheme = {
  dark: false,
  colors: {
    primary: '#E8522A',
    primaryDark: '#C4421F',
    secondary: '#1B2A4A',
    secondaryLight: '#2A3F6A',

    background: '#F8F9FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E5E7EB',
    divider: '#F3F4F6',

    status: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      neutral: '#9CA3AF',
      info: '#3B82F6',
    },

    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#D1D5DB',
      inverse: '#FFFFFF',
    },
  },
  typography: {
    sizes: {
      display: fs(32),
      heading: fs(22),
      subheading: fs(18),
      body: fs(15),
      caption: fs(13),
      micro: fs(11),
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
} as const;

export type AppTheme = typeof lightTheme;
```

- [ ] **Step 2: Create dark theme**

```typescript
// src/presentation/themes/dark.theme.ts

import { fs } from '@/presentation/utils/scaling';
import type { AppTheme } from './light.theme';

export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    primary: '#F06A45',
    primaryDark: '#E8522A',
    secondary: '#A3B8D9',
    secondaryLight: '#7A94BF',

    background: '#111827',
    surface: '#1F2937',
    card: '#1F2937',
    border: '#374151',
    divider: '#1F2937',

    status: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      neutral: '#9CA3AF',
      info: '#3B82F6',
    },

    text: {
      primary: '#F9FAFB',
      secondary: '#9CA3AF',
      disabled: '#4B5563',
      inverse: '#111827',
    },
  },
  typography: {
    sizes: {
      display: fs(32),
      heading: fs(22),
      subheading: fs(18),
      body: fs(15),
      caption: fs(13),
      micro: fs(11),
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};
```

- [ ] **Step 3: Create ThemeContext**

```typescript
// src/presentation/themes/theme_context.tsx

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '@/core/keys/storage.key';
import { lightTheme, type AppTheme } from './light.theme';
import { darkTheme } from './dark.theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(StorageKeys.THEME).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
      }
    });
  }, []);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem(StorageKeys.THEME, newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setThemeMode]);

  const value: ThemeContextValue = {
    theme: mode === 'light' ? lightTheme : darkTheme,
    isDark: mode === 'dark',
    toggleTheme,
    setThemeMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/mobile/src/presentation/themes/
git commit -m "feat: add theme system (light/dark themes, ThemeContext with persistence)"
```

---

### Task 10: Create Localization System

**Files:**
- Create: `src/presentation/localization/languages/en.ts`
- Create: `src/presentation/localization/languages/ar.ts`
- Create: `src/presentation/localization/i18n.ts`
- Create: `src/presentation/localization/language_context.tsx`

- [ ] **Step 1: Create English translations**

```typescript
// src/presentation/localization/languages/en.ts

export const en = {
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    ok: 'OK',
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
  },
  tabs: {
    home: 'Home',
    attendance: 'Attendance',
    vacations: 'Vacations',
    team: 'Team',
    profile: 'Profile',
  },
} as const;
```

- [ ] **Step 2: Create Arabic translations**

```typescript
// src/presentation/localization/languages/ar.ts

export const ar = {
  common: {
    loading: '...جاري التحميل',
    error: 'حدث خطأ ما',
    retry: 'إعادة المحاولة',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ',
    ok: 'حسناً',
  },
  auth: {
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
  },
  tabs: {
    home: 'الرئيسية',
    attendance: 'الحضور',
    vacations: 'الإجازات',
    team: 'الفريق',
    profile: 'الملف الشخصي',
  },
} as const;
```

- [ ] **Step 3: Create i18n configuration**

```typescript
// src/presentation/localization/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '@/core/keys/storage.key';
import { en } from './languages/en';
import { ar } from './languages/ar';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lng: string) => void) => {
    AsyncStorage.getItem(StorageKeys.LANGUAGE).then((savedLang) => {
      callback(savedLang || 'en');
    });
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => {
    AsyncStorage.setItem(StorageKeys.LANGUAGE, lng);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

- [ ] **Step 4: Create LanguageContext**

```typescript
// src/presentation/localization/language_context.tsx

import React, { createContext, useCallback, useContext } from 'react';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import './i18n';

interface LanguageContextValue {
  t: TFunction;
  isRTL: boolean;
  language: string;
  changeLanguage: (lng: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();

  const isRTL = i18n.language === 'ar';

  const changeLanguage = useCallback(
    async (lng: string) => {
      await i18n.changeLanguage(lng);
      const shouldBeRTL = lng === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
        // App restart is required for RTL changes to take effect.
        // Wire in RNRestart or Updates.reloadAsync when the dependency is added.
        console.warn('Language changed. Restart the app for RTL changes to take effect.');
      }
    },
    [i18n],
  );

  const value: LanguageContextValue = {
    t,
    isRTL,
    language: i18n.language,
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

- [ ] **Step 5: Commit**

```bash
git add frontend/mobile/src/presentation/localization/
git commit -m "feat: add i18n system (English + Arabic, RTL support, LanguageContext)"
```

---

### Task 11: Create Navigation Infrastructure

**Files:**
- Create: `src/presentation/navigation/types.ts`
- Create: `src/presentation/navigation/navigation_ref.ts`
- Create: `src/presentation/navigation/require_auth.tsx`
- Create: `src/presentation/navigation/root_navigation.tsx`
- Create: `src/presentation/screens/placeholder_screen.tsx`

- [ ] **Step 1: Create navigation types**

```typescript
// src/presentation/navigation/types.ts

export type RootStackParamList = {
  Placeholder: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

- [ ] **Step 2: Create navigation ref**

```typescript
// src/presentation/navigation/navigation_ref.ts

import { createNavigationContainerRef, StackActions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T],
): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params as never);
  }
}

export function resetTo<T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T],
): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      StackActions.replace(name, params as never),
    );
  }
}

export function goBack(): void {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}
```

- [ ] **Step 3: Create RequireAuth guard**

```typescript
// src/presentation/navigation/require_auth.tsx

import React from 'react';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Auth guard wrapper. Currently passes through all children.
 * Will check selectIsAuthenticated and selectSessionRestored
 * once the auth slice is implemented.
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  // TODO: Wire up auth check when auth slice is added:
  // const isAuthenticated = useAppSelector(selectIsAuthenticated);
  // const sessionRestored = useAppSelector(selectSessionRestored);
  // if (!sessionRestored) return <ActivityIndicator />;
  // if (!isAuthenticated) return <Navigate to="Login" />;

  return <>{children}</>;
};
```

- [ ] **Step 4: Create placeholder screen**

```typescript
// src/presentation/screens/placeholder_screen.tsx

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@themes/theme_context';
import { useLanguage } from '@/presentation/localization/language_context';
import type { AppTheme } from '@themes/light.theme';

export const PlaceholderScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DEVOPSolution</Text>
      <Text style={styles.subtitle}>HR Platform</Text>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: theme.typography.sizes.display,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.secondary,
    },
    subtitle: {
      fontSize: theme.typography.sizes.heading,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.primary,
      marginTop: 8,
    },
  });
```

- [ ] **Step 5: Create root navigation**

```typescript
// src/presentation/navigation/root_navigation.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { navigationRef } from './navigation_ref';
import type { RootStackParamList } from './types';
import { PlaceholderScreen } from '@/presentation/screens/placeholder_screen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigation: React.FC = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Placeholder" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

- [ ] **Step 6: Commit**

```bash
git add frontend/mobile/src/presentation/navigation/ frontend/mobile/src/presentation/screens/
git commit -m "feat: add navigation infrastructure (stack navigator, ref, auth guard, placeholder screen)"
```

---

### Task 12: Create Empty Component Directories

**Files:**
- Create: `src/presentation/components/atoms/.gitkeep`
- Create: `src/presentation/components/molecules/.gitkeep`
- Create: `src/presentation/components/organisms/.gitkeep`
- Create: `src/presentation/store/slices/.gitkeep`
- Create: `src/presentation/store/selectors/.gitkeep`
- Create: `src/assets/fonts/.gitkeep`
- Create: `src/assets/icons/.gitkeep`
- Create: `src/assets/images/.gitkeep`

- [ ] **Step 1: Create all .gitkeep files**

```bash
mkdir -p src/presentation/components/atoms src/presentation/components/molecules src/presentation/components/organisms src/presentation/store/slices src/presentation/store/selectors src/assets/fonts src/assets/icons src/assets/images
touch src/presentation/components/atoms/.gitkeep src/presentation/components/molecules/.gitkeep src/presentation/components/organisms/.gitkeep src/presentation/store/slices/.gitkeep src/presentation/store/selectors/.gitkeep src/assets/fonts/.gitkeep src/assets/icons/.gitkeep src/assets/images/.gitkeep
```

- [ ] **Step 2: Commit**

```bash
git add frontend/mobile/src/presentation/components/ frontend/mobile/src/presentation/store/slices/ frontend/mobile/src/presentation/store/selectors/ frontend/mobile/src/assets/
git commit -m "chore: add empty component and asset directories"
```

---

### Task 13: Wire App Entry Point & Provider Tree

**Files:**
- Move + Rewrite: `App.tsx` → `src/app.tsx`
- Modify: `index.js`

- [ ] **Step 1: Create src/app.tsx with full provider tree**

```typescript
// src/app.tsx

import React from 'react';
import { StatusBar } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/presentation/store';
import { ThemeProvider, useTheme } from '@themes/theme_context';
import { LanguageProvider } from '@/presentation/localization/language_context';
import { RootNavigation } from '@/presentation/navigation/root_navigation';
import { ServiceLocator } from '@/di';

// Initialize DI before any render
ServiceLocator.initialize();

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigation />
    </>
  );
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}
```

- [ ] **Step 2: Update index.js**

```javascript
// index.js

import { AppRegistry } from 'react-native';
import App from './src/app';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

- [ ] **Step 3: Delete old App.tsx from root**

```bash
rm frontend/mobile/App.tsx
```

- [ ] **Step 4: Commit**

```bash
git add frontend/mobile/src/app.tsx frontend/mobile/index.js
git rm frontend/mobile/App.tsx
git commit -m "feat: wire provider tree (Redux, SafeArea, Theme, Language, Navigation)"
```

---

### Task 14: Verify TypeScript Compilation

- [ ] **Step 1: Run TypeScript check**

Run: `cd frontend/mobile && npx tsc --noEmit`
Expected: No errors (or only warnings from node_modules)

- [ ] **Step 2: If errors, fix them**

Address any type errors in the created files.

- [ ] **Step 3: Final commit if fixes were needed**

```bash
git add frontend/mobile/src/
git commit -m "fix: resolve TypeScript compilation errors"
```

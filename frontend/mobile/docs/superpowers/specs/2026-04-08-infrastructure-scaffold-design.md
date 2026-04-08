# Infrastructure Scaffold Design — DEVOPSolution HR App

**Date**: 2026-04-08
**Scope**: Clean Architecture infrastructure only. No domain-specific code. Domain entities, use cases, and screens are a separate step.

---

## Overview

Scaffold the React Native project with Clean Architecture infrastructure: folder structure, path aliases, dependency injection skeleton, Redux store shell, navigation infrastructure, theming (light/dark with brand colors), i18n (English + Arabic with RTL), and responsive scaling utilities. The result is a runnable app shell ready to receive domain code.

---

## 1. Folder Structure

```
src/
├── core/
│   ├── keys/storage.key.ts          ← AsyncStorage key constants
│   └── types/index.ts               ← Nullable, Optional, branded ID helpers
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
├── di/
│   ├── config.ts                    ← AppConfig (API_BASE_URL, USE_MOCK, etc.)
│   ├── service_locator.ts           ← ServiceLocator class (empty registrations)
│   └── index.ts
├── domain/
│   ├── entities/index.ts            ← BaseEntity interface
│   ├── repositories/index.ts        ← empty barrel
│   ├── use_cases/index.ts           ← UseCase abstract base class
│   ├── errors/domain_error.ts       ← DomainError class
│   └── index.ts
├── data/
│   ├── dtos/index.ts
│   ├── mappers/index.ts
│   ├── data_sources/index.ts
│   ├── repositories/index.ts
│   └── index.ts
└── presentation/
    ├── store/
    │   ├── index.ts                 ← configureStore (empty reducers)
    │   ├── hooks.ts                 ← useAppDispatch, useAppSelector
    │   ├── slices/
    │   └── selectors/
    ├── screens/
    │   └── placeholder_screen.tsx
    ├── components/
    │   ├── atoms/
    │   ├── molecules/
    │   └── organisms/
    ├── navigation/
    │   ├── root_navigation.tsx      ← Native Stack Navigator
    │   ├── navigation_ref.ts        ← navigate/resetTo/goBack outside components
    │   ├── require_auth.tsx         ← Auth guard (pass-through for now)
    │   └── types.ts                 ← RootStackParamList
    ├── localization/
    │   ├── i18n.ts                  ← i18next setup + language detector
    │   ├── languages/en.ts
    │   ├── languages/ar.ts
    │   └── language_context.tsx     ← LanguageProvider + useLanguage hook
    ├── themes/
    │   ├── light.theme.ts
    │   ├── dark.theme.ts
    │   └── theme_context.tsx        ← ThemeProvider + useTheme hook
    └── utils/
        └── scaling.ts               ← ws(), hs(), fs()
```

## 2. Path Aliases

Configured in both `tsconfig.json` and `babel.config.js` (via `babel-plugin-module-resolver`):

| Alias | Path |
|-------|------|
| `@/*` | `./src/*` |
| `@assets/*` | `./src/assets/*` |
| `@themes/*` | `./src/presentation/themes/*` |

## 3. Dependencies to Install

**Production:**
- `@reduxjs/toolkit` + `react-redux` — state management
- `@react-navigation/native` + `@react-navigation/native-stack` + `react-native-screens` — navigation
- `i18next` + `react-i18next` — internationalization
- `@react-native-async-storage/async-storage` — persistence for theme/language/session

**Dev:**
- `babel-plugin-module-resolver` — path alias resolution

## 4. Theming

Two themes (`lightTheme`, `darkTheme`) with identical type structure.

### Brand Colors
- Primary: `#E8522A` (DEVOPSolution orange) — CTAs, active tab indicators
- Primary Dark: `#C4421F` — pressed states
- Secondary: `#1B2A4A` (dark navy) — headings, nav bar backgrounds
- Secondary Light: `#2A3F6A` — hover/alt states

### Semantic Status Colors (identical in both themes)
- Success: `#22C55E` — present, approved
- Warning: `#F59E0B` — pending, late
- Error: `#EF4444` — rejected, absent, missed checkout
- Neutral: `#9CA3AF` — cancelled, inactive
- Info: `#3B82F6` — informational banners

### Surface Colors
- Light: white backgrounds, light gray cards, subtle borders
- Dark: dark gray backgrounds, elevated dark surfaces, muted borders

### Text Colors
- `text.primary` — main body text
- `text.secondary` — secondary/metadata
- `text.disabled` — disabled controls
- `text.inverse` — text on colored backgrounds

### Typography Tokens (using `fs()` scaling)
| Token | Size | Usage |
|-------|------|-------|
| display | fs(32) | Hero numbers, page titles |
| heading | fs(22) | Section titles |
| subheading | fs(18) | Card titles |
| body | fs(15) | List items, form labels |
| caption | fs(13) | Timestamps, metadata |
| micro | fs(11) | Legal, version |

### Font Weights
- `regular: '400'`
- `medium: '500'`
- `semibold: '600'`
- `bold: '700'`

### ThemeContext
- Provides: `{ theme, isDark, toggleTheme, setThemeMode }`
- Persisted to AsyncStorage under key `@devopsolution/theme`
- Default: light theme

## 5. Localization & RTL

### i18next Configuration
- Default language: `en`
- Fallback: `en`
- Language detector reads from AsyncStorage (`@devopsolution/language`)
- Interpolation escaping disabled (React handles it)

### Translation Keys (infrastructure only)
```
common: loading, error, retry, cancel, confirm, save, ok
auth: login, logout
tabs: home, attendance, vacations, team, profile
```

Arabic file mirrors all keys with Arabic translations.

### LanguageContext
- Provides: `{ t, isRTL, language, changeLanguage }`
- `changeLanguage`: persists to AsyncStorage, calls `I18nManager.forceRTL()`, logs restart warning
- No restart package wired yet — to be added later

## 6. Dependency Injection

### AppConfig
```typescript
API_BASE_URL: 'https://api.devopsolution.com'
USE_MOCK: true
MOCK_DELAY_MS: 800
PAGE_SIZE: 20
```

### ServiceLocator
- Static class with private registry (`Map<string, unknown>`)
- `initialize()`: called once at app startup, empty for now
- `get<T>(key: string): T`: retrieves a registered instance, throws if not found
- `register<T>(key: string, instance: T)`: registers an instance
- `reset()`: clears all registrations (for testing)

## 7. Redux Store

### Store Configuration
- `configureStore` with empty reducer map (placeholder reducer to avoid empty store error)
- Middleware: default RTK middleware

### Typed Hooks
- `useAppDispatch`: returns `AppDispatch` type
- `useAppSelector`: typed with `RootState`

### SerializableDomainError
```typescript
{ code: string; message: string }
```
Defined alongside hooks for use in async thunks later.

## 8. Navigation (Minimal)

### RootStackParamList
- `Placeholder: undefined` — single route for now

### Navigation Ref
- `navigationRef` created via `createNavigationContainerRef`
- Exported helpers: `navigate()`, `resetTo()`, `goBack()`
- Safe to call outside React components (e.g., in thunks)

### RequireAuth Guard
- Pass-through wrapper for now (no auth slice exists yet)
- Will check `selectIsAuthenticated` and `selectSessionRestored` when auth is implemented

### Root Navigator
- `NavigationContainer` with `navigationRef`
- Single `Stack.Navigator` with `Placeholder` screen

## 9. Domain Base Classes

### BaseEntity
```typescript
interface BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### UseCase
```typescript
abstract class UseCase<TInput, TOutput> {
  abstract execute(input: TInput): Promise<TOutput>;
}
```

### DomainError
```typescript
class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
```

### Core Types
```typescript
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type Brand<T, B extends string> = T & { readonly _brand: B };
```

## 10. Responsive Scaling

Base design dimensions: iPhone 14 Pro (390 x 844).

```typescript
ws(size)  // width scale — horizontal padding, margins, widths, borderRadius, icons
hs(size)  // height scale — vertical padding, margins, heights
fs(size)  // font scale — all font sizes (moderate scaling factor)
```

## 11. App Startup Sequence

```
1. index.js registers App component
2. App.tsx calls ServiceLocator.initialize()
3. Provider tree renders:
   <ReduxProvider store={store}>
     <SafeAreaProvider>
       <ThemeProvider>
         <LanguageProvider>
           <RootNavigation />
         </LanguageProvider>
       </ThemeProvider>
     </SafeAreaProvider>
   </ReduxProvider>
4. RootNavigation renders Stack Navigator with Placeholder screen
```

## 12. Storage Keys

All AsyncStorage keys centralized in `core/keys/storage.key.ts`:

| Key | Purpose |
|-----|---------|
| `@devopsolution/theme` | Persisted theme mode (light/dark) |
| `@devopsolution/language` | Persisted language preference |
| `@devopsolution/session` | Future: auth session data |

---

## Out of Scope (for later)

- Domain entities (Employee, Department, Attendance, VacationRequest, etc.)
- Use cases and repository interfaces
- Data layer (DTOs, mappers, data sources, repository implementations)
- Redux slices (auth, attendance, vacations, team)
- All 20 screens from the screen map
- Bottom tab navigator
- Firebase Cloud Messaging
- Offline sync queue
- Atomic design components (status chips, balance cards, etc.)

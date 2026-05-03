import React, { useEffect, useRef } from 'react';
import { AppState, StatusBar, type AppStateStatus } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/presentation/store';
import {
  bootstrapAuth,
  bootstrapMe,
  clearCurrentUser,
  refreshCurrentUser,
} from '@/presentation/store/slices';
import { ThemeProvider, useTheme } from '@themes/theme_context';
import { LanguageProvider, useLanguage } from '@/presentation/localization/language_context';
import { DialogProvider } from '@/presentation/components/molecules';
import { RootNavigation } from '@/presentation/navigation/root_navigation';
import { ServiceLocator } from '@/di';
import { DiKeys } from '@/core/keys/di.key';
import type { HttpClient } from '@/data/data_sources/http';
import type { LogoutUseCase } from '@/domain/use_cases';
import { authLog } from '@/core/logger';

// Initialize DI before any render
ServiceLocator.initialize();

// Wire the HttpClient → 401 → session-clear flow. Any thunk that hits 401
// against any BE endpoint will now drop the user back to the login screen
// without each thunk having to handle it. clearCurrentUser is dispatched
// before signOut so the observer never sees a signed-out Firebase state
// alongside a populated profile.
const httpClient = ServiceLocator.get<HttpClient>(DiKeys.HTTP_CLIENT);
httpClient.setOnUnauthorized(() => {
  authLog.warn('bootstrap', '401 received → clearing session');
  store.dispatch(clearCurrentUser());
  const logoutUseCase = ServiceLocator.get<LogoutUseCase>(DiKeys.LOGOUT_USE_CASE);
  void logoutUseCase.execute().catch((e) => {
    authLog.warn('bootstrap', '401 → signOut threw (non-fatal)', e);
  });
});

// Threshold for "long enough in background to refetch /me on return".
const FOREGROUND_REFRESH_AFTER_MS = 5 * 60_000;

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigation />
    </>
  );
}

function AppRoot() {
  const { remountKey } = useLanguage();
  const backgroundedAtRef = useRef<number | null>(null);

  useEffect(() => {
    // Hydrate the cached profile FIRST so the splash → home transition
    // has role/permissions to render against — bootstrapAuth will fire
    // fetchCurrentUser shortly after, replacing the cache with a fresh copy.
    store.dispatch(bootstrapMe());
    store.dispatch(bootstrapAuth());

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAtRef.current = Date.now();
        return;
      }
      if (state === 'active' && backgroundedAtRef.current) {
        const elapsed = Date.now() - backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        if (elapsed > FOREGROUND_REFRESH_AFTER_MS) {
          authLog.info(
            'bootstrap',
            `AppState → active after ${Math.round(elapsed / 1000)}s in background, refreshing /me`,
          );
          store.dispatch(refreshCurrentUser());
        }
      }
    });

    return () => sub.remove();
  }, []);

  return <AppContent key={remountKey} />;
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DialogProvider>
            <LanguageProvider>
              <AppRoot />
            </LanguageProvider>
          </DialogProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}

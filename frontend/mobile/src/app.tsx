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

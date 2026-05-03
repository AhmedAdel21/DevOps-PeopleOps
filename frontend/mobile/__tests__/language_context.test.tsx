import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { LanguageProvider, useLanguage } from '../src/presentation/localization/language_context';
import { DialogProvider } from '../src/presentation/components/molecules';
import { ThemeProvider } from '../src/presentation/themes/theme_context';

// Capture context values from inside the tree
let captured: ReturnType<typeof useLanguage> | null = null;

const Consumer = () => {
  captured = useLanguage();
  return null;
};

// LanguageProvider's RTL-flip flow shows a confirmation dialog, which
// requires DialogProvider (and DialogProvider's content uses theme,
// requiring ThemeProvider too) above it. Wrap so the hooks resolve.
const renderTree = () =>
  ReactTestRenderer.create(
    <ThemeProvider>
      <DialogProvider>
        <LanguageProvider>
          <Consumer />
        </LanguageProvider>
      </DialogProvider>
    </ThemeProvider>,
  );

beforeEach(() => {
  captured = null;
});

afterEach(() => {
  jest.restoreAllMocks();
  // Ensure I18nManager.isRTL is reset to false after each test
  const { I18nManager } = require('react-native');
  Object.defineProperty(I18nManager, 'isRTL', { configurable: true, value: false });
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

  // EN → EN: LTR stays LTR, no increment
  await ReactTestRenderer.act(async () => {
    await captured!.changeLanguage('en');
  });
  expect(captured!.remountKey).toBe(0);

  // Simulate already being in AR (RTL) by mocking I18nManager.isRTL
  const { I18nManager } = require('react-native');
  const originalIsRTL = I18nManager.isRTL;
  Object.defineProperty(I18nManager, 'isRTL', { configurable: true, value: true });

  // AR → AR: RTL stays RTL, no increment
  const keyBeforeArAr = captured!.remountKey;
  await ReactTestRenderer.act(async () => {
    await captured!.changeLanguage('ar');
  });
  expect(captured!.remountKey).toBe(keyBeforeArAr);

  // Restore
  Object.defineProperty(I18nManager, 'isRTL', { configurable: true, value: originalIsRTL });
});

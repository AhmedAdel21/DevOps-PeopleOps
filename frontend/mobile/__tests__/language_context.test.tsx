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

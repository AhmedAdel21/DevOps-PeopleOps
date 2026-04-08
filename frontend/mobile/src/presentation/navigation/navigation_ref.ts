import { createNavigationContainerRef, StackActions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(
  name: keyof RootStackParamList,
  params?: Record<string, unknown>,
): void {
  if (navigationRef.isReady()) {
    // @ts-expect-error - React Navigation's overloaded navigate types are complex; runtime behavior is correct
    navigationRef.navigate(name, params);
  }
}

export function resetTo(
  name: keyof RootStackParamList,
  params?: Record<string, unknown>,
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

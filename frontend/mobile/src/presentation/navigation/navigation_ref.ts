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

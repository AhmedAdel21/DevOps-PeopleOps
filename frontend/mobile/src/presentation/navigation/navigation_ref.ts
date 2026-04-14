import { createNavigationContainerRef, StackActions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<T extends keyof RootStackParamList>(
  name: T,
  ...args: RootStackParamList[T] extends undefined ? [] : [RootStackParamList[T]]
): void {
  if (navigationRef.isReady()) {
    // @ts-expect-error - React Navigation's overloaded navigate types are complex; runtime behavior is correct
    navigationRef.navigate(name, ...args);
  }
}


export function resetTo<T extends keyof RootStackParamList>(
  name: T,
  ...args: RootStackParamList[T] extends undefined ? [] : [RootStackParamList[T]]
): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      StackActions.replace(name, args[0] as never),
    );
  }
}

export function goBack(): void {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

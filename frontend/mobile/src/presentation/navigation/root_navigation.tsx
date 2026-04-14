import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { navigationRef } from './navigation_ref';
import type { RootStackParamList } from './types';

import { SplashScreen } from '@/presentation/screens/splash';
import { PlaceholderScreen } from '@/presentation/screens/placeholder_screen';
import {
  LoginScreen,
  ForgotPasswordScreen,
  OtpScreen,
  SetPasswordScreen,
  type LoginScreenStatus,
} from '@/presentation/screens/auth';
import { LocationPickerSheet } from '@/presentation/screens/location_picker';
import { MainTabsNavigator } from './main_tabs_navigator';
import {
  useAppDispatch,
  useAppSelector,
} from '@/presentation/store/hooks';
import {
  loginWithEmail,
  clearLoginError,
} from '@/presentation/store/slices';
import {
  selectAuthStatus,
  selectLoginStatus,
  selectLoginError,
} from '@/presentation/store/selectors';
import type { AuthErrorCode } from '@/domain/errors';
import { authLog } from '@/core/logger';

const Stack = createNativeStackNavigator<RootStackParamList>();

type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

const ERROR_I18N_KEY: Record<AuthErrorCode, string> = {
  'invalid-credentials': 'auth.loginScreen.errors.invalidCredentials',
  'user-disabled': 'auth.loginScreen.errors.userDisabled',
  'too-many-requests': 'auth.loginScreen.errors.accountLocked',
  network: 'auth.loginScreen.errors.network',
  unknown: 'common.error',
};

const resolveErrorCode = (code: string | undefined): AuthErrorCode => {
  if (!code?.startsWith('auth/')) return 'unknown';
  const tail = code.slice('auth/'.length) as AuthErrorCode;
  return tail in ERROR_I18N_KEY ? tail : 'unknown';
};

const SplashWrapper: React.FC<ScreenProps<'Splash'>> = ({ navigation }) => {
  const authStatus = useAppSelector(selectAuthStatus);
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);

  const handleReady = useCallback(() => {
    setMinDelayElapsed(true);
  }, []);

  useEffect(() => {
    if (!minDelayElapsed) return;
    if (authStatus === 'uninitialized') {
      authLog.info(
        'navigation',
        'SplashWrapper waiting: min delay elapsed but auth still uninitialized',
      );
      return;
    }
    const target = authStatus === 'authenticated' ? 'MainTabs' : 'Login';
    authLog.info(
      'navigation',
      `SplashWrapper routing → ${target} (authStatus=${authStatus})`,
    );
    navigation.replace(target);
  }, [minDelayElapsed, authStatus, navigation]);

  return <SplashScreen onReady={handleReady} />;
};

const LoginWrapper: React.FC<ScreenProps<'Login'>> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const loginStatus = useAppSelector(selectLoginStatus);
  const loginError = useAppSelector(selectLoginError);
  const authStatus = useAppSelector(selectAuthStatus);

  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const screenStatus: LoginScreenStatus =
    loginStatus === 'pending'
      ? 'submitting'
      : loginStatus === 'error'
      ? 'error'
      : 'idle';

  const errorMessage = useMemo(() => {
    if (!loginError) return undefined;
    const code = resolveErrorCode(loginError.code);
    return t(ERROR_I18N_KEY[code]);
  }, [loginError, t]);

  // Clear any stale error when Login screen mounts.
  useEffect(() => {
    dispatch(clearLoginError());
  }, [dispatch]);

  // Navigate to the app once the observer reports the user is authenticated.
  useEffect(() => {
    if (authStatus === 'authenticated') {
      setShowLocationPicker(true);
    }
  }, [authStatus]);

  const handleSubmit = useCallback(
    (credentials: { email: string; password: string }) => {
      authLog.info(
        'navigation',
        `LoginWrapper submit → dispatching loginWithEmail (email=${authLog.maskEmail(credentials.email)})`,
      );
      dispatch(loginWithEmail(credentials));
    },
    [dispatch],
  );

  const handleForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  return (
    <>
      <LoginScreen
        status={screenStatus}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onForgotPassword={handleForgotPassword}
      />
      <LocationPickerSheet
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(_locationId) => {
          setShowLocationPicker(false);
          navigation.replace('MainTabs');
        }}
      />
    </>
  );
};

const ForgotPasswordWrapper: React.FC<ScreenProps<'ForgotPassword'>> = ({
  navigation,
}) => {
  const handleSubmit = useCallback(
    (email: string) => {
      // TODO: dispatch forgot password thunk. On success:
      navigation.navigate('Otp', { email });
    },
    [navigation],
  );
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  return (
    <ForgotPasswordScreen onSubmit={handleSubmit} onBackToLogin={handleBack} />
  );
};

const OtpWrapper: React.FC<ScreenProps<'Otp'>> = ({ navigation, route }) => {
  const { email } = route.params;

  const handleVerify = useCallback(
    (_code: string) => {
      // TODO: dispatch verify OTP thunk. On success:
      navigation.navigate('SetPassword', {
        mode: 'reset',
        token: 'placeholder-token',
      });
    },
    [navigation],
  );

  const handleResend = useCallback(() => {
    // TODO: dispatch resend code thunk
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <OtpScreen
      email={email}
      onVerify={handleVerify}
      onResend={handleResend}
      onBack={handleBack}
    />
  );
};

const SetPasswordWrapper: React.FC<ScreenProps<'SetPassword'>> = ({
  navigation,
  route,
}) => {
  const { mode } = route.params;

  const handleSubmit = useCallback((_password: string) => {
    // TODO: dispatch set password thunk
    // The screen internally transitions to the success view on its own
  }, []);

  const handleContinue = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SetPasswordScreen
      mode={mode}
      onSubmit={handleSubmit}
      onContinue={handleContinue}
      onBack={handleBack}
    />
  );
};

export const RootNavigation: React.FC = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashWrapper}
          options={{ animation: 'none' }}
        />
        <Stack.Screen name="Login" component={LoginWrapper} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordWrapper} />
        <Stack.Screen name="Otp" component={OtpWrapper} />
        <Stack.Screen name="SetPassword" component={SetPasswordWrapper} />
        <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
        <Stack.Screen name="Placeholder" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  CommonActions,
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  type Theme,
} from '@react-navigation/native';
import { useTheme } from '@themes/index';
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
  type SetPasswordScreenStatus,
} from '@/presentation/screens/auth';
import { MainTabsNavigator } from './main_tabs_navigator';
import { HistoryScreen } from '@/presentation/screens/history';
import {
  useAppDispatch,
  useAppSelector,
} from '@/presentation/store/hooks';
import {
  loginWithEmail,
  loginWithZoho,
  clearLoginError,
  clearZohoLoginError,
  changePassword,
  clearChangePasswordState,
} from '@/presentation/store/slices';
import {
  selectAuthStatus,
  selectChangePasswordError,
  selectChangePasswordStatus,
  selectLoginStatus,
  selectLoginError,
  selectZohoLoginStatus,
  selectZohoLoginError,
  selectMustChangePassword,
  selectCurrentUser,
  selectMeFetchStatus,
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
  'zoho-cancelled': 'common.error',
  'zoho-employee-not-linked': 'auth.loginScreen.errors.zohoEmployeeNotLinked',
  // Change-password flow — used by SetPasswordScreen via SetPasswordWrapper.
  'weak-password': 'auth.setPassword.errors.weakPassword',
  'requires-recent-login': 'auth.setPassword.errors.requiresRecentLogin',
  'no-current-user': 'auth.setPassword.errors.noCurrentUser',
  'change-password-failed': 'auth.setPassword.errors.changeFailed',
};

const resolveErrorCode = (code: string | undefined): AuthErrorCode => {
  if (!code?.startsWith('auth/')) return 'unknown';
  const tail = code.slice('auth/'.length) as AuthErrorCode;
  return tail in ERROR_I18N_KEY ? tail : 'unknown';
};

const SplashWrapper: React.FC<ScreenProps<'Splash'>> = ({ navigation }) => {
  const authStatus = useAppSelector(selectAuthStatus);
  const currentUser = useAppSelector(selectCurrentUser);
  const meFetchStatus = useAppSelector(selectMeFetchStatus);
  const mustChangePassword = useAppSelector(selectMustChangePassword);
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
    if (authStatus === 'unauthenticated') {
      authLog.info('navigation', 'SplashWrapper routing → Login');
      navigation.replace('Login');
      return;
    }
    // authenticated: hold the splash until /me has settled. The cache
    // hydration in bootstrapMe usually populates currentUser before this
    // point; if not, we wait for fetchCurrentUser to complete (success or
    // error). meFetchStatus === 'error' falls through to Login (the 401
    // handler will already have signed the user out by then).
    if (!currentUser) {
      if (meFetchStatus === 'pending') {
        authLog.info('navigation', 'SplashWrapper waiting on /me');
        return;
      }
      if (meFetchStatus === 'error') {
        authLog.warn('navigation', 'SplashWrapper → /me errored, sending to Login');
        navigation.replace('Login');
        return;
      }
      // idle + no user: the observer should have dispatched fetchCurrentUser
      // by now. Wait one more tick.
      return;
    }
    if (mustChangePassword) {
      authLog.info('navigation', 'SplashWrapper → mustChangePassword, routing to SetPassword');
      navigation.reset({
        index: 0,
        routes: [{ name: 'SetPassword', params: { mode: 'firstLogin', token: '' } }],
      });
      return;
    }
    authLog.info('navigation', 'SplashWrapper routing → MainTabs');
    navigation.replace('MainTabs');
  }, [minDelayElapsed, authStatus, currentUser, meFetchStatus, mustChangePassword, navigation]);

  return <SplashScreen onReady={handleReady} />;
};

const LoginWrapper: React.FC<ScreenProps<'Login'>> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const loginStatus = useAppSelector(selectLoginStatus);
  const loginError = useAppSelector(selectLoginError);
  const zohoLoginStatus = useAppSelector(selectZohoLoginStatus);
  const zohoLoginError = useAppSelector(selectZohoLoginError);
  const authStatus = useAppSelector(selectAuthStatus);
  const mustChangePassword = useAppSelector(selectMustChangePassword);

  const screenStatus: LoginScreenStatus =
    loginStatus === 'pending'
      ? 'submitting'
      : loginStatus === 'error'
      ? 'error'
      : 'idle';

  const zohoScreenStatus: LoginScreenStatus =
    zohoLoginStatus === 'pending'
      ? 'submitting'
      : zohoLoginStatus === 'error'
      ? 'error'
      : 'idle';

  const errorMessage = useMemo(() => {
    if (!loginError) return undefined;
    const code = resolveErrorCode(loginError.code);
    return t(ERROR_I18N_KEY[code]);
  }, [loginError, t]);

  const zohoErrorMessage = useMemo(() => {
    if (!zohoLoginError) return undefined;
    const code = resolveErrorCode(zohoLoginError.code);
    return t(ERROR_I18N_KEY[code]);
  }, [zohoLoginError, t]);

  // Clear any stale errors when Login screen mounts.
  useEffect(() => {
    dispatch(clearLoginError());
    dispatch(clearZohoLoginError());
  }, [dispatch]);

  // Once the observer reports the user is authenticated AND /me has loaded,
  // route to the appropriate screen. Holding for currentUser (instead of
  // routing on authStatus alone) ensures mustChangePassword has its real
  // value — it now comes from /me, not from the Zoho login response.
  const currentUser = useAppSelector(selectCurrentUser);
  useEffect(() => {
    if (authStatus !== 'authenticated' || !currentUser) return;
    if (mustChangePassword) {
      authLog.info(
        'navigation',
        'LoginWrapper → mustChangePassword, resetting stack to SetPassword',
      );
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'SetPassword',
            params: { mode: 'firstLogin', token: '' },
          },
        ],
      });
    } else {
      authLog.info(
        'navigation',
        'LoginWrapper → auth success, resetting stack to MainTabs',
      );
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  }, [authStatus, currentUser, mustChangePassword, navigation]);

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

  const handleZohoSignIn = useCallback(() => {
    authLog.info('navigation', 'LoginWrapper → dispatching loginWithZoho');
    dispatch(loginWithZoho());
  }, [dispatch]);

  const handleForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  return (
    <LoginScreen
      status={screenStatus}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      onForgotPassword={handleForgotPassword}
      onZohoSignIn={handleZohoSignIn}
      zohoStatus={zohoScreenStatus}
      zohoErrorMessage={zohoErrorMessage}
    />
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
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { mode } = route.params;

  const changePasswordStatus = useAppSelector(selectChangePasswordStatus);
  const changePasswordError = useAppSelector(selectChangePasswordError);

  // Reset slice state on mount AND unmount: on mount so a prior error
  // from a previous attempt doesn't reappear; on unmount so leaving the
  // screen clears the "success" sentinel before any future attempts.
  useEffect(() => {
    dispatch(clearChangePasswordState());
    return () => {
      dispatch(clearChangePasswordState());
    };
  }, [dispatch]);

  // Forgot-password (`reset`) needs a BE endpoint that accepts the OTP
  // token + a new password to set it on a NOT-yet-signed-in user. That
  // endpoint doesn't exist yet, so the screen surfaces a fixed
  // "coming soon" banner in this mode and the submit dispatch is a no-op
  // (the screen still validates rules client-side as visual feedback).
  const resetNotImplemented = mode === 'reset';

  const screenStatus: SetPasswordScreenStatus = resetNotImplemented
    ? 'error'
    : changePasswordStatus === 'pending'
    ? 'submitting'
    : changePasswordStatus === 'success'
    ? 'success'
    : changePasswordStatus === 'error'
    ? 'error'
    : 'idle';

  const errorMessage = useMemo(() => {
    if (resetNotImplemented) {
      return t('auth.setPassword.errors.resetNotImplemented');
    }
    if (!changePasswordError) return undefined;
    const code = resolveErrorCode(changePasswordError.code);
    return t(ERROR_I18N_KEY[code]);
  }, [resetNotImplemented, changePasswordError, t]);

  const handleSubmit = useCallback(
    (newPassword: string) => {
      if (mode === 'firstLogin') {
        authLog.info(
          'navigation',
          'SetPasswordWrapper submit (firstLogin) → dispatching changePassword',
        );
        dispatch(changePassword({ newPassword }));
        return;
      }
      // See `resetNotImplemented` comment above — no-op until BE lands.
      authLog.warn(
        'navigation',
        'SetPasswordWrapper submit (reset) → BE endpoint not yet implemented; dispatch is a no-op.',
      );
    },
    [dispatch, mode],
  );

  const handleContinue = useCallback(() => {
    // SetPassword is reached via two different stack shapes:
    //   - firstLogin: LoginWrapper did navigation.reset, so the stack is
    //     exactly [SetPassword] and the user is already authenticated.
    //     popToTop has nowhere to go — React Navigation logs
    //     "POP_TO_TOP not handled by any navigator". Reset forward to
    //     MainTabs instead.
    //   - reset (forgot-password): stack is
    //     [Login, ForgotPassword, Otp, SetPassword]. popToTop returns to
    //     Login so the user can sign in with the new password.
    if (mode === 'firstLogin') {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } else {
      navigation.popToTop();
    }
  }, [mode, navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SetPasswordScreen
      mode={mode}
      status={screenStatus}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      onContinue={handleContinue}
      onBack={handleBack}
    />
  );
};

// Transparent nav theme so the DS page wash (rendered behind the
// navigator) shows through any screen whose root is transparent. Screens
// with an opaque root are unaffected — they keep covering the wash until
// they opt in during the Phase 4 sweep.
const navTheme = (dark: boolean): Theme => {
  const base = dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: { ...base.colors, background: 'transparent' },
  };
};

export const RootNavigation: React.FC = () => {
  const { theme } = useTheme();
  const authStatus = useAppSelector(selectAuthStatus);
  const mustChangePassword = useAppSelector(selectMustChangePassword);
  const prevAuthStatusRef = useRef(authStatus);
  const prevMustChangePasswordRef = useRef(mustChangePassword);

  // Centralised auth-driven routing: whenever the observer reports the user
  // has lost authentication (explicit logout, token revocation, session
  // expiry, etc.), reset the root stack back to the Login screen. This
  // removes the need for every logout button to navigate manually.
  useEffect(() => {
    const previous = prevAuthStatusRef.current;
    prevAuthStatusRef.current = authStatus;

    if (
      previous === 'authenticated' &&
      authStatus === 'unauthenticated' &&
      navigationRef.isReady()
    ) {
      authLog.info(
        'navigation',
        'RootNavigation → auth lost, resetting root stack to Login',
      );
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        }),
      );
    }
  }, [authStatus]);

  // mustChangePassword can flip from false → true mid-session if a /me
  // refresh discovers the BE has flagged the account (e.g. forced password
  // reset). The splash + login wrappers handle the first-render case;
  // this effect catches the mid-session flip and forces the stack to
  // SetPassword regardless of where the user currently is.
  useEffect(() => {
    const previous = prevMustChangePasswordRef.current;
    prevMustChangePasswordRef.current = mustChangePassword;

    if (
      mustChangePassword &&
      !previous &&
      authStatus === 'authenticated' &&
      navigationRef.isReady()
    ) {
      const currentRoute = navigationRef.getCurrentRoute()?.name;
      if (currentRoute === 'SetPassword') return;
      authLog.info(
        'navigation',
        `RootNavigation → mustChangePassword flipped true (current=${currentRoute}), resetting to SetPassword`,
      );
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'SetPassword', params: { mode: 'firstLogin', token: '' } },
          ],
        }),
      );
    }
  }, [mustChangePassword, authStatus]);

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme(theme.dark)}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
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
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

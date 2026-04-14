import React, { useCallback, useState } from 'react';
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
} from '@/presentation/screens/auth';
import { LocationPickerSheet } from '@/presentation/screens/location_picker';
import { MainTabsNavigator } from './main_tabs_navigator';



const Stack = createNativeStackNavigator<RootStackParamList>();

type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

const SplashWrapper: React.FC<ScreenProps<'Splash'>> = ({ navigation }) => {
  const onReady = useCallback(() => {
    navigation.replace('Login');
  }, [navigation]);

  return <SplashScreen onReady={onReady} />;
};

const LoginWrapper: React.FC<ScreenProps<'Login'>> = ({ navigation }) => {
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleSubmit = useCallback(
    (_credentials: { email: string; password: string }) => {
      // TODO: dispatch login thunk. On success:
      // navigation.replace('Placeholder'); // or home screen
      // For demo, show the location picker:
      setShowLocationPicker(true);
    },
    [],
  );

  const handleForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  return (
    <>
      <LoginScreen
        onSubmit={handleSubmit}
        onForgotPassword={handleForgotPassword}
      />
      <LocationPickerSheet
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(_locationId) => {
          setShowLocationPicker(false);
          // TODO: persist selected location
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
    <ForgotPasswordScreen
      onSubmit={handleSubmit}
      onBackToLogin={handleBack}
    />
  );
};

const OtpWrapper: React.FC<ScreenProps<'Otp'>> = ({ navigation, route }) => {
  const { email } = route.params;

  const handleVerify = useCallback(
    (_code: string) => {
      // TODO: dispatch verify OTP thunk. On success:
      navigation.navigate('SetPassword', { mode: 'reset', token: 'placeholder-token' });
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
    // After popping back to Login, the user can sign in with the new password
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

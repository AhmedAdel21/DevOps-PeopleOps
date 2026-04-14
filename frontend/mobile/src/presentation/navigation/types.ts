export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Otp: { email: string };
  SetPassword: { mode: 'reset' | 'firstLogin'; token: string };
  Placeholder: undefined; // keep until home screen is built
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Otp: { email: string };
  SetPassword: { mode: 'reset' | 'firstLogin'; token: string };
  MainTabs: undefined;
  Placeholder: undefined;
  History: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Attendance: undefined;
  Leave: undefined;
  Team: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
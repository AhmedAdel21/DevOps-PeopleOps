import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Button } from 'react-native';
import { useTheme } from '@themes/theme_context';
import { useLanguage } from '@/presentation/localization/language_context';
import type { AppTheme } from '@themes/index';
import { Mail, Lock, Eye } from 'lucide-react-native';
import {
  AppText,
  AppButton,
  AppTextField,
  AppCard,
  AppIconCircle,
  AppAlertBanner,
  AppDivider,
  AppBackButton,
} from '@/presentation/components/atoms';

import {
  AppLogo,
  AppName,
  AppOtpInput,
  AppPasswordStrengthMeter,
  AppPasswordRulesList,
  scorePassword,
} from '@/presentation/components/molecules';

export const PlaceholderScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');

  const rules = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One symbol', met: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 32, backgroundColor: theme.colors.background }}
    >
      <AppLogo />
      <AppName />

      <View style={{ gap: 12 }}>
        <AppText variant="label">OTP</AppText>
        <AppOtpInput value={otp} onChange={setOtp} />
      </View>

      <View style={{ gap: 12 }}>
        <AppText variant="label">Password strength (score: {scorePassword(password).score})</AppText>
        <AppTextField
          placeholder="Type a password to test"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <AppPasswordStrengthMeter password={password} />
        <AppPasswordRulesList rules={rules} />
      </View>
    </ScrollView>
  );
  // return (
  //   <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
  //     <AppBackButton onPress={() => { }} />

  //     <AppText variant="display">Welcome back</AppText>
  //     <AppText variant="body" color={theme.colors.mutedForeground}>
  //       Sign in to continue
  //     </AppText>

  //     <AppIconCircle icon={Mail} />

  //     <AppCard title="Login" description="Use your work email">
  //       <AppTextField label="Email" placeholder="name@company.com" leftIcon={Mail} />
  //       <AppTextField
  //         label="Password"
  //         placeholder="••••••••"
  //         leftIcon={Lock}
  //         rightIcon={Eye}
  //         onRightIconPress={() => { }}
  //         secureTextEntry
  //       />
  //       <AppTextField label="With error" error="Invalid email" leftIcon={Mail} />
  //     </AppCard>

  //     <AppButton label="Primary" onPress={() => { }} fullWidth />
  //     <AppButton label="Secondary" variant="secondary" onPress={() => { }} fullWidth />
  //     <AppButton label="Outline" variant="outline" onPress={() => { }} fullWidth />
  //     <AppButton label="Ghost" variant="ghost" onPress={() => { }} fullWidth />
  //     <AppButton label="Destructive" variant="destructive" onPress={() => { }} fullWidth />
  //     <AppButton label="Loading" onPress={() => { }} loading fullWidth />
  //     <AppButton label="Small" size="sm" />
  //     <AppButton label="Large" size="lg" leftIcon={Mail} />

  //     <AppDivider />

  //     <AppAlertBanner variant="error" message="Account locked. Try again in 15 minutes." />
  //     <AppAlertBanner variant="warning" message="This code has expired." />
  //     <AppAlertBanner variant="success" message="Your password has been updated." />
  //     <AppAlertBanner variant="info" message="Tip: contact HR to get access." />
  //   </ScrollView>
  // );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: theme.typography.sizes.display,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.secondary,
    },
    subtitle: {
      fontSize: theme.typography.sizes.heading,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.primary,
      marginTop: 8,
    },
  });

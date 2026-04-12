export const en = {
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    ok: 'OK',
    back: 'Back',
    continue: 'Continue',
  },
  auth: {
    login: 'Login',
    logout: 'Logout',

    splash: {
      tagline: 'Attendance & Leave Management',
      version: 'v1.0',
    },

    loginScreen: {
      title: 'Welcome back',
      subtitle: 'Sign in to continue',
      emailLabel: 'Email address',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      forgotLink: 'Forgot password?',
      submit: 'Sign In',
      footer: "Don't have an account? Contact HR to get access.",
      errors: {
        invalidCredentials: 'Invalid email or password',
        accountLocked: 'Account locked. Try again in 15 minutes.',
      },
    },

    forgotPassword: {
      title: 'Forgot your password?',
      body: "Enter your work email and we'll send you a one-time code to reset your password.",
      emailLabel: 'Work email',
      emailPlaceholder: 'Enter your work email',
      submit: 'Send code',
      backToLogin: 'Back to login',
      errors: {
        notFound: 'No account found with that email address.',
      },
    },

    otp: {
      title: 'Enter the code',
      sentTo: 'We sent a 6-digit code to',
      resendIn: 'Didn\'t receive it? Resend in {{time}}',
      resendNow: 'Didn\'t receive it? Resend now',
      verify: 'Verify code',
      errors: {
        wrongCode: 'Incorrect code. Please try again.',
        expired: 'This code has expired.',
      },
    },

    setPassword: {
      resetTitle: 'Set new password',
      firstLoginTitle: 'Create your password',
      newLabel: 'New password',
      newPlaceholder: 'Enter new password',
      confirmLabel: 'Confirm password',
      confirmPlaceholder: 'Re-enter your password',
      submit: 'Set password',
      strength: {
        empty: '',
        weak: 'Weak',
        fair: 'Fair',
        good: 'Good',
        strong: 'Strong',
      },
      rules: {
        length: 'At least 8 characters',
        uppercase: 'One uppercase letter',
        number: 'One number',
        symbol: 'One special character',
      },
      success: {
        title: 'Password updated!',
        body: 'Your password has been set successfully. You can now sign in with your new credentials.',
        continue: 'Continue to login',
      },
      errors: {
        mismatch: 'Passwords do not match.',
      },
    },

    locationPicker: {
      greetingMorning: 'Good morning,',
      greetingAfternoon: 'Good afternoon,',
      greetingEvening: 'Good evening,',
      selectLocation: 'Select your location',
      notifications: 'Notifications',
    },
  },
  tabs: {
    home: 'Home',
    attendance: 'Attendance',
    vacations: 'Vacations',
    team: 'Team',
    profile: 'Profile',
  },
} as const;
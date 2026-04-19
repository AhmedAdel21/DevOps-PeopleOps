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
      orDivider: 'OR',
      zohoSignIn: 'Sign in with Zoho',
      footer: "Don't have an account? Contact HR to get access.",
      errors: {
        invalidCredentials: 'Invalid email or password',
        accountLocked: 'Too many attempts. Try again in a few minutes.',
        userDisabled: 'This account has been disabled. Contact HR for help.',
        network: 'Network error. Check your connection and try again.',
        zohoEmployeeNotLinked: 'No employee profile is linked to your Zoho account. Contact HR.',
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
  home: {
    greetingMorning: 'Good morning, {{name}}',
    greetingAfternoon: 'Good afternoon, {{name}}',
    greetingEvening: 'Good evening, {{name}}',
    recentTitle: 'Recent',
    historyLink: 'View full history',
    mode: {
      office: 'Office',
      remote: 'Remote',
    },
    leaveBalance: {
      annual: 'Annual {{count}}d',
      casual: 'Casual {{count}}d',
      sick: 'Sick —',
    },
    notSignedIn: {
      statusTitle: "You haven't signed in yet",
      statusSubtitle: 'Tap below to start your workday',
      signInCta: 'Sign In',
    },
    signedInOffice: {
      statusTitle: 'Signed in — Office',
      statusSubtitle: 'Since {{time}} · {{elapsed}} elapsed',
      todayLabel: 'Office · On time',
    },
    signedInRemote: {
      statusTitle: 'Signed in — Remote',
      statusSubtitle: 'Since {{time}} · {{elapsed}} elapsed',
      todayLabel: 'Remote · On time',
    },
    signOut: 'Sign out',
    errors: {
      sessionExpired: 'Your session has expired. Please sign in again.',
      employeeNotLinked:
        "We couldn't find your employee profile. Your Firebase email must match your Slack email.",
      invalidState: "That action isn't allowed right now.",
      network: 'Network error. Check your connection and try again.',
      generic: "Something went wrong. Please try again.",
      slackOAuthRequired: 'Connect your Slack account before signing in or out.',
    },
    slackBanner: {
      message: 'Connect your Slack account to enable sign-in and sign-out.',
      cta: 'Connect now',
    },
    signInSheet: {
      title: 'Where are you working from?',
      subtitle: 'Today, {{date}} · {{time}}',
      timeLabel: 'Sign-in time',
      modes: {
        office: {
          title: 'Office',
          body: 'Working from the office',
        },
        remote: {
          title: 'Remote',
          body: 'Working from home',
        },
      },
      confirm: 'Confirm sign-in',
      cancel: 'Cancel',
    },
  },
  tabs: {
    home: 'Home',
    attendance: 'Attendance',
    vacations: 'Leave',
    team: 'Team',
    profile: 'Profile',
  },
  comingSoon: {
    body: "We're still building this. Check back soon.",
  },
  profile: {
    languageRow: 'Language',
    slackConnect: {
      row: 'Connect Slack account',
      connected: 'Slack connected',
      connecting: 'Opening Slack…',
      errorToast: 'Could not start Slack connection. Try again.',
      disconnect: 'Disconnect Slack',
      disconnecting: 'Disconnecting…',
      disconnectErrorToast: 'Could not disconnect Slack. Try again.',
    },
    languageSheet: {
      title: 'Select Language',
      confirm: 'Apply',
      cancel: 'Cancel',
      languages: {
        en: { title: 'English', body: 'Switch app to English' },
        ar: { title: 'Arabic', body: 'Switch app to Arabic' },
      },
    },
  },
  attendance: {
    history: {
      title: 'Attendance History',
      empty: 'No attendance history yet',
      loadError: 'Failed to load history.',
      loadMoreError: 'Failed to load more.',
      retry: 'Retry',
      workedHours: '{{h}}h {{m}}m',
      workedHoursOnly: '{{h}}h',
      workedMinutesOnly: '{{m}}m',
      status: {
        inOffice: 'In Office',
        wfh: 'Remote',
        signedOut: 'Signed Out',
        notCheckedIn: 'No Check-in',
        vacation: 'Vacation',
        absent: 'Absent',
      },
      place: {
        inOffice: 'Office',
        wfh: 'Remote',
      },
    },
  },
} as const;

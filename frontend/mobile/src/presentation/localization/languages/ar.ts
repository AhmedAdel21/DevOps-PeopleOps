export const ar = {
  common: {
    loading: 'جاري التحميل...',
    error: 'حدث خطأ ما',
    retry: 'إعادة المحاولة',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ',
    ok: 'حسناً',
    back: 'رجوع',
    continue: 'متابعة',
    unknown: 'غير معروف',
  },
  auth: {
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',

    splash: {
      tagline: 'إدارة الحضور والإجازات',
      version: 'v1.0',
    },

    loginScreen: {
      title: 'مرحباً بعودتك',
      subtitle: 'سجّل الدخول للمتابعة',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'أدخل بريدك الإلكتروني',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور',
      forgotLink: 'نسيت كلمة المرور؟',
      submit: 'تسجيل الدخول',
      orDivider: 'أو',
      zohoSignIn: 'الدخول بحساب Zoho',
      footer: 'ليس لديك حساب؟ تواصل مع الموارد البشرية للحصول على وصول.',
      errors: {
        invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        accountLocked: 'محاولات كثيرة. حاول مجدداً بعد بضع دقائق.',
        userDisabled: 'تم تعطيل هذا الحساب. تواصل مع الموارد البشرية.',
        network: 'خطأ في الشبكة. تحقق من اتصالك ثم حاول مجدداً.',
        zohoEmployeeNotLinked:
          'لا يوجد ملف موظف مرتبط بحساب Zoho الخاص بك. تواصل مع الموارد البشرية.',
      },
    },

    forgotPassword: {
      title: 'نسيت كلمة المرور؟',
      body: 'أدخل بريدك الإلكتروني وسنرسل لك رمزاً لمرة واحدة لإعادة تعيين كلمة المرور.',
      emailLabel: 'البريد الإلكتروني للعمل',
      emailPlaceholder: 'أدخل بريدك الإلكتروني للعمل',
      submit: 'إرسال الرمز',
      backToLogin: 'العودة لتسجيل الدخول',
      errors: {
        notFound: 'لم يتم العثور على حساب بهذا البريد الإلكتروني.',
      },
    },

    otp: {
      title: 'أدخل الرمز',
      sentTo: 'أرسلنا رمزاً مكوناً من 6 أرقام إلى',
      resendIn: 'لم تستلم الرمز؟ إعادة الإرسال خلال {{time}}',
      resendNow: 'لم تستلم الرمز؟ أعد الإرسال الآن',
      verify: 'تحقق من الرمز',
      errors: {
        wrongCode: 'الرمز غير صحيح. حاول مجدداً.',
        expired: 'انتهت صلاحية هذا الرمز.',
      },
    },

    setPassword: {
      resetTitle: 'تعيين كلمة مرور جديدة',
      firstLoginTitle: 'أنشئ كلمة المرور الخاصة بك',
      newLabel: 'كلمة المرور الجديدة',
      newPlaceholder: 'أدخل كلمة المرور الجديدة',
      confirmLabel: 'تأكيد كلمة المرور',
      confirmPlaceholder: 'أعد إدخال كلمة المرور',
      submit: 'تعيين كلمة المرور',
      strength: {
        empty: '',
        weak: 'ضعيفة',
        fair: 'مقبولة',
        good: 'جيدة',
        strong: 'قوية',
      },
      rules: {
        length: '٨ أحرف على الأقل',
        uppercase: 'حرف كبير واحد',
        number: 'رقم واحد',
        symbol: 'رمز خاص واحد',
      },
      success: {
        title: 'تم تحديث كلمة المرور!',
        body: 'تم تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام بيانات الاعتماد الجديدة.',
        continue: 'المتابعة لتسجيل الدخول',
      },
      errors: {
        mismatch: 'كلمتا المرور غير متطابقتين.',
      },
    },

    locationPicker: {
      greetingMorning: 'صباح الخير،',
      greetingAfternoon: 'مساء الخير،',
      greetingEvening: 'مساء الخير،',
      selectLocation: 'اختر موقعك',
      notifications: 'الإشعارات',
    },
  },
  home: {
    greetingMorning: 'صباح الخير، {{name}}',
    greetingAfternoon: 'مساء الخير، {{name}}',
    greetingEvening: 'مساء الخير، {{name}}',
    recentTitle: 'الأخيرة',
    historyLink: 'عرض السجل الكامل',
    mode: {
      office: 'مكتب',
      remote: 'عن بُعد',
    },
    leaveBalance: {
      title: 'رصيد الإجازات',
      annual: 'سنوية {{count}}ي',
      casual: 'عرضية {{count}}ي',
      sick: 'مرضية —',
    },
    notSignedIn: {
      statusTitle: 'لم تسجّل دخولك بعد',
      statusSubtitle: 'اضغط أدناه لبدء يوم عملك',
      signInCta: 'تسجيل الدخول',
    },
    signedInOffice: {
      statusTitle: 'مسجّل الدخول — المكتب',
      statusSubtitle: 'منذ {{time}} · مضى {{elapsed}}',
      todayLabel: 'مكتب · في الوقت المحدد',
    },
    signedInRemote: {
      statusTitle: 'مسجّل الدخول — عن بُعد',
      statusSubtitle: 'منذ {{time}} · مضى {{elapsed}}',
      todayLabel: 'عن بُعد · في الوقت المحدد',
    },
    signOut: 'تسجيل الخروج',
    errors: {
      sessionExpired: 'انتهت صلاحية جلستك. الرجاء تسجيل الدخول مرة أخرى.',
      employeeNotLinked:
        'لم نتمكّن من العثور على ملف الموظف الخاص بك. يجب أن يطابق بريد Firebase بريد Slack.',
      invalidState: 'هذا الإجراء غير مسموح به حالياً.',
      network: 'خطأ في الشبكة. تحقق من اتصالك ثم حاول مجدداً.',
      generic: 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.',
      slackOAuthRequired: 'يرجى ربط حساب Slack قبل تسجيل الدخول أو الخروج.',
    },
    slackBanner: {
      message: 'ربط حساب Slack مطلوب لتفعيل تسجيل الدخول والخروج.',
      cta: 'ربط الآن',
    },
    signInSheet: {
      title: 'من أين تعمل اليوم؟',
      subtitle: 'اليوم، {{date}} · {{time}}',
      timeLabel: 'وقت تسجيل الدخول',
      modes: {
        office: {
          title: 'المكتب',
          body: 'العمل من المكتب',
        },
        remote: {
          title: 'عن بُعد',
          body: 'العمل من المنزل',
        },
      },
      confirm: 'تأكيد تسجيل الدخول',
      cancel: 'إلغاء',
    },
  },
  tabs: {
    home: 'الرئيسية',
    attendance: 'الحضور',
    vacations: 'الإجازات',
    team: 'الفريق',
    profile: 'الملف الشخصي',
  },
  comingSoon: {
    body: 'لا تزال هذه الميزة قيد التطوير. ترقّب عودتها قريباً.',
  },
  profile: {
    accountDetailsTitle: 'تفاصيل الحساب',
    preferencesTitle: 'التفضيلات',
    photoPreview: {
      hint: 'اضغط على الصورة لعرضها بالحجم الكامل',
      close: 'إغلاق',
      swipeHint: 'اسحب لأسفل للإغلاق',
    },
    fields: {
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      department: 'القسم',
      slackId: 'معرّف مستخدم Slack',
    },
    languageRow: 'اللغة',
    slackConnect: {
      row: 'ربط حساب Slack',
      connected: 'Slack مرتبط',
      connecting: 'جارٍ فتح Slack…',
      disconnect: 'قطع ربط Slack',
      disconnecting: 'جارٍ قطع الربط…',
      disconnectErrorToast: 'تعذّر قطع ربط Slack. حاول مجدداً.',
      errorToast: 'تعذّر بدء الاتصال بـ Slack. حاول مرة أخرى.',
      hint: 'للربط بضغطة واحدة، سجّل دخولك على slack.com من متصفّح الهاتف أولاً.',
    },
    languageSheet: {
      title: 'اختر اللغة',
      confirm: 'تطبيق',
      cancel: 'إلغاء',
      languages: {
        en: { title: 'الإنجليزية', body: 'تغيير التطبيق إلى الإنجليزية' },
        ar: { title: 'العربية', body: 'تغيير التطبيق إلى العربية' },
      },
    },
    rtlRestart: {
      title: 'إعادة التشغيل مطلوبة',
      body: 'يحتاج التطبيق لإعادة التشغيل لتطبيق الاتجاه الجديد.',
      ok: 'إعادة التشغيل الآن',
    },
  },
  leave: {
    title: 'الإجازات',
    balances: {
      title: 'أرصدة إجازاتي',
      daysRemaining: 'أيام متبقية',
      usedOf: '{{used}} مستخدم من {{total}}',
      unlimited: 'غير محدود',
      noLimit: 'بلا حد',
      types: {
        annual: 'سنوية',
        casual: 'عرضية',
        sick: 'مرضية',
      },
      leaveTypes: {
        annual: 'إجازة سنوية',
        casual: 'إجازة عرضية',
        sick: 'إجازة مرضية',
      },
    },
    requests: {
      title: 'طلباتي',
      newRequest: 'طلب جديد',
      filters: {
        all: 'الكل',
        pending: 'قيد الانتظار',
        approved: 'مقبول',
        rejected: 'مرفوض',
        cancelled: 'ملغى',
      },
      status: {
        approved: 'مقبول',
        pending: 'قيد الانتظار',
        rejected: 'مرفوض',
        cancelled: 'ملغى',
      },
      durationDay: 'يوم واحد',
      durationDays: '{{count}} أيام',
      empty: {
        title: 'لا توجد طلبات بعد',
        description: 'قدّم طلب إجازتك الأول للبدء',
        cta: '+ طلب جديد',
      },
    },
  },
  attendance: {
    history: {
      title: 'سجل الحضور',
      empty: 'لا يوجد سجل حضور بعد',
      loadError: 'فشل تحميل السجل.',
      loadMoreError: 'فشل تحميل المزيد.',
      retry: 'إعادة المحاولة',
      workedHours: '{{h}}س {{m}}د',
      workedHoursOnly: '{{h}}س',
      workedMinutesOnly: '{{m}}د',
      status: {
        inOffice: 'في المكتب',
        wfh: 'عن بُعد',
        signedOut: 'انصرف',
        notCheckedIn: 'لم يسجّل',
        vacation: 'إجازة',
        absent: 'غائب',
      },
      place: {
        inOffice: 'مكتب',
        wfh: 'عن بُعد',
      },
    },
  },
} as const;

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
      footer: 'ليس لديك حساب؟ تواصل مع الموارد البشرية للحصول على وصول.',
      errors: {
        invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        accountLocked: 'محاولات كثيرة. حاول مجدداً بعد بضع دقائق.',
        userDisabled: 'تم تعطيل هذا الحساب. تواصل مع الموارد البشرية.',
        network: 'خطأ في الشبكة. تحقق من اتصالك ثم حاول مجدداً.',
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
} as const;

export interface CalendarEvent {
  id: string;
  title: string;
  hijriDate: string;
  gregorianDate: string;
  type: 'semester_start' | 'vacation' | 'exam' | 'national_day' | 'training' | 'school_event';
  semester?: '1' | '2' | 'general';
  description?: string;
  daysCount?: number;
  isImportant?: boolean;
}

export interface AcademicSemesterInfo {
  semesterNumber: number;
  name: string;
  startDateHijri: string;
  startDateGregorian: string;
  endDateHijri: string;
  endDateGregorian: string;
  weeksCount: number;
  vacationName: string;
  vacationDateHijri: string;
  status: 'upcoming' | 'current' | 'completed';
}

export const ACADEMIC_YEAR_TITLE = "1448هـ";
export const ACADEMIC_SYSTEM_LABEL = "نظام الفصلين الدراسيين";

export const DEFAULT_ACADEMIC_SEMESTERS: AcademicSemesterInfo[] = [
  {
    semesterNumber: 1,
    name: "الفصل الدراسي الأول",
    startDateHijri: "14 صفر 1448هـ",
    startDateGregorian: "2026-08-28",
    endDateHijri: "28 جمادى الآخرة 1448هـ",
    endDateGregorian: "2026-12-08",
    weeksCount: 18,
    vacationName: "إجازة منتصف العام الدراسي (بين الفصلين)",
    vacationDateHijri: "نهاية دوام الخميس 28 جمادى الآخرة 1448هـ",
    status: "current",
  },
  {
    semesterNumber: 2,
    name: "الفصل الدراسي الثاني",
    startDateHijri: "16 رجب 1448هـ",
    startDateGregorian: "2026-12-25",
    endDateHijri: "2 محرم 1449هـ",
    endDateGregorian: "2027-06-10",
    weeksCount: 18,
    vacationName: "إجازة نهاية العام الدراسي (الإجازة الصيفية)",
    vacationDateHijri: "نهاية دوام الخميس 2 محرم 1449هـ",
    status: "upcoming",
  },
];

export const OFFICIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  // --- الفصل الدراسي الأول ---
  {
    id: "evt-1",
    title: "عودة الكوادر الإدارية والمعلمين للمدارس",
    hijriDate: "7 صفر 1448هـ",
    gregorianDate: "2026-08-21",
    type: "training",
    semester: "1",
    description: "بدء دوام منسوبي المدرسة والهيئة الإدارية والتعليمية واستكمال الجداول وتوزيع الفصول.",
    isImportant: true,
  },
  {
    id: "evt-2",
    title: "بداية الدراسة للطلاب للفصل الدراسي الأول",
    hijriDate: "14 صفر 1448هـ",
    gregorianDate: "2026-08-28",
    type: "semester_start",
    semester: "1",
    description: "انطلاق العام الدراسي 1448هـ بنظام الفصلين والترحيب بالطلاب واستلام المقررات المدرسية بمجمع الشريعة.",
    isImportant: true,
  },
  {
    id: "evt-3",
    title: "إجازة اليوم الوطني السعودي (96)",
    hijriDate: "11-12 ربيع الأول 1448هـ",
    gregorianDate: "2026-09-23",
    type: "national_day",
    semester: "1",
    daysCount: 2,
    description: "الاحتفاء باليوم الوطني للمملكة العربية السعودية وتعزيز قيم الانتماء والولاء.",
    isImportant: true,
  },
  {
    id: "evt-4",
    title: "إجازة نهاية أسبوع مطولة (الفصل الأول)",
    hijriDate: "2-3 جمادى الأولى 1448هـ",
    gregorianDate: "2026-10-14",
    type: "vacation",
    semester: "1",
    daysCount: 4,
    description: "إجازة نهاية أسبوع مطولة للطلاب والكوادر التعليمية والإدارية.",
  },
  {
    id: "evt-5",
    title: "إجازة منتصف الفصل الدراسي الأول (إجازة الخريف)",
    hijriDate: "25 جمادى الأولى 1448هـ",
    gregorianDate: "2026-11-05",
    type: "vacation",
    semester: "1",
    daysCount: 10,
    description: "تبدأ بنهاية دوام يوم الخميس وتستمر لمدة 10 أيام استراحة منتصف الفصل الأول.",
    isImportant: true,
  },
  {
    id: "evt-6",
    title: "بداية اختبارات نهاية الفصل الدراسي الأول",
    hijriDate: "17 جمادى الآخرة 1448هـ",
    gregorianDate: "2026-11-27",
    type: "exam",
    semester: "1",
    description: "انطلاق الاختبارات التحريرية الشاملة للفصل الأول لجميع المراحل (ابتدائي، متوسط، ثانوي) وإدخال الدرجات في نظام نور.",
    isImportant: true,
  },
  {
    id: "evt-7",
    title: "إجازة منتصف العام الدراسي (إجازة بين الفصلين)",
    hijriDate: "28 جمادى الآخرة 1448هـ",
    gregorianDate: "2026-12-08",
    type: "vacation",
    semester: "1",
    daysCount: 14,
    description: "نهاية الفصل الدراسي الأول وبدء إجازة منتصف العام الدراسي لمدة أسبوعين متتاليين.",
    isImportant: true,
  },

  // --- الفصل الدراسي الثاني ---
  {
    id: "evt-8",
    title: "بداية الدراسة للطلاب للفصل الدراسي الثاني",
    hijriDate: "16 رجب 1448هـ",
    gregorianDate: "2026-12-25",
    type: "semester_start",
    semester: "2",
    description: "استئناف الحصص الدراسية والمقررات للفصل الثاني وانطلاق الخطط التعليمية والإثرائية.",
    isImportant: true,
  },
  {
    id: "evt-9",
    title: "إجازة نهاية أسبوع مطولة (الفصل الثاني)",
    hijriDate: "2-3 شعبان 1448هـ",
    gregorianDate: "2027-02-10",
    type: "vacation",
    semester: "2",
    daysCount: 4,
    description: "إجازة نهاية أسبوع مطولة لطلاب ومنسوبي التعليم لتجديد النشاط.",
  },
  {
    id: "evt-10",
    title: "إجازة يوم التأسيس السعودي",
    hijriDate: "15 شعبان 1448هـ",
    gregorianDate: "2027-02-22",
    type: "national_day",
    semester: "2",
    daysCount: 1,
    description: "الاحتفاء بذكرى يوم تأسيس الدولة السعودية الأولى عام 1727م.",
    isImportant: true,
  },
  {
    id: "evt-11",
    title: "بداية إجازة عيد الفطر المبارك",
    hijriDate: "18 رمضان 1448هـ",
    gregorianDate: "2027-02-25",
    type: "vacation",
    semester: "2",
    daysCount: 17,
    description: "تبدأ بنهاية دوام يوم الخميس 18 رمضان للطلاب والكوادر المدرسية.",
    isImportant: true,
  },
  {
    id: "evt-12",
    title: "استئناف الدراسة بعد إجازة عيد الفطر",
    hijriDate: "6 شوال 1448هـ",
    gregorianDate: "2027-03-14",
    type: "semester_start",
    semester: "2",
    description: "عودة الطلاب ومنسوبي المجمع واستكمال مقررات الفصل الدراسي الثاني.",
  },
  {
    id: "evt-13",
    title: "بداية إجازة عيد الأضحى المبارك",
    hijriDate: "4 ذو الحجة 1448هـ",
    gregorianDate: "2027-05-10",
    type: "vacation",
    semester: "2",
    daysCount: 10,
    description: "إجازة موسم الحج وعيد الأضحى المبارك لجميع منسوبي التعليم.",
    isImportant: true,
  },
  {
    id: "evt-14",
    title: "استئناف الدراسة بعد عيد الأضحى والمراجعة النهائية",
    hijriDate: "14 ذو الحجة 1448هـ",
    gregorianDate: "2027-05-20",
    type: "semester_start",
    semester: "2",
    description: "استئناف الدوام والمراجعات الشاملة استعداداً لاختبارات نهاية العام الدراسي والدور الأول.",
  },
  {
    id: "evt-15",
    title: "بداية اختبارات نهاية الفصل الدراسي الثاني (الدور الأول)",
    hijriDate: "21 ذو الحجة 1448هـ",
    gregorianDate: "2027-05-27",
    type: "exam",
    semester: "2",
    description: "انطلاق الاختبارات النهائية التحريرية الشاملة لنهاية العام ورصد الدرجات وإخراج المجموع السنوي في نور.",
    isImportant: true,
  },
  {
    id: "evt-16",
    title: "اختبارات الدور الثاني وإعلان النتائج وحفل التخرج",
    hijriDate: "28 ذو الحجة 1448هـ",
    gregorianDate: "2027-06-03",
    type: "exam",
    semester: "2",
    description: "تنفيذ اختبارات الدور الثاني، استخراج الشهادات الرسمية وتخريج طلاب المراحل (الثانوي والمتوسط والابتدائي).",
    isImportant: true,
  },
  {
    id: "evt-17",
    title: "بداية إجازة نهاية العام الدراسي (الإجازة الصيفية)",
    hijriDate: "2 محرم 1449هـ",
    gregorianDate: "2027-06-10",
    type: "vacation",
    semester: "2",
    daysCount: 65,
    description: "اختتام العام الدراسي 1448هـ بنجاح وبدء العطلة الصيفية للطلاب والكوادر التعليمية والإدارية.",
    isImportant: true,
  },
];

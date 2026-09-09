export interface CalendarEvent {
  id: string;
  title: string;
  hijriDate: string;
  gregorianDate: string;
  type: 'semester_start' | 'vacation' | 'exam' | 'national_day' | 'training' | 'school_event';
  semester?: '1' | '2' | '3' | 'general';
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

export const DEFAULT_ACADEMIC_SEMESTERS: AcademicSemesterInfo[] = [
  {
    semesterNumber: 1,
    name: "الفصل الدراسي الأول",
    startDateHijri: "14 صفر 1448هـ",
    startDateGregorian: "2026-08-28",
    endDateHijri: "28 جمادى الآخرة 1448هـ",
    endDateGregorian: "2026-12-08",
    weeksCount: 13,
    vacationName: "إجازة نهاية الفصل الدراسي الأول",
    vacationDateHijri: "نهاية دوام الخميس 28 جمادى الآخرة 1448هـ",
    status: "current",
  },
  {
    semesterNumber: 2,
    name: "الفصل الدراسي الثاني",
    startDateHijri: "9 رجب 1448هـ",
    startDateGregorian: "2026-12-18",
    endDateHijri: "15 ذو القعدة 1448هـ",
    endDateGregorian: "2027-04-22",
    weeksCount: 13,
    vacationName: "إجازة نهاية الفصل الدراسي الثاني",
    vacationDateHijri: "نهاية دوام الخميس 15 ذو القعدة 1448هـ",
    status: "upcoming",
  },
  {
    semesterNumber: 3,
    name: "الفصل الدراسي الثالث",
    startDateHijri: "25 ذو القعدة 1448هـ",
    startDateGregorian: "2027-05-02",
    endDateHijri: "30 محرم 1449هـ",
    endDateGregorian: "2027-07-08",
    weeksCount: 12,
    vacationName: "إجازة نهاية العام الدراسي (الإجازة الصيفية)",
    vacationDateHijri: "نهاية دوام الخميس 30 محرم 1449هـ",
    status: "upcoming",
  },
];

export const OFFICIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "عودة الكوادر الإدارية والمعلمين للمدارس",
    hijriDate: "7 صفر 1448هـ",
    gregorianDate: "2026-08-21",
    type: "training",
    semester: "1",
    description: "بدء دوام منسوبي المدرسة والهيئة الإدارية والتعليمية واستكمال الجداول المدرسية.",
    isImportant: true,
  },
  {
    id: "evt-2",
    title: "بداية الدراسة للطلاب للفصل الدراسي الأول",
    hijriDate: "14 صفر 1448هـ",
    gregorianDate: "2026-08-28",
    type: "semester_start",
    semester: "1",
    description: "انطلاق العام الدراسي والترحيب بالطلاب واستلام المقررات المدرسية بمجمع الشريعة.",
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
    title: "إجازة نهاية أسبوع مطولة (الأولى)",
    hijriDate: "2-3 جمادى الأولى 1448هـ",
    gregorianDate: "2026-10-14",
    type: "vacation",
    semester: "1",
    daysCount: 4,
    description: "إجازة نهاية أسبوع مطولة للطلاب والكوادر التعليمية والإدارية.",
  },
  {
    id: "evt-5",
    title: "إجازة الخريف",
    hijriDate: "25 جمادى الأولى 1448هـ",
    gregorianDate: "2026-11-05",
    type: "vacation",
    semester: "1",
    daysCount: 10,
    description: "تبدأ بنهاية دوام يوم الخميس وتستمر لمدة 10 أيام.",
    isImportant: true,
  },
  {
    id: "evt-6",
    title: "بداية اختبارات نهاية الفصل الدراسي الأول",
    hijriDate: "17 جمادى الآخرة 1448هـ",
    gregorianDate: "2026-11-27",
    type: "exam",
    semester: "1",
    description: "انطلاق الاختبارات النهائية لجميع المراحل (الابتدائي، المتوسط، الثانوي) ورصد الدرجات في نظام نور.",
    isImportant: true,
  },
  {
    id: "evt-7",
    title: "إجازة نهاية الفصل الدراسي الأول",
    hijriDate: "28 جمادى الآخرة 1448هـ",
    gregorianDate: "2026-12-08",
    type: "vacation",
    semester: "1",
    daysCount: 10,
    description: "تبدأ بنهاية دوام يوم الخميس وتستمر حتى بداية الفصل الثاني.",
    isImportant: true,
  },
  {
    id: "evt-8",
    title: "بداية الدراسة للفصل الدراسي الثاني",
    hijriDate: "9 رجب 1448هـ",
    gregorianDate: "2026-12-18",
    type: "semester_start",
    semester: "2",
    description: "استئناف الحصص الدراسية والمقررات للفصل الثاني لجميع المراحل.",
    isImportant: true,
  },
  {
    id: "evt-9",
    title: "إجازة يوم التأسيس السعودي",
    hijriDate: "15 شعبان 1448هـ",
    gregorianDate: "2027-02-22",
    type: "national_day",
    semester: "2",
    daysCount: 1,
    description: "ذكرى يوم تأسيس الدولة السعودية الأولى عام 1727م.",
    isImportant: true,
  },
  {
    id: "evt-10",
    title: "إجازة نهاية أسبوع مطولة (الفصل الثاني)",
    hijriDate: "2-3 رمضان 1448هـ",
    gregorianDate: "2027-02-10",
    type: "vacation",
    semester: "2",
    daysCount: 4,
    description: "إجازة نهاية أسبوع مطولة لطلاب ومنسوبي التعليم.",
  },
  {
    id: "evt-11",
    title: "إجازة عيد الفطر المبارك",
    hijriDate: "18 رمضان 1448هـ",
    gregorianDate: "2027-02-25",
    type: "vacation",
    semester: "2",
    daysCount: 17,
    description: "تبدأ بنهاية دوام يوم الخميس وتستأنف الدراسة بعد إجازة العيد المبارك.",
    isImportant: true,
  },
  {
    id: "evt-12",
    title: "استئناف الدراسة بعد إجازة عيد الفطر",
    hijriDate: "6 شوال 1448هـ",
    gregorianDate: "2027-03-14",
    type: "semester_start",
    semester: "2",
    description: "عودة الطلاب ومنسوبي المجمع لاستكمال الفصل الدراسي الثاني.",
  },
  {
    id: "evt-13",
    title: "بداية اختبارات نهاية الفصل الدراسي الثاني",
    hijriDate: "4 ذو القعدة 1448هـ",
    gregorianDate: "2027-04-11",
    type: "exam",
    semester: "2",
    description: "بدء الاختبارات التحريرية للفصل الثاني ورصد المهارات والدرجات في نور.",
    isImportant: true,
  },
  {
    id: "evt-14",
    title: "إجازة نهاية الفصل الدراسي الثاني",
    hijriDate: "15 ذو القعدة 1448هـ",
    gregorianDate: "2027-04-22",
    type: "vacation",
    semester: "2",
    daysCount: 9,
    description: "نهاية الفصل الدراسي الثاني وإجازة قصيرة قبل الفصل الثالث.",
  },
  {
    id: "evt-15",
    title: "بداية الدراسة للفصل الدراسي الثالث",
    hijriDate: "25 ذو القعدة 1448هـ",
    gregorianDate: "2027-05-02",
    type: "semester_start",
    semester: "3",
    description: "انطلاق الفصل الثالث واستكمال الخطط التعليمية ومشاريع التخرج.",
    isImportant: true,
  },
  {
    id: "evt-16",
    title: "إجازة عيد الأضحى المبارك",
    hijriDate: "4 ذو الحجة 1448هـ",
    gregorianDate: "2027-05-10",
    type: "vacation",
    semester: "3",
    daysCount: 10,
    description: "إجازة موسم الحج وعيد الأضحى المبارك لجميع منسوبي التعليم.",
    isImportant: true,
  },
  {
    id: "evt-17",
    title: "استئناف الدراسة بعد عيد الأضحى",
    hijriDate: "14 ذو الحجة 1448هـ",
    gregorianDate: "2027-05-20",
    type: "semester_start",
    semester: "3",
    description: "استئناف الفصل الثالث والتهيئة لاختبارات نهاية العام.",
  },
  {
    id: "evt-18",
    title: "بداية اختبارات نهاية العام الدراسي 1448هـ",
    hijriDate: "19 محرم 1449هـ",
    gregorianDate: "2027-06-27",
    type: "exam",
    semester: "3",
    description: "الاختبارات النهائية وتحديد الأوائل وتخريج طلاب الثانوية والمتوسطة.",
    isImportant: true,
  },
  {
    id: "evt-19",
    title: "بداية إجازة نهاية العام الدراسي (الإجازة الصيفية)",
    hijriDate: "30 محرم 1449هـ",
    gregorianDate: "2027-07-08",
    type: "vacation",
    semester: "3",
    daysCount: 50,
    description: "نهاية العام الدراسي 1448هـ وبدء العطلة الصيفية للطلاب والكوادر التعليمية والإدارية.",
    isImportant: true,
  },
];

import { StaffMember, DispatchedDocument, SchoolSettings } from '../types';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: "مجمع الشريعة التعليمي للبنين",
  schoolCode: "432109",
  adminPhone: "0501234567", // جوال إدارة مجمع الشريعة المستلم للردود
  principalName: "الأستاذ حمود بن علي محمد نهاري",
  vicePrincipalName: "أ. صالح بن فهد الحربي",
  educationDepartment: "الإدارة العامة للتعليم بجازان",
  officeName: "",
  academicYear: "1446هـ",
};

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  // الإدارة المدرسية
  {
    id: "staff-1",
    nationalId: "1028471923",
    name: "حمود بن علي محمد نهاري",
    phone: "0501234567",
    role: "principal",
    roleTitle: "مدير المجمع التعليمي",
    stage: "all",
    subject: "إدارة مدرسية",
    notes: "مدير مجمع الشريعة - إشراف إدارة المجمع",
    active: true,
  },
  {
    id: "staff-2",
    nationalId: "1039485721",
    name: "صالح بن فهد الحربي",
    phone: "0559876543",
    role: "vice_principal",
    roleTitle: "وكيل شؤون المعلمين والموظفين",
    stage: "all",
    subject: "إدارة تربوية",
    notes: "مسؤول الحضور والانصراف والمساءلات",
    active: true,
  },
];

export const INITIAL_DISPATCHED_DOCUMENTS: DispatchedDocument[] = [
  {
    id: "doc-cir-101",
    type: "circular",
    title: "تعميم رقم 1446/101: بشأن الانضباط المدرسي والإشراف اليومي والمناوبة",
    referenceNumber: "1446/101",
    date: "2024-09-06",
    hijriDate: "24 صفر 1446هـ",
    createdAt: new Date().toISOString(),
    circularData: {
      circularNumber: "1446/101",
      title: "بشأن الانضباط المدرسي والإشراف اليومي والمناوبة الصباحية والانصراف",
      date: "2024-09-06",
      hijriDate: "24 صفر 1446هـ",
      priority: "urgent",
      targetAudience: "all",
      instructions: "نأمل من جميع الزملاء المعلمين والإداريين الاطلاع والتوقيع بالعلم والالتزام بجدول المناوبة المعتمد وعدم مغادرة المدرسة إلا بعد خروج آخر طالب.",
      content: `المكرمون منسوبي مجمع الشريعة التعليمي للبنين (معلمون وإداريون) حفظهم الله
السلام عليكم ورحمة الله وبركاته،،،
إشارة إلى تعليمات وزارة التعليم وتوجيهات سعادة المدير العام للتعليم بشأن تعزيز الانضباط المدرسي وحفظ سلامة الطلاب؛
نؤكد على النقاط الهامة التالية:
1. التواجد الصباحي في تمام الساعة 6:45 صباحاً والمشاركة الفاعلة في تنظيم الاصطفاف الصباحي والإذاعة.
2. الالتزام التام بجدول الإشراف اليومي والمناوبة في الفسحة وعند انصراف الطلاب حتى خروج آخر حافلة مدرسية.
3. رصد الحضور والغياب للطلاب في الحصة الأولى بدقة عبر منصة مدرستي ونظام نور، وإشعار الموجه الطلابي بأي حالة متكررة.
4. الالتزام بالحصص الدراسية كاملة وعدم مغادرة الفصول قبل قرع الجرس.

آمل من الجميع الاطلاع والتوقيع بالعلم عبر الرابط الإلكتروني وإعادة الإشعار لإدارة المجمع.
وفقكم الله وسدد خطاكم.`,
    },
    targetStaffIds: ["staff-2"],
    signatures: {
      "staff-2": {
        staffId: "staff-2",
        staffName: "صالح بن فهد الحربي",
        nationalId: "1039485721",
        phone: "0559876543",
        signedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        formattedDate: "1446/02/24 09:15 ص",
        signatureImage: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='70'><path d='M15,50 Q60,15 110,45 T170,20 Q190,55 195,35' fill='none' stroke='%231b4332' stroke-width='3'/></svg>",
        responseText: "تم العلم والاطلاع والتقيد بجدول المناوبة والإشراف.",
        status: "signed",
        receiptCode: "SHR-CIR-9944",
      }
    }
  }
];

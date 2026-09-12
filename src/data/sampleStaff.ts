import { StaffMember, DispatchedDocument, SchoolSettings } from '../types';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: "مجمع الشريعة التعليمي للبنين",
  schoolCode: "432109",
  adminPhone: "0509205097", // جوال إدارة مجمع الشريعة المستلم للردود (الواتس أب)
  principalName: "الأستاذ حمود بن علي محمد نهاري",
  vicePrincipalName: "أ. صالح بن فهد الحربي",
  educationDepartment: "الإدارة العامة للتعليم بجازان",
  officeName: "",
  academicYear: "1448هـ",
  adminPassword: "admin",
  adminUsername: "admin",
  principalSignatureUrl: "/principal_signature.svg",
};

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [];

export const INITIAL_DISPATCHED_DOCUMENTS: DispatchedDocument[] = [
  {
    id: "doc-cir-101",
    type: "circular",
    title: "تعميم رقم 1448/101: بشأن الانضباط المدرسي والإشراف اليومي والمناوبة",
    referenceNumber: "1448/101",
    date: "2026-09-08",
    hijriDate: "25 ربيع الأول 1448هـ",
    createdAt: new Date().toISOString(),
    circularData: {
      circularNumber: "1448/101",
      title: "بشأن الانضباط المدرسي والإشراف اليومي والمناوبة الصباحية والانصراف",
      date: "2026-09-08",
      hijriDate: "25 ربيع الأول 1448هـ",
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
        formattedDate: "1448/03/25 09:15 ص",
        signatureImage: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='70'><path d='M15,50 Q60,15 110,45 T170,20 Q190,55 195,35' fill='none' stroke='%231b4332' stroke-width='3'/></svg>",
        responseText: "تم العلم والاطلاع والتقيد بجدول المناوبة والإشراف.",
        status: "signed",
        receiptCode: "SHR-CIR-9944",
      }
    }
  }
];

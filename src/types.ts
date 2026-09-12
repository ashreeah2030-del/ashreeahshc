export type StaffRole = 
  | 'teacher' 
  | 'admin' 
  | 'counselor' 
  | 'vice_principal' 
  | 'student_affairs_vice_principal'
  | 'computer_lab_prep'
  | 'principal' 
  | 'activity_leader' 
  | 'lab_prep' 
  | 'student_affairs';

export type SchoolStage = 'elementary' | 'intermediate' | 'secondary' | 'all';

export interface StaffMember {
  id: string;
  nationalId: string; // 10-digit Saudi National ID
  name: string; // Full Arabic Name
  phone: string; // Saudi phone e.g. 05XXXXXXXX
  role: StaffRole;
  roleTitle: string; // e.g. "معلم لغة عربية", "وكيل المرحلة المتوسطة"
  stage: SchoolStage;
  subject?: string; // e.g. "رياضيات", "علوم", "دراسات إسلامية"
  notes?: string;
  pin?: string; // 4-digit secret PIN for login (defaults to last 4 digits of nationalId)
  points?: number; // Total motivation points earned
  active: boolean;
}

export type UserRole = 'admin' | 'staff';

export interface AuthSession {
  role: UserRole;
  staffId?: string;
  staffMember?: StaffMember;
  adminName?: string;
  loginAt: string;
}

export type DocumentType = 'circular' | 'inquiry';

export type InquiryReason = 
  | 'absence' 
  | 'lateness' 
  | 'grades_delay' 
  | 'duty_breach' 
  | 'leaving_early' 
  | 'other';

export interface CircularDetails {
  circularNumber: string;
  title: string;
  date: string;
  hijriDate: string;
  content: string;
  instructions?: string;
  priority: 'normal' | 'urgent' | 'top_urgent';
  targetAudience: 'all' | 'teachers' | 'admins' | 'elementary' | 'intermediate' | 'secondary' | 'custom';
}

export interface InquiryDetails {
  inquiryNumber: string;
  date: string;
  hijriDate: string;
  staffId: string;
  staffName: string;
  staffNationalId: string;
  staffPhone: string;
  reasonType: InquiryReason;
  reasonTitle: string;
  incidentDate: string;
  incidentTimeOrPeriods?: string; // e.g. "الحصة الأولى والثانية" أو "الساعة 7:15 صباحاً"
  details: string; // تفاصيل الواقعة
  requiredAction: string; // "تقديم الإفادة ومبررات الغياب/التأخر خلال 24 ساعة من تاريخه"
}

export interface StaffSignature {
  staffId: string;
  staffName: string;
  nationalId: string;
  phone: string;
  signedAt: string; // ISO string
  formattedDate: string;
  signatureImage: string; // Base64 Canvas PNG
  responseText?: string; // إفادة الموظف في المساءلة أو ملاحظاته
  status: 'signed' | 'pending';
  receiptCode: string; // Verification code e.g. "SHR-2026-XXXX"
}

export interface DispatchedDocument {
  id: string;
  type: DocumentType;
  title: string;
  referenceNumber: string;
  date: string;
  hijriDate: string;
  createdAt: string;
  circularData?: CircularDetails;
  inquiryData?: InquiryDetails;
  targetStaffIds: string[]; // List of staff IDs assigned to sign
  signatures: Record<string, StaffSignature>; // keyed by staffId
}

export interface SchoolSettings {
  schoolName: string;
  schoolCode: string;
  adminPhone: string; // WhatsApp number that receives the signed papers back (0509205097)
  principalName: string;
  vicePrincipalName: string;
  educationDepartment: string;
  officeName: string;
  academicYear: string;
  adminPassword?: string; // رمز الدخول السري لإدارة المنظومة (افتراضياً: admin)
  adminUsername?: string; // اسم مستخدم الإدارة (افتراضياً: admin)
  principalSignatureUrl?: string; // رابط أو بيانات توقيع المدير بدون خلفية
}

export interface CircularTemplate {
  id: string;
  name: string; // اسم القالب للتعريف مثل: "قالب الانضباط والدوام"
  title: string; // العنوان الافتراضي للتعميم
  content: string; // النص الكامل للتعميم
  category: 'انضباط ودوام' | 'اختبارات وكنترول' | 'إشراف ومناوبة' | 'شؤون تعليمية ونور' | 'أنشطة وفعاليات' | 'أمن وسلامة' | 'عام';
  defaultAudience: 'all' | 'teachers' | 'admins' | 'elementary' | 'intermediate' | 'secondary' | 'custom';
  priority: 'normal' | 'urgent' | 'top_urgent';
  instructions?: string;
  createdAt: string;
  updatedAt?: string;
  isSystemDefault?: boolean;
}

export type RecognitionCategory = 
  | 'morning_assembly'    // المشاركة في انضباط الطابور الصباحي (10 نقاط)
  | 'ideal_lesson'        // تأدية حصة مثالية ونموذجية (20 نقطة)
  | 'daily_supervision'   // المشاركة في الإشراف اليومي (15 نقطة)
  | 'duty_shift'          // المشاركة في المناوبة (20 نقطة)
  | 'school_discipline'   // تعزيز الانضباط المدرسي (15 نقطة)
  | 'student_activities'  // المشاركة في الأنشطة الطلابية والفعاليات (10 نقاط)
  | 'activity_sessions'   // تفعيل حصص النشاط (5 نقاط)
  | 'positive_behavior'   // مبادرة لتعزيز السلوك الإيجابي (20 نقطة)
  | 'mutual_visits'       // تنفيذ ومشاركة في الزيارات المتبادلة (20 نقطة)
  | 'supervision'         // للتوافق مع السجلات السابقة
  | 'custom';             // تكريم ومبادرة مخصصة

export interface RecognitionAward {
  id: string;
  staffId: string;
  staffName: string;
  staffNationalId: string;
  staffPhone: string;
  roleTitle: string;
  category: RecognitionCategory;
  categoryTitle: string; // e.g. "المشاركة في انضباط الطابور الصباحي"
  title: string; // e.g. "شهادة شكر وتقدير لانضباط الطابور الصباحي"
  details: string; // نص الثناء والشكر المكتوب في الشهادة
  points: number; // النقاط الممنوحة
  date: string;
  hijriDate: string;
  certificateNumber: string; // رقم الشهادة المعتمد
  awardedBy: string; // إدارة المدرسة / مدير المجمع
  notes?: string;
  createdAt: string;
}


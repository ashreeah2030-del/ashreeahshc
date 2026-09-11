import { StaffMember, DispatchedDocument, StaffSignature, SchoolSettings } from '../types';
import { maskNationalId } from './formatters';

/**
 * Clean and standardize Saudi mobile numbers to international format (966XXXXXXXXX)
 */
export function formatSaudiPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  
  if (cleaned.startsWith('+966')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00966')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('05')) {
    cleaned = '966' + cleaned.substring(1);
  } else if (cleaned.startsWith('5') && cleaned.length === 9) {
    cleaned = '966' + cleaned;
  }
  
  return cleaned;
}

/**
 * Format local display Saudi phone: 05X XXX XXXX
 */
export function formatDisplayPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Builds the URL link for the staff to open the document to view, respond, sign, and return.
 */
export function getDocumentSigningUrl(docId: string, staffId: string): string {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?docId=${encodeURIComponent(docId)}&staffId=${encodeURIComponent(staffId)}`;
}

/**
 * Generates the WhatsApp message and link from the School Administration to the Staff Member
 */
export function generateStaffDispatchWhatsApp(
  staff: StaffMember,
  document: DispatchedDocument,
  schoolSettings: SchoolSettings
): { url: string; text: string; cleanPhone: string } {
  const cleanPhone = formatSaudiPhone(staff.phone);
  const docUrl = getDocumentSigningUrl(document.id, staff.id);
  const isCircular = document.type === 'circular';

  let text = '';
  if (isCircular) {
    text = `السلام عليكم ورحمة الله وبركاته
المكرم الزميل/ ${staff.name} المحترم
(الهوية الوطنية: ${maskNationalId(staff.nationalId)})
${staff.roleTitle} - ${schoolSettings.schoolName}

نحيطكم علماً بصدور تعميم إداري رسمي:
📌 الموضوع: ${document.title}
🔢 رقم التعميم: ${document.referenceNumber}
📅 التاريخ: ${document.hijriDate}

نأمل من سعادتكم التكرم بالدخول على الرابط الإلكتروني أدناه للاطلاع على نص التعميم، وتدوين أي ملاحظات، والتوقيع بالعلم إلكترونياً، ثم إعادة إرساله لجوال إدارة المجمع عبر الواتس أب:

🔗 رابط التعميم والتوقيع بالعلم:
${docUrl}

شاكرين ومقدرين حسن تعاونكم وحرصكم الدائم.
إدارة مجمع الشريعة التعليمي للبنين`;
  } else {
    // Inquiry
    const inq = document.inquiryData;
    text = `السلام عليكم ورحمة الله وبركاته
المكرم الزميل/ ${staff.name} المحترم
(الهوية الوطنية: ${maskNationalId(staff.nationalId)})
${staff.roleTitle} - ${schoolSettings.schoolName}

نفيدكم بصدور (ورقة مساءلة إدارية):
📌 رقم المساءلة: ${document.referenceNumber}
📅 التاريخ: ${document.hijriDate}
⚠️ بشأن: ${inq?.reasonTitle || document.title}
⏱️ تاريخ الواقعة: ${inq?.incidentDate || document.date} ${inq?.incidentTimeOrPeriods ? `(${inq.incidentTimeOrPeriods})` : ''}

نأمل منكم الدخول على الرابط أدناه لكتابة الإفادة والمبررات، والتوقيع بالعلم إلكترونياً وإعادة الإرسال لجوال إدارة المدرسة عبر الواتس أب خلال المهلة المحددة:

🔗 رابط ورقة المساءلة وتدوين الإفادة:
${docUrl}

إدارة مجمع الشريعة التعليمي للبنين`;
  }

  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
  return { url, text, cleanPhone };
}

/**
 * Generates the WhatsApp message and link for the Staff Member to send back to the School Administration
 */
export function generateSchoolReturnWhatsApp(
  staff: StaffMember,
  document: DispatchedDocument,
  signature: StaffSignature,
  schoolSettings: SchoolSettings
): { url: string; text: string; cleanAdminPhone: string } {
  const cleanAdminPhone = formatSaudiPhone(schoolSettings.adminPhone);
  const docUrl = getDocumentSigningUrl(document.id, staff.id);
  const isCircular = document.type === 'circular';

  let text = '';
  if (isCircular) {
    text = `السلام عليكم ورحمة الله وبركاته
سعادة مدير ${schoolSettings.schoolName} المحترم
إدارة المجمع التعليمي

أفيدكم بأنه تم الاطلاع والتوقيع بالعلم إلكترونياً على التعميم الرسمي:
📌 عنوان التعميم: ${document.title}
🔢 رقم التعميم: ${document.referenceNumber}
👤 اسم الموظف الموقع: ${staff.name}
🆔 الهوية الوطنية: ${maskNationalId(staff.nationalId)}
💼 الوظيفة: ${staff.roleTitle}
⏰ وقت وتاريخ التوقيع: ${signature.formattedDate}
🔖 رمز توثيق التوقيع: ${signature.receiptCode}
${signature.responseText ? `📝 ملاحظات الموظف: "${signature.responseText}"\n` : ''}
🔗 رابط استعراض وثيقة التوقيع بالعلم المعتمدة:
${docUrl}

وتقبلوا خالص التحية والتقدير.`;
  } else {
    text = `السلام عليكم ورحمة الله وبركاته
سعادة مدير ${schoolSettings.schoolName} المحترم
إدارة المجمع التعليمي

بخصوص ورقة المساءلة رقم (${document.referenceNumber}) بشأن (${document.inquiryData?.reasonTitle || document.title}):
أفيدكم بأنه تم الاطلاع وتدوين الإفادة والتوقيع بالعلم إلكترونياً:
👤 اسم الموظف: ${staff.name}
🆔 الهوية الوطنية: ${maskNationalId(staff.nationalId)}
💼 الوظيفة: ${staff.roleTitle}
⏰ وقت التوقيع: ${signature.formattedDate}
🔖 رمز الاعتماد: ${signature.receiptCode}

📋 نص إفادة الموظف ومبرراته:
"${signature.responseText || 'تم التوقيع بالعلم دون إبداء مبررات إضافية'}"

🔗 رابط ورقة المساءلة والإفادة والتوقيع الإلكتروني:
${docUrl}

وجرى الإرسال لجوال إدارة المدرسة للإحاطة واتخاذ اللازم.`;
  }

  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${cleanAdminPhone}?text=${encoded}`;
  return { url, text, cleanAdminPhone };
}

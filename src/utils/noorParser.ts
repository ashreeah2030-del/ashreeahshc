import * as XLSX from 'xlsx';
import { StaffMember, SchoolStage, StaffRole } from '../types';

export interface ParsedNoorStaff {
  tempId: string;
  name: string;
  nationalId: string;
  phone: string;
  role: StaffRole;
  roleTitle: string;
  stage: SchoolStage;
  subject: string;
  notes: string;
  pin: string;
  isValid: boolean;
  validationErrors: string[];
  isExisting?: boolean;
}

export interface ParsedNoorResult {
  sourceType: 'excel' | 'csv' | 'text';
  totalFound: number;
  validCount: number;
  invalidCount: number;
  existingCount: number;
  staffList: ParsedNoorStaff[];
  headerRowDetected?: string[];
  warningMessage?: string;
}

/**
 * Convert Eastern Arabic numerals (٠-٩) to Western (0-9)
 */
export function normalizeArabicDigits(str: string = ''): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = String(str);
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  return result;
}

/**
 * Clean Saudi phone number into 05XXXXXXXX format
 */
export function cleanSaudiPhone(phoneStr: string = ''): string {
  let cleaned = normalizeArabicDigits(phoneStr).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('00966')) {
    cleaned = cleaned.slice(5);
  } else if (cleaned.startsWith('966')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.startsWith('5') && cleaned.length === 9) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

/**
 * Clean and extract National ID (10 digits)
 */
export function cleanNationalId(idStr: string = ''): string {
  const cleaned = normalizeArabicDigits(idStr).replace(/[^0-9]/g, '');
  if (cleaned.length === 10) return cleaned;
  // If string contains a 10-digit number inside
  const match = cleaned.match(/[12]\d{9}/);
  if (match) return match[0];
  return cleaned;
}

/**
 * Detect StaffRole and formal title from Noor job titles
 */
export function detectStaffRole(roleStr: string = ''): { role: StaffRole; roleTitle: string } {
  const text = roleStr.trim();
  const lower = text.toLowerCase();

  if (lower.includes('مدير') || lower.includes('قائد')) {
    return { role: 'principal', roleTitle: text || 'مدير مدرسة' };
  }
  if (lower.includes('وكيل') && (lower.includes('طلاب') || lower.includes('طلبة') || lower.includes('شؤون طلاب'))) {
    return { role: 'student_affairs_vice_principal', roleTitle: text || 'وكيل شؤون الطلاب' };
  }
  if (lower.includes('وكيل')) {
    return { role: 'vice_principal', roleTitle: text || 'وكيل مدرسة' };
  }
  if (
    lower.includes('محضر حاسب') || 
    lower.includes('محضر الحاسب') || 
    (lower.includes('حاسب') && (lower.includes('محضر') || lower.includes('معمل') || lower.includes('مختبر')))
  ) {
    return { role: 'computer_lab_prep', roleTitle: text || 'محضر الحاسب الآلي' };
  }
  if (lower.includes('مرشد') || lower.includes('موجه طلابي') || lower.includes('توجيه')) {
    return { role: 'counselor', roleTitle: text || 'موجه طلابي' };
  }
  if (lower.includes('نشاط') || lower.includes('رائد نشاط')) {
    return { role: 'activity_leader', roleTitle: text || 'رائد نشاط' };
  }
  if (lower.includes('مختبر') || lower.includes('محضر')) {
    return { role: 'lab_prep', roleTitle: text || 'محضر مختبر' };
  }
  if (lower.includes('شؤون طلاب') || lower.includes('مراقب')) {
    return { role: 'student_affairs', roleTitle: text || 'مراقب شؤون طلاب' };
  }
  if (
    lower.includes('إداري') || 
    lower.includes('اداري') || 
    lower.includes('سكرتير') || 
    lower.includes('كاتب') || 
    lower.includes('مسجل') ||
    lower.includes('مساعد إداري')
  ) {
    return { role: 'admin', roleTitle: text || 'إداري' };
  }

  // Default is teacher
  return { role: 'teacher', roleTitle: text || 'معلم' };
}

/**
 * Detect School Stage
 */
export function detectSchoolStage(text: string = ''): SchoolStage {
  const t = text.trim();
  if (t.includes('ابتدائ')) return 'elementary';
  if (t.includes('متوسط')) return 'intermediate';
  if (t.includes('ثانوي')) return 'secondary';
  return 'all';
}

/**
 * Helper to identify which column corresponds to which field in Noor exports
 */
interface ColumnIndices {
  nameCol: number;
  nationalIdCol: number;
  phoneCol: number;
  roleCol: number;
  stageCol: number;
  subjectCol: number;
  notesCol: number;
}

function detectColumns(headers: string[]): ColumnIndices {
  const indices: ColumnIndices = {
    nameCol: -1,
    nationalIdCol: -1,
    phoneCol: -1,
    roleCol: -1,
    stageCol: -1,
    subjectCol: -1,
    notesCol: -1,
  };

  headers.forEach((h, idx) => {
    const header = String(h || '').trim();
    if (!header) return;

    // National ID check
    if (
      indices.nationalIdCol === -1 &&
      (header.includes('سجل') || 
       header.includes('هوية') || 
       header.includes('الهوية') || 
       header.includes('المدني') || 
       header.includes('رقم المستخدم') ||
       header.includes('اسم المستخدم') ||
       header.includes('الأحوال') ||
       header.toLowerCase().includes('national') ||
       header.toLowerCase().includes('iqama') ||
       header.toLowerCase().includes('identity'))
    ) {
      indices.nationalIdCol = idx;
    }
    // Name check
    else if (
      indices.nameCol === -1 &&
      (header.includes('الاسم') || 
       header.includes('اسم المعلم') || 
       header.includes('اسم الموظف') || 
       header.includes('شاغل الوظيفة') || 
       header.includes('اسم شاغل') ||
       header.toLowerCase().includes('name'))
    ) {
      indices.nameCol = idx;
    }
    // Phone check
    else if (
      indices.phoneCol === -1 &&
      (header.includes('جوال') || 
       header.includes('الجوال') || 
       header.includes('هاتف') || 
       header.includes('الهاتف') || 
       header.includes('محمول') || 
       header.includes('الاتصال') ||
       header.toLowerCase().includes('phone') || 
       header.toLowerCase().includes('mobile'))
    ) {
      indices.phoneCol = idx;
    }
    // Role/Job check
    else if (
      indices.roleCol === -1 &&
      (header.includes('وظيفة') || 
       header.includes('الوظيفة') || 
       header.includes('العمل الحالي') || 
       header.includes('الصفة') || 
       header.includes('المسمى') || 
       header.includes('الرتبة') || 
       header.includes('المرتبة') || 
       header.toLowerCase().includes('role') || 
       header.toLowerCase().includes('job'))
    ) {
      indices.roleCol = idx;
    }
    // Stage check
    else if (
      indices.stageCol === -1 &&
      (header.includes('مرحلة') || 
       header.includes('المرحلة') || 
       header.includes('المدرسة') ||
       header.toLowerCase().includes('stage'))
    ) {
      indices.stageCol = idx;
    }
    // Subject/Specialization check
    else if (
      indices.subjectCol === -1 &&
      (header.includes('مادة') || 
       header.includes('المادة') || 
       header.includes('تخصص') || 
       header.includes('التخصص') || 
       header.toLowerCase().includes('subject'))
    ) {
      indices.subjectCol = idx;
    }
    // Notes check
    else if (
      indices.notesCol === -1 &&
      (header.includes('ملاحظ') || header.includes('البيان') || header.toLowerCase().includes('note'))
    ) {
      indices.notesCol = idx;
    }
  });

  return indices;
}

/**
 * Scan matrix of rows (from Excel or TSV) to find where header row begins and extract staff
 */
export function parseNoorMatrix(
  matrix: any[][], 
  existingStaff: StaffMember[] = [], 
  sourceType: 'excel' | 'csv' | 'text' = 'excel'
): ParsedNoorResult {
  if (!matrix || matrix.length === 0) {
    return {
      sourceType,
      totalFound: 0,
      validCount: 0,
      invalidCount: 0,
      existingCount: 0,
      staffList: [],
      warningMessage: 'الملف أو النص فارغ.',
    };
  }

  // Find header row
  let headerRowIndex = -1;
  let detectedCols: ColumnIndices = {
    nameCol: -1,
    nationalIdCol: -1,
    phoneCol: -1,
    roleCol: -1,
    stageCol: -1,
    subjectCol: -1,
    notesCol: -1,
  };

  for (let r = 0; r < Math.min(matrix.length, 12); r++) {
    const row = matrix[r].map(c => String(c ?? '').trim());
    const cols = detectColumns(row);
    // If found either Name and National ID, or at least two key columns
    if ((cols.nameCol !== -1 && cols.nationalIdCol !== -1) || 
        (cols.nameCol !== -1 && cols.phoneCol !== -1) ||
        (cols.nationalIdCol !== -1 && cols.phoneCol !== -1)) {
      headerRowIndex = r;
      detectedCols = cols;
      break;
    }
  }

  // If no clear header found, fall back to positional defaults
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    detectedCols = {
      nameCol: 0,
      nationalIdCol: 1,
      phoneCol: 2,
      roleCol: 3,
      stageCol: 4,
      subjectCol: 5,
      notesCol: 6,
    };
  }

  const existingIdsMap = new Set(existingStaff.map(s => s.nationalId));
  const parsedStaff: ParsedNoorStaff[] = [];

  // Iterate rows starting after headerRowIndex
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.length === 0) continue;

    // Extract raw string values
    const rawName = String(row[detectedCols.nameCol] ?? '').trim();
    const rawId = String(row[detectedCols.nationalIdCol] ?? '').trim();
    const rawPhone = detectedCols.phoneCol !== -1 ? String(row[detectedCols.phoneCol] ?? '').trim() : '';
    const rawRole = detectedCols.roleCol !== -1 ? String(row[detectedCols.roleCol] ?? '').trim() : '';
    const rawStage = detectedCols.stageCol !== -1 ? String(row[detectedCols.stageCol] ?? '').trim() : '';
    const rawSubject = detectedCols.subjectCol !== -1 ? String(row[detectedCols.subjectCol] ?? '').trim() : '';
    const rawNotes = detectedCols.notesCol !== -1 ? String(row[detectedCols.notesCol] ?? '').trim() : '';

    // Ignore totally blank rows or summary rows like "المجموع"
    if (!rawName && !rawId && !rawPhone) continue;
    if (rawName.includes('مجموع') || rawName.includes('العدد الكلي') || rawName.includes('الإدارة العامة')) continue;

    const nationalId = cleanNationalId(rawId);
    const phone = cleanSaudiPhone(rawPhone);
    const { role, roleTitle } = detectStaffRole(rawRole);
    const stage = detectSchoolStage(rawStage);

    const validationErrors: string[] = [];
    if (!rawName || rawName.length < 3) {
      validationErrors.push('الاسم غير مكتمل أو مفقود');
    }
    if (!nationalId || nationalId.length !== 10) {
      validationErrors.push('رقم السجل المدني يجب أن يتكون من 10 أرقام');
    }
    if (!phone || phone.length < 9) {
      validationErrors.push('رقم الجوال بحاجة لإدخال (05xxxxxxxx)');
    }

    // A record is valid for import if name and 10-digit national ID are present
    const isValid = Boolean(rawName && rawName.length >= 3 && nationalId && nationalId.length === 10);
    const isExisting = Boolean(nationalId && existingIdsMap.has(nationalId));

    parsedStaff.push({
      tempId: `import-${r}-${Date.now()}`,
      name: rawName || 'موظف بدون اسم',
      nationalId: nationalId || rawId,
      phone: phone.startsWith('05') ? phone : (phone ? `0${phone}` : ''),
      role,
      roleTitle,
      stage,
      subject: rawSubject,
      notes: rawNotes,
      pin: nationalId ? nationalId.slice(-4) : '1234',
      isValid,
      validationErrors,
      isExisting,
    });
  }

  const validCount = parsedStaff.filter(s => s.isValid).length;
  const existingCount = parsedStaff.filter(s => s.isExisting).length;

  return {
    sourceType,
    totalFound: parsedStaff.length,
    validCount,
    invalidCount: parsedStaff.length - validCount,
    existingCount,
    staffList: parsedStaff,
    headerRowDetected: matrix[headerRowIndex]?.map(c => String(c ?? '')),
  };
}

/**
 * Parse Excel (.xlsx, .xls) file using SheetJS
 */
export async function parseNoorExcelFile(file: File, existingStaff: StaffMember[] = []): Promise<ParsedNoorResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Use the first sheet or find one with "معلمين" or "موظفين"
        let targetSheetName = workbook.SheetNames[0];
        for (const name of workbook.SheetNames) {
          if (name.includes('معلم') || name.includes('موظف') || name.includes('شاغلي')) {
            targetSheetName = name;
            break;
          }
        }

        const sheet = workbook.Sheets[targetSheetName];
        if (!sheet) {
          resolve({
            sourceType: 'excel',
            totalFound: 0,
            validCount: 0,
            invalidCount: 0,
            existingCount: 0,
            staffList: [],
            warningMessage: 'لم يتم العثور على أوراق عمل صالحة في ملف الإكسل.',
          });
          return;
        }

        // Convert sheet to 2D array of rows
        const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const result = parseNoorMatrix(matrix, existingStaff, 'excel');
        resolve(result);
      } catch (err: any) {
        reject(new Error(`فشل في قراءة ملف الإكسل: ${err?.message || 'خطأ غير معروف'}`));
      }
    };

    reader.onerror = () => reject(new Error('حدث خطأ أثناء قراءة الملف من الجهاز.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse Raw Copied Text (Tab-separated from web browser or CSV)
 */
export function parseNoorText(rawText: string, existingStaff: StaffMember[] = []): ParsedNoorResult {
  if (!rawText || !rawText.trim()) {
    return {
      sourceType: 'text',
      totalFound: 0,
      validCount: 0,
      invalidCount: 0,
      existingCount: 0,
      staffList: [],
      warningMessage: 'النص المدخل فارغ.',
    };
  }

  const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
  const matrix: string[][] = lines.map(line => {
    // Check if line is Tab-separated (most common when copying from browser table)
    if (line.includes('\t')) {
      return line.split('\t').map(c => c.trim());
    }
    // Check if semicolon separated
    if (line.includes(';')) {
      return line.split(';').map(c => c.trim());
    }
    // Check if pipe separated
    if (line.includes('|')) {
      return line.split('|').map(c => c.trim());
    }
    // Comma separated (handling possible quotes)
    return line.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
  });

  return parseNoorMatrix(matrix, existingStaff, 'text');
}

/**
 * Generate a Noor-compatible Excel template and trigger browser download
 */
export function downloadNoorExcelTemplate(): void {
  const headers = [
    'الاسم الكامل',
    'رقم السجل المدني',
    'رقم الجوال',
    'المسمى الوظيفي',
    'المرحلة التعليمية',
    'التخصص / المادة',
    'ملاحظات'
  ];

  const sampleRows = [
    ['(مثال توضيحي) اسم المعلم الرباعي', '1012345678', '0501234567', 'معلم', 'ثانوي', 'رياضيات', 'مجمع الشريعة التعليمي'],
    ['(مثال توضيحي) اسم الإداري أو الوكيل', '1023456789', '0551234567', 'وكيل شؤون المعلمين', 'مشترك', 'إدارة مدرسية', ''],
    ['(مثال توضيحي) اسم الموجه الطلابي', '1034567890', '0541234567', 'موجه طلابي', 'متوسط', 'توجيه طلابي', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 28 }, // Name
    { wch: 18 }, // National ID
    { wch: 16 }, // Phone
    { wch: 22 }, // Role
    { wch: 16 }, // Stage
    { wch: 18 }, // Subject
    { wch: 20 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'منسوبي المدرسة - نظام نور');

  XLSX.writeFile(wb, 'نموذج_استيراد_منسوبي_المدرسة_نظام_نور.xlsx');
}

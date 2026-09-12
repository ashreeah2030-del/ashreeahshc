import { StaffMember, DispatchedDocument, SchoolSettings, StaffSignature, AuthSession, CircularTemplate, RecognitionAward } from '../types';
import { INITIAL_STAFF_MEMBERS, INITIAL_DISPATCHED_DOCUMENTS, DEFAULT_SCHOOL_SETTINGS } from '../data/sampleStaff';
import { INITIAL_CIRCULAR_TEMPLATES } from '../data/sampleTemplates';
import { syncService } from './syncService';

const STORAGE_KEYS = {
  STAFF: 'shariah_platform_staff_v5',
  DOCUMENTS: 'shariah_platform_documents_v1',
  SETTINGS: 'shariah_platform_settings_v1',
  AUTH: 'shariah_platform_auth_session_v1',
  TEMPLATES: 'shariah_platform_templates_v1',
  RECOGNITION: 'shariah_platform_recognition_v1',
};

export function loadStaffMembers(): StaffMember[] {
  try {
    // Purge any old mock/dummy staff storage keys so unrelated staff are completely deleted
    ['shariah_platform_staff_v1', 'shariah_platform_staff_v2', 'shariah_platform_staff_v3', 'shariah_platform_staff_v4'].forEach(key => {
      try { localStorage.removeItem(key); } catch {}
    });

    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((m: StaffMember) => ({
          ...m,
          pin: m.pin || m.nationalId?.slice(-4) || '1234',
          points: typeof m.points === 'number' ? m.points : 0
        }));
      }
    }
  } catch (e) {
    console.error('Error loading staff from localStorage:', e);
  }
  // If no staff has been imported yet by the user, return an empty list as requested
  return [];
}

export function saveStaffMembers(staff: StaffMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
    syncService.pushStaffList(staff);
  } catch (e) {
    console.error('Error saving staff to localStorage:', e);
  }
}

export function clearAllStaffMembers(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([]));
  } catch (e) {
    console.error('Error clearing staff in localStorage:', e);
  }
}

export function updateStaffPin(staffId: string, newPin: string): StaffMember[] {
  const staff = loadStaffMembers();
  const updated = staff.map(s => s.id === staffId ? { ...s, pin: newPin } : s);
  saveStaffMembers(updated);
  return updated;
}

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.role === 'admin' || parsed.role === 'staff')) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading auth session:', e);
  }
  return null;
}

export function saveAuthSession(session: AuthSession | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  } catch (e) {
    console.error('Error saving auth session:', e);
  }
}

export function loadDocuments(): DispatchedDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let docsChanged = false;
        const cleaned = parsed
          .filter((doc: DispatchedDocument) => {
            // Remove sample inquiry doc if it was specifically targeting deleted staff-17
            if (doc.type === 'inquiry' && doc.inquiryData?.staffId && doc.inquiryData.staffId !== 'staff-1' && doc.inquiryData.staffId !== 'staff-2') {
              const num = parseInt(String(doc.inquiryData.staffId).replace('staff-', ''), 10);
              if (!isNaN(num) && num >= 3 && num <= 20) {
                docsChanged = true;
                return false;
              }
            }
            return true;
          })
          .map((doc: DispatchedDocument) => {
            let docCopy = { ...doc };
            if (typeof docCopy.hijriDate === 'string' && docCopy.hijriDate.includes('1446')) {
              docCopy.hijriDate = docCopy.hijriDate.replace(/1446/g, '1448');
              docsChanged = true;
            }
            if (typeof docCopy.referenceNumber === 'string' && docCopy.referenceNumber.includes('1446/')) {
              docCopy.referenceNumber = docCopy.referenceNumber.replace(/1446\//g, '1448/');
              docsChanged = true;
            }
            if (typeof docCopy.title === 'string' && docCopy.title.includes('1446/')) {
              docCopy.title = docCopy.title.replace(/1446\//g, '1448/');
              docsChanged = true;
            }
            if (docCopy.circularData) {
              let circChanged = false;
              let updatedCirc = { ...docCopy.circularData };
              if (typeof updatedCirc.hijriDate === 'string' && updatedCirc.hijriDate.includes('1446')) {
                updatedCirc.hijriDate = updatedCirc.hijriDate.replace(/1446/g, '1448');
                circChanged = true;
              }
              if (typeof updatedCirc.circularNumber === 'string' && updatedCirc.circularNumber.includes('1446/')) {
                updatedCirc.circularNumber = updatedCirc.circularNumber.replace(/1446\//g, '1448/');
                circChanged = true;
              }
              if (circChanged) {
                docCopy.circularData = updatedCirc;
                docsChanged = true;
              }
            }
            if (docCopy.inquiryData) {
              let inqChanged = false;
              let updatedInq = { ...docCopy.inquiryData };
              if (typeof updatedInq.hijriDate === 'string' && updatedInq.hijriDate.includes('1446')) {
                updatedInq.hijriDate = updatedInq.hijriDate.replace(/1446/g, '1448');
                inqChanged = true;
              }
              if (typeof updatedInq.inquiryNumber === 'string' && updatedInq.inquiryNumber.includes('1446/')) {
                updatedInq.inquiryNumber = updatedInq.inquiryNumber.replace(/1446\//g, '1448/');
                inqChanged = true;
              }
              if (typeof updatedInq.details === 'string' && updatedInq.details.includes('1446')) {
                updatedInq.details = updatedInq.details.replace(/1446/g, '1448');
                inqChanged = true;
              }
              if (inqChanged) {
                docCopy.inquiryData = updatedInq;
                docsChanged = true;
              }
            }
            // Filter targetStaffIds to remove old deleted dummy staff
            if (Array.isArray(docCopy.targetStaffIds) && docCopy.targetStaffIds.some(id => {
              const num = parseInt(String(id || '').replace('staff-', ''), 10);
              return !isNaN(num) && num >= 3 && num <= 20;
            })) {
              docCopy.targetStaffIds = docCopy.targetStaffIds.filter(id => {
                const num = parseInt(String(id || '').replace('staff-', ''), 10);
                return isNaN(num) || num < 3 || num > 20;
              });
              if (docCopy.targetStaffIds.length === 0 && docCopy.type === 'circular') {
                docCopy.targetStaffIds = ['staff-2'];
              }
              docsChanged = true;
            }
            // Filter signatures to remove signatures from deleted dummy staff
            if (docCopy.signatures && typeof docCopy.signatures === 'object') {
              const cleanedSigs: Record<string, StaffSignature> = {};
              let sigsChanged = false;
              Object.entries(docCopy.signatures).forEach(([key, sig]) => {
                const num = parseInt(String(key || '').replace('staff-', ''), 10);
                if (!isNaN(num) && num >= 3 && num <= 20) {
                  sigsChanged = true;
                } else {
                  let updatedSig = { ...sig };
                  if (typeof updatedSig.formattedDate === 'string' && updatedSig.formattedDate.includes('1446/')) {
                    updatedSig.formattedDate = updatedSig.formattedDate.replace(/1446\//g, '1448/');
                    sigsChanged = true;
                  }
                  cleanedSigs[key] = updatedSig;
                }
              });
              if (sigsChanged) {
                if (docCopy.id === 'doc-cir-101' && !cleanedSigs['staff-2']) {
                  cleanedSigs['staff-2'] = {
                    staffId: 'staff-2',
                    staffName: 'صالح بن فهد الحربي',
                    nationalId: '1039485721',
                    phone: '0559876543',
                    signedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                    formattedDate: '1448/03/25 09:15 ص',
                    signatureImage: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='70'><path d='M15,50 Q60,15 110,45 T170,20 Q190,55 195,35' fill='none' stroke='%231b4332' stroke-width='3'/></svg>",
                    responseText: 'تم العلم والاطلاع والتقيد بجدول المناوبة والإشراف.',
                    status: 'signed',
                    receiptCode: 'SHR-CIR-9944',
                  };
                }
                docCopy.signatures = cleanedSigs;
                docsChanged = true;
              }
            }
            return docCopy;
          });
        if (docsChanged) {
          saveDocuments(cleaned);
          return cleaned;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading documents from localStorage:', e);
  }
  return INITIAL_DISPATCHED_DOCUMENTS;
}

export function saveDocuments(docs: DispatchedDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    syncService.pushFullSync({ documents: docs });
  } catch (e) {
    console.error('Error saving documents to localStorage:', e);
  }
}

export function loadSchoolSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      let changed = false;
      // Auto-migrate previous default values if they had Mecca or Jumum
      if (
        !parsed.educationDepartment || 
        parsed.educationDepartment.includes('مكة') || 
        (parsed.officeName && parsed.officeName.includes('الجموم'))
      ) {
        parsed.educationDepartment = DEFAULT_SCHOOL_SETTINGS.educationDepartment;
        parsed.officeName = '';
        changed = true;
      }
      // Auto-migrate old principal name if it matches old placeholder
      if (!parsed.principalName || parsed.principalName.includes('الشريفي')) {
        parsed.principalName = DEFAULT_SCHOOL_SETTINGS.principalName;
        changed = true;
      }
      // Auto-migrate academicYear to current official year (1448هـ)
      if (
        !parsed.academicYear || 
        parsed.academicYear === '1446هـ' ||
        parsed.academicYear === '1446-1447هـ' || 
        parsed.academicYear === '1446 - 1447هـ' || 
        parsed.academicYear.includes('1446') || 
        parsed.academicYear.includes('1445') || 
        parsed.academicYear.includes('1444')
      ) {
        parsed.academicYear = DEFAULT_SCHOOL_SETTINGS.academicYear; // "1448هـ"
        changed = true;
      }
      // Auto-migrate admin WhatsApp phone to official school mobile 0509205097
      if (!parsed.adminPhone || parsed.adminPhone === '0501234567') {
        parsed.adminPhone = '0509205097';
        changed = true;
      }
      // Ensure principalSignatureUrl is set to official transparent signature
      if (!parsed.principalSignatureUrl) {
        parsed.principalSignatureUrl = DEFAULT_SCHOOL_SETTINGS.principalSignatureUrl;
        changed = true;
      }
      if (changed) {
        saveSchoolSettings(parsed);
      }
      return { ...DEFAULT_SCHOOL_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading settings from localStorage:', e);
  }
  return DEFAULT_SCHOOL_SETTINGS;
}

export function saveSchoolSettings(settings: SchoolSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    syncService.pushFullSync({ schoolSettings: settings });
  } catch (e) {
    console.error('Error saving settings to localStorage:', e);
  }
}

export function saveStaffSignature(docId: string, signature: StaffSignature): DispatchedDocument[] {
  const docs = loadDocuments();
  const updatedDocs = docs.map(doc => {
    if (doc.id === docId) {
      return {
        ...doc,
        signatures: {
          ...doc.signatures,
          [signature.staffId]: signature
        }
      };
    }
    return doc;
  });
  saveDocuments(updatedDocs);
  syncService.pushSignature(docId, signature);
  return updatedDocs;
}

export function resetToDefaults(): void {
  localStorage.removeItem(STORAGE_KEYS.STAFF);
  localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
  localStorage.removeItem(STORAGE_KEYS.RECOGNITION);
}

export function loadCircularTemplates(): CircularTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading circular templates from localStorage:', e);
  }
  // If not found or empty, seed with initial templates
  saveCircularTemplates(INITIAL_CIRCULAR_TEMPLATES);
  return INITIAL_CIRCULAR_TEMPLATES;
}

export function saveCircularTemplates(templates: CircularTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Error saving circular templates to localStorage:', e);
  }
}

export function addCircularTemplate(templateData: Omit<CircularTemplate, 'id' | 'createdAt'>): CircularTemplate {
  const templates = loadCircularTemplates();
  const newTemplate: CircularTemplate = {
    ...templateData,
    id: `tpl-user-${Date.now()}`,
    createdAt: new Date().toISOString(),
    isSystemDefault: false,
  };
  const updated = [newTemplate, ...templates];
  saveCircularTemplates(updated);
  return newTemplate;
}

export function updateCircularTemplate(id: string, updates: Partial<CircularTemplate>): CircularTemplate[] {
  const templates = loadCircularTemplates();
  const updated = templates.map(t => {
    if (t.id === id) {
      return {
        ...t,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    return t;
  });
  saveCircularTemplates(updated);
  return updated;
}

export function deleteCircularTemplate(id: string): CircularTemplate[] {
  const templates = loadCircularTemplates();
  const updated = templates.filter(t => t.id !== id);
  saveCircularTemplates(updated);
  return updated;
}

// -------------------------------------------------------------
// Recognition and Motivation Storage Functions (تكريم وتحفيز)
// -------------------------------------------------------------

export function loadRecognitionAwards(): RecognitionAward[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECOGNITION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading recognition awards from localStorage:', e);
  }
  return [];
}

export function saveRecognitionAwards(awards: RecognitionAward[], staffList?: StaffMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECOGNITION, JSON.stringify(awards));
    syncService.pushAwards(awards, staffList);
  } catch (e) {
    console.error('Error saving recognition awards to localStorage:', e);
  }
}

export function addRecognitionAward(
  awardData: Omit<RecognitionAward, 'id' | 'createdAt' | 'certificateNumber'>,
  currentStaffList?: StaffMember[]
): { newAward: RecognitionAward; updatedAwards: RecognitionAward[]; updatedStaff: StaffMember[] } {
  const awards = loadRecognitionAwards();
  const staffList = currentStaffList && currentStaffList.length > 0 ? currentStaffList : loadStaffMembers();
  
  const serial = awards.length + 1;
  const certificateNumber = `TAK-1448-${String(serial).padStart(4, '0')}`;
  
  const newAward: RecognitionAward = {
    ...awardData,
    id: `award-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    certificateNumber,
    createdAt: new Date().toISOString(),
  };

  const updatedAwards = [newAward, ...awards];

  // Increment staff member's total points
  const updatedStaff = staffList.map(s => {
    if (s.id === awardData.staffId || (s.nationalId && awardData.staffNationalId && s.nationalId === awardData.staffNationalId)) {
      const currentPts = typeof s.points === 'number' ? s.points : 0;
      return {
        ...s,
        points: currentPts + (awardData.points || 0),
      };
    }
    return s;
  });

  saveRecognitionAwards(updatedAwards, updatedStaff);
  saveStaffMembers(updatedStaff);

  return { newAward, updatedAwards, updatedStaff };
}

export function addBulkRecognitionAwards(
  awardsDataList: Omit<RecognitionAward, 'id' | 'createdAt' | 'certificateNumber'>[],
  currentStaffList?: StaffMember[]
): { newAwards: RecognitionAward[]; updatedAwards: RecognitionAward[]; updatedStaff: StaffMember[] } {
  const awards = loadRecognitionAwards();
  const staffList = currentStaffList && currentStaffList.length > 0 ? currentStaffList : loadStaffMembers();

  let serial = awards.length;
  const newAwards: RecognitionAward[] = awardsDataList.map((data, idx) => {
    serial += 1;
    return {
      ...data,
      id: `award-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      certificateNumber: `TAK-1448-${String(serial).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
    };
  });

  const updatedAwards = [...newAwards, ...awards];

  // Accumulate points map
  const pointsMap = new Map<string, number>();
  for (const aw of awardsDataList) {
    const key = aw.staffId || aw.staffNationalId || '';
    const current = pointsMap.get(key) || 0;
    pointsMap.set(key, current + (aw.points || 0));
  }

  const updatedStaff = staffList.map(s => {
    const keyById = s.id ? pointsMap.get(s.id) : 0;
    const keyByNat = s.nationalId ? pointsMap.get(s.nationalId) : 0;
    const addedPoints = (keyById || 0) + (keyByNat || 0);

    if (addedPoints > 0) {
      const currentPts = typeof s.points === 'number' ? s.points : 0;
      return {
        ...s,
        points: currentPts + addedPoints,
      };
    }
    return s;
  });

  saveRecognitionAwards(updatedAwards, updatedStaff);
  saveStaffMembers(updatedStaff);

  return { newAwards, updatedAwards, updatedStaff };
}

export function deleteRecognitionAward(
  awardId: string,
  currentStaffList?: StaffMember[]
): { updatedAwards: RecognitionAward[]; updatedStaff: StaffMember[] } {
  const awards = loadRecognitionAwards();
  const staffList = currentStaffList && currentStaffList.length > 0 ? currentStaffList : loadStaffMembers();
  
  const target = awards.find(a => a.id === awardId);
  const updatedAwards = awards.filter(a => a.id !== awardId);

  let updatedStaff = staffList;
  if (target) {
    updatedStaff = staffList.map(s => {
      if (s.id === target.staffId || (s.nationalId && target.staffNationalId && s.nationalId === target.staffNationalId)) {
        const currentPts = typeof s.points === 'number' ? s.points : 0;
        return {
          ...s,
          points: Math.max(0, currentPts - (target.points || 0)),
        };
      }
      return s;
    });
    saveStaffMembers(updatedStaff);
  }

  saveRecognitionAwards(updatedAwards, updatedStaff);

  return { updatedAwards, updatedStaff };
}

export function updateRecognitionAward(
  updatedAward: RecognitionAward,
  currentStaffList?: StaffMember[]
): { updatedAwards: RecognitionAward[]; updatedStaff: StaffMember[] } {
  const awards = loadRecognitionAwards();
  const staffList = currentStaffList && currentStaffList.length > 0 ? currentStaffList : loadStaffMembers();
  
  const oldAward = awards.find(a => a.id === updatedAward.id);
  const updatedAwards = awards.map(a => a.id === updatedAward.id ? updatedAward : a);

  let updatedStaff = staffList;
  if (oldAward && oldAward.points !== updatedAward.points) {
    const diff = (updatedAward.points || 0) - (oldAward.points || 0);
    updatedStaff = staffList.map(s => {
      if (s.id === updatedAward.staffId || (s.nationalId && updatedAward.staffNationalId && s.nationalId === updatedAward.staffNationalId)) {
        const currentPts = typeof s.points === 'number' ? s.points : 0;
        return {
          ...s,
          points: Math.max(0, currentPts + diff),
        };
      }
      return s;
    });
    saveStaffMembers(updatedStaff);
  }

  saveRecognitionAwards(updatedAwards, updatedStaff);

  return { updatedAwards, updatedStaff };
}


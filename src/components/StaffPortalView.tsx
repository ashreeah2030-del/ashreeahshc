import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  StaffMember, 
  DispatchedDocument, 
  SchoolSettings, 
  StaffSignature,
  RecognitionAward
} from '../types';
import { 
  Building2, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Send, 
  KeyRound, 
  LogOut, 
  ShieldCheck, 
  Lock, 
  Eye, 
  Printer, 
  FileCheck,
  Check,
  Calendar,
  Award,
  Sparkles,
  Trophy,
  Star,
  Crown,
  Flame,
  GraduationCap,
  RefreshCw,
  Smartphone,
  Laptop
} from 'lucide-react';
import { formatDisplayPhone, generateRecognitionWhatsApp } from '../utils/whatsapp';
import { CircularProgress } from './CircularProgress';
import { AcademicCalendarView } from './AcademicCalendarView';
import { maskNationalId } from '../utils/formatters';
import { CertificateModal } from './CertificateModal';
import { getTeacherBadge, BADGE_TIERS_GUIDE } from '../utils/badges';
import { syncService } from '../utils/syncService';

interface StaffPortalViewProps {
  currentStaff: StaffMember;
  documents: DispatchedDocument[];
  schoolSettings: SchoolSettings;
  awards?: RecognitionAward[];
  onOpenDoc: (docId: string, staffId: string) => void;
  onUpdatePin: (newPin: string) => void;
  onLogout: () => void;
}

export const StaffPortalView: React.FC<StaffPortalViewProps> = ({
  currentStaff,
  documents,
  schoolSettings,
  awards = [],
  onOpenDoc,
  onUpdatePin,
  onLogout,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'points' | 'inquiries' | 'circulars' | 'history' | 'calendar'>('points');
  
  // PIN change state
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState(false);

  // Certificate modal preview
  const [viewingAward, setViewingAward] = useState<RecognitionAward | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncService.checkForUpdates();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Helper to normalize names for robust comparison across system and Noor records
  const normalizeText = (t?: string): string => {
    if (!t) return '';
    return t
      .replace(/^الأستاذ\s+|^المعلم\s+|^الاستاذ\s+|^الوكيل\s+|^المدير\s+/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[^a-zA-Z0-9\u0621-\u064A]/g, '')
      .trim();
  };

  const cleanDigits = (val?: string): string => (val ? val.replace(/[^0-9]/g, '') : '');

  // Helper to check if a document is signed by this staff member (by ID or National ID)
  const isDocSignedByMe = (doc: DispatchedDocument): boolean => {
    if (!doc.signatures) return false;
    if (doc.signatures[currentStaff.id]) return true;
    const curNatId = cleanDigits(currentStaff.nationalId);
    const curNormName = normalizeText(currentStaff.name);

    return Object.values(doc.signatures).some(s => {
      if (s.staffId === currentStaff.id) return true;
      if (curNatId && s.nationalId && cleanDigits(s.nationalId) === curNatId) return true;
      if (curNormName && s.staffName && normalizeText(s.staffName) === curNormName) return true;
      return false;
    });
  };

  const getMySignature = (doc: DispatchedDocument): StaffSignature | undefined => {
    if (!doc.signatures) return undefined;
    if (doc.signatures[currentStaff.id]) return doc.signatures[currentStaff.id];
    const curNatId = cleanDigits(currentStaff.nationalId);
    const curNormName = normalizeText(currentStaff.name);

    return Object.values(doc.signatures).find(s => {
      if (s.staffId === currentStaff.id) return true;
      if (curNatId && s.nationalId && cleanDigits(s.nationalId) === curNatId) return true;
      if (curNormName && s.staffName && normalizeText(s.staffName) === curNormName) return true;
      return false;
    });
  };

  // Filter awards belonging to this staff member (matches staffId, nationalId, phone, or name)
  const myAwards = useMemo(() => {
    const curStaffId = currentStaff.id;
    const curNatId = cleanDigits(currentStaff.nationalId);
    const curPhone = cleanDigits(currentStaff.phone);
    const curNormName = normalizeText(currentStaff.name);

    return awards.filter(a => {
      if (a.staffId && curStaffId && a.staffId === curStaffId) return true;
      if (curNatId && cleanDigits(a.staffNationalId) === curNatId) return true;
      if (curPhone && curPhone.length >= 9 && cleanDigits(a.staffPhone).endsWith(curPhone.slice(-9))) return true;
      if (curNormName && normalizeText(a.staffName) === curNormName) return true;
      return false;
    });
  }, [awards, currentStaff]);

  // Points update dynamically as soon as a certificate is issued in the control panel
  const myTotalPoints = useMemo(() => {
    const pointsFromAwards = myAwards.reduce((sum, a) => sum + (a.points || 0), 0);
    const basePts = typeof currentStaff.points === 'number' ? currentStaff.points : 0;
    return Math.max(basePts, pointsFromAwards);
  }, [myAwards, currentStaff.points]);

  const myBadge = getTeacherBadge(myTotalPoints);

  // Filter documents belonging to THIS staff member only!
  // Inquiries strictly issued to this staff member (instant matching by id, national id, phone, or name)
  const myInquiries = useMemo(() => {
    const curStaffId = currentStaff.id;
    const curNatId = cleanDigits(currentStaff.nationalId);
    const curPhone = cleanDigits(currentStaff.phone);
    const curNormName = normalizeText(currentStaff.name);

    return documents.filter(doc => {
      if (doc.type !== 'inquiry') return false;
      const inq = doc.inquiryData;

      if (inq?.staffId && curStaffId && inq.staffId === curStaffId) return true;
      if (doc.targetStaffIds && doc.targetStaffIds.includes(curStaffId)) return true;

      if (curNatId) {
        if (inq?.staffNationalId && cleanDigits(inq.staffNationalId) === curNatId) return true;
        if (doc.targetStaffIds && doc.targetStaffIds.some(tid => cleanDigits(tid) === curNatId)) return true;
      }

      if (curPhone && curPhone.length >= 9 && inq?.staffPhone && cleanDigits(inq.staffPhone).endsWith(curPhone.slice(-9))) {
        return true;
      }

      if (curNormName && inq?.staffName && normalizeText(inq.staffName) === curNormName) {
        return true;
      }

      return false;
    });
  }, [documents, currentStaff]);

  // Circulars targeted to this staff member (all school, teachers, specific stage, or specific id)
  const myCirculars = useMemo(() => {
    const curStaffId = currentStaff.id;
    const curNatId = cleanDigits(currentStaff.nationalId);

    return documents.filter(doc => {
      if (doc.type !== 'circular') return false;
      const aud = doc.circularData?.targetAudience || 'all';
      if (aud === 'all') return true;
      if (aud === 'teachers' && (currentStaff.role === 'teacher' || currentStaff.role === 'activity_leader')) return true;
      if (aud === 'admins' && (currentStaff.role === 'admin' || currentStaff.role === 'counselor' || currentStaff.role === 'student_affairs' || currentStaff.role === 'student_affairs_vice_principal' || currentStaff.role === 'computer_lab_prep' || currentStaff.role === 'vice_principal' || currentStaff.role === 'lab_prep')) return true;
      if (aud === currentStaff.stage) return true;
      if (doc.targetStaffIds && doc.targetStaffIds.includes(curStaffId)) return true;
      if (curNatId && doc.targetStaffIds && doc.targetStaffIds.some(tid => cleanDigits(tid) === curNatId)) return true;
      return false;
    });
  }, [documents, currentStaff]);

  // Track live incoming updates from dashboard to trigger notification banners
  const [newNotice, setNewNotice] = useState<{ type: 'inquiry' | 'award'; title: string; message: string; docId?: string } | null>(null);
  const initialAwardsCount = useRef<number | null>(null);
  const initialInquiriesCount = useRef<number | null>(null);

  useEffect(() => {
    if (initialAwardsCount.current === null) {
      initialAwardsCount.current = myAwards.length;
    } else if (myAwards.length > initialAwardsCount.current) {
      initialAwardsCount.current = myAwards.length;
      const latest = myAwards[0];
      setNewNotice({
        type: 'award',
        title: 'تهانينا! صدرت لك شهادة شكر وتقدير جديدة من الإدارة',
        message: latest ? `تم منحك شهادة شكر بعنوان (${latest.title}) ورصيد إضافي +${latest.points} نقطة.` : 'تم إصدار شهادة تقدير جديدة لحسابك الآن.',
      });
    }
  }, [myAwards]);

  useEffect(() => {
    if (initialInquiriesCount.current === null) {
      initialInquiriesCount.current = myInquiries.length;
    } else if (myInquiries.length > initialInquiriesCount.current) {
      initialInquiriesCount.current = myInquiries.length;
      const latest = myInquiries[0];
      setNewNotice({
        type: 'inquiry',
        title: 'تنبيه إداري: تم توجيه ورقة مساءلة جديدة لحسابك',
        message: latest ? `ورقة مساءلة برقم (${latest.referenceNumber}) بشأن (${latest.inquiryData?.reasonTitle || latest.title}) تتطلب الإفادة والتوقيع.` : 'مساءلة إدارية جديدة بانتظار اطلاعكم.',
        docId: latest?.id,
      });
    }
  }, [myInquiries]);

  // Signed documents history
  const mySignedHistory = documents.filter(doc => isDocSignedByMe(doc));

  // Pending counts
  const pendingInquiriesCount = myInquiries.filter(doc => !isDocSignedByMe(doc)).length;
  const pendingCircularsCount = myCirculars.filter(doc => !isDocSignedByMe(doc)).length;
  const myTotalAssigned = myInquiries.length + myCirculars.length;
  const myCompletionRate = myTotalAssigned > 0 ? Math.round((mySignedHistory.length / myTotalAssigned) * 100) : 100;

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      alert('فضلاً أدخل رمزاً سرياً مكوناً من 4 أرقام على الأقل');
      return;
    }
    onUpdatePin(newPin);
    setPinSuccessMsg(true);
    setTimeout(() => {
      setPinSuccessMsg(false);
      setIsChangingPin(false);
      setNewPin('');
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Staff Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 border-r-6 border-r-emerald-600 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-900/80 border-2 border-amber-400 text-amber-300 flex items-center justify-center font-black text-2xl shadow-md">
                {currentStaff.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black">
                    بوابة الموظف الخاصة
                  </span>
                  <span className="text-xs text-emerald-300 font-mono">
                    {schoolSettings.schoolName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <h1 className="text-lg sm:text-xl font-black text-white">
                    المكرم/ {currentStaff.name}
                  </h1>
                  {myBadge.type !== 'none' ? (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-bold ${myBadge.pillClass}`}>
                      <span>{myBadge.icon}</span>
                      <span>{myBadge.name}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] bg-emerald-900/90 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded-full font-semibold">
                      متبقي {myBadge.remainingToNext} نقطة للشارة المثالية
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {currentStaff.roleTitle} {currentStaff.subject ? `• تخصص: ${currentStaff.subject}` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
              <div className="bg-slate-900/80 border border-emerald-700/50 border-r-3 border-r-emerald-400 rounded-xl px-2.5 py-1.5 flex items-center gap-2.5 shadow-2xs">
                <CircularProgress
                  percentage={myCompletionRate}
                  size={36}
                  strokeWidth={3.5}
                  textSizeClass="text-[9px] font-black"
                />
                <div className="text-right">
                  <span className="text-emerald-300 block text-[9px] font-medium">نسبة توقيعاتك</span>
                  <span className="font-bold text-white text-xs">{mySignedHistory.length} من {myTotalAssigned} وثيقة</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-3 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-xs font-bold rounded-xl border border-emerald-600/60 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="تحديث البيانات فورياً واسترجاع آخر الشهادات والمساءلات الصادرة لحسابك"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث فوري'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangingPin(!isChangingPin)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amber-300" />
                <span>تغيير الرمز السري (PIN)</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 bg-rose-900/80 hover:bg-rose-900 text-rose-100 text-xs font-bold rounded-xl border border-rose-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>

          {/* Quick Staff Details Bar */}
          <div className="mt-5 pt-4 border-t border-emerald-800/60 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {/* Points Card with direct click to points tab */}
            <div 
              onClick={() => setActiveSubTab('points')}
              className="bg-amber-950/80 p-2 rounded-xl border border-amber-500/50 border-r-3 border-r-amber-400 cursor-pointer hover:bg-amber-900/90 transition-colors col-span-2 sm:col-span-1 shadow-xs"
              title="اضغط للاطلاع على رصيد نقاطك وسجل التكريم"
            >
              <div className="flex items-center justify-between">
                <span className="text-amber-300 block text-[10px] font-bold">رصيد نقاطي:</span>
                <Award className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="font-mono font-black text-amber-300 text-sm block mt-0.5">
                {myTotalPoints} <span className="text-[10px] font-sans text-amber-200">نقطة تميز</span>
              </span>
            </div>

            <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-800/40 border-r-3 border-r-amber-400">
              <span className="text-slate-400 block text-[10px]">الهوية الوطنية (محمية):</span>
              <span className="font-mono font-bold text-amber-300 tracking-wider text-sm block mt-0.5" dir="ltr">
                {maskNationalId(currentStaff.nationalId)}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-800/40 border-r-3 border-r-emerald-400">
              <span className="text-slate-400 block text-[10px]">رقم الجوال:</span>
              <span className="font-mono font-bold text-slate-200 text-sm" dir="ltr">{formatDisplayPhone(currentStaff.phone)}</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-800/40 border-r-3 border-r-teal-400">
              <span className="text-slate-400 block text-[10px]">المرحلة الدراسية:</span>
              <span className="font-bold text-slate-200">
                {currentStaff.stage === 'elementary' ? 'المرحلة الابتدائية' :
                 currentStaff.stage === 'intermediate' ? 'المرحلة المتوسطة' :
                 currentStaff.stage === 'secondary' ? 'المرحلة الثانوية' : 'المجمع كاملاً'}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-800/40 border-r-3 border-r-emerald-400">
              <span className="text-slate-400 block text-[10px]">حالة الحساب:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>نشط وموثق</span>
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Device Cloud Sync Notice */}
        <div className="bg-emerald-50/90 border-b border-emerald-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold">المزامنة السحابية المركزية مفعلة:</span>
            <span className="text-emerald-800 text-[11px]">
              كافة شهادات الشكر، ونقاط التميز، وأوراق المساءلة الإدارية الصادرة لك تظهر فوراً من أي جهاز تدخل منه بحسابك.
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
            <Smartphone className="w-3.5 h-3.5" />
            <span>جوال</span>
            <span>•</span>
            <Laptop className="w-3.5 h-3.5" />
            <span>حاسب</span>
            <span>•</span>
            <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-950 font-bold">هوية: {maskNationalId(currentStaff.nationalId)}</span>
          </div>
        </div>

        {/* Change PIN Form Popdown */}
        {isChangingPin && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 border-r-4 border-r-amber-500">
            <form onSubmit={handleSavePin} className="max-w-md mx-auto space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-800" />
                  <span>تعديل رمز الدخول السري (PIN) الخاص بك:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="text-xs text-amber-800 hover:underline"
                >
                  إلغاء
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={10}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة"
                  className="px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-950 outline-none w-full"
                  dir="ltr"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer"
                >
                  حفظ الرمز
                </button>
              </div>
              {pinSuccessMsg && (
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>تم تحديث الرمز السري بنجاح! سيتم استخدامه في تسجيلات الدخول القادمة.</span>
                </p>
              )}
            </form>
          </div>
        )}

        {/* Privacy Assurance Banner */}
        <div className="p-3.5 bg-emerald-50/80 border-t border-emerald-100 flex items-center gap-2 text-xs text-emerald-950">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <p className="font-semibold leading-relaxed">
            <strong>مساحة سرية ومحمية:</strong> هذه البوابة خاصة بك وحدك. أوراق المساءلة والتعاميم الموجهة لك لا يمكن لأي معلم أو موظف آخر في المجمع الاطلاع عليها.
          </p>
        </div>
      </div>

      {/* Real-time Dynamic Update Banner (When new inquiry or certificate arrives) */}
      {newNotice && (
        <div className={`p-4 rounded-2xl border-2 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-bounce-short transition-all ${
          newNotice.type === 'award'
            ? 'bg-amber-50 border-amber-400 text-amber-950'
            : 'bg-rose-50 border-rose-500 text-rose-950'
        }`}>
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              newNotice.type === 'award' ? 'bg-amber-400 text-slate-950' : 'bg-rose-600 text-white animate-pulse'
            }`}>
              {newNotice.type === 'award' ? <Award className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-black text-sm">{newNotice.title}</h4>
              <p className="text-xs mt-0.5 opacity-90">{newNotice.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                if (newNotice.type === 'award') {
                  setActiveSubTab('points');
                } else {
                  setActiveSubTab('inquiries');
                  if (newNotice.docId) {
                    onOpenDoc(newNotice.docId);
                  }
                }
                setNewNotice(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs cursor-pointer shadow-xs ${
                newNotice.type === 'award'
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {newNotice.type === 'award' ? 'استعراض الشهادة والنقاط' : 'فتح ورقة المساءلة والرد'}
            </button>
            <button
              type="button"
              onClick={() => setNewNotice(null)}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
              title="إغلاق التنبيه"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('points')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'points'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-xs ring-1 ring-amber-400'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>نقاطي (التكريم والتحفيز)</span>
          <span className="bg-amber-400 text-slate-950 text-[10px] font-mono font-black px-2 py-0.5 rounded-full shadow-2xs">
            {myTotalPoints} نقطة
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('inquiries')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'inquiries'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>أوراق المساءلة الخاصة بي</span>
          {pendingInquiriesCount > 0 ? (
            <span className="bg-rose-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
              {pendingInquiriesCount} مطلوب إفادتك
            </span>
          ) : (
            <span className="bg-slate-200 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded-full">
              {myInquiries.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('circulars')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'circulars'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>التعاميم الإدارية الموجهة لي</span>
          {pendingCircularsCount > 0 ? (
            <span className="bg-amber-400 text-slate-950 text-[10px] font-mono px-2 py-0.5 rounded-full font-black">
              {pendingCircularsCount} بانتظار التوقيع
            </span>
          ) : (
            <span className="bg-slate-200 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded-full">
              {myCirculars.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>أرشيف توثيقي وإيصالات التوقيع</span>
          <span className="bg-slate-200 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded-full">
            {mySignedHistory.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('calendar')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'calendar'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>التقويم الدراسي (1448هـ)</span>
        </button>
      </div>

      {/* Tab Content: INQUIRIES */}
      {activeSubTab === 'inquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-slate-700">
              أوراق المساءلة الإدارية المسجلة بحقك من إدارة المجمع ({myInquiries.length})
            </span>
            <span className="text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              🔒 سرية وخاصة بك فقط
            </span>
          </div>

          {myInquiries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                سجلك نظيف ومثالي!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                لا توجد أي أوراق مساءلة إدارية مسجلة بحقك في منظومة التواصل. شكراً لحرصك وانضباطك الوظيفي الدائم.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myInquiries.map(doc => {
                const isSigned = isDocSignedByMe(doc);
                const sig = getMySignature(doc);
                const inq = doc.inquiryData;

                return (
                  <div
                    key={doc.id}
                    className={`bg-white rounded-2xl border-2 transition-all p-5 shadow-xs border-r-6 ${
                      isSigned
                        ? 'border-slate-200 border-r-emerald-600'
                        : 'border-amber-400 bg-amber-50/20 border-r-amber-500'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 border-r-2 border-r-amber-500">
                            ورقة مساءلة إدارية
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-600">
                            رقم: {doc.referenceNumber}
                          </span>
                          <span className="text-xs text-slate-400">
                            التاريخ: {doc.hijriDate}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          {doc.title}
                        </h3>
                      </div>

                      <div>
                        {isSigned ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>تم تدوين الإفادة والتوقيع بالعلم</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-900 font-black text-xs border border-rose-300 animate-pulse">
                            <Clock className="w-4 h-4 text-rose-700" />
                            <span>مطلوب تقديم الإفادة والتوقيع</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inquiry Details Summary */}
                    <div className="my-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 border-r-4 border-r-amber-500 text-xs space-y-2 text-slate-700">
                      {inq && (
                        <>
                          <p>
                            <strong className="text-slate-900">بشأن: </strong>
                            <span className="font-semibold text-rose-900">{inq.reasonTitle}</span>
                          </p>
                          <p>
                            <strong className="text-slate-900">تاريخ ووقت الواقعة: </strong>
                            <span>{inq.incidentDate} {inq.incidentTimeOrPeriods ? `(${inq.incidentTimeOrPeriods})` : ''}</span>
                          </p>
                          <p className="leading-relaxed">
                            <strong className="text-slate-900">تفاصيل المساءلة: </strong>
                            <span>{inq.details}</span>
                          </p>
                        </>
                      )}

                      {isSigned && sig && (
                        <div className="mt-2 pt-2 border-t border-slate-200 bg-emerald-50/50 p-2.5 rounded-lg">
                          <p className="text-[11px] font-bold text-emerald-950">
                            ✍️ نص إفادتك ومبرراتك المسجلة:
                          </p>
                          <p className="text-xs text-slate-800 italic mt-0.5">
                            "{sig.responseText || 'تم التوقيع بالعلم دون إبداء مبررات إضافية'}"
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>وقت التوقيع: {sig.formattedDate}</span>
                            <span className="font-bold text-emerald-800">رمز التوثيق: {sig.receiptCode}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-[11px] text-slate-500">
                        {isSigned ? (
                          <span>تم إرسال الوثيقة الموقعة لإدارة مجمع الشريعة بنجاح</span>
                        ) : (
                          <span className="text-rose-700 font-bold">
                            ⚠️ يُرجى تقديم الإفادة والمبررات والتوقيع في أسرع وقت
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenDoc(doc.id, currentStaff.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSigned
                              ? 'bg-slate-800 hover:bg-slate-900 text-white'
                              : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-xs'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          <span>{isSigned ? 'استعراض وثيقة الإفادة والتوقيع المعتمدة' : 'كتابة الإفادة والتوقيع بالعلم الآن'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: CIRCULARS */}
      {activeSubTab === 'circulars' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-slate-700">
              التعاميم الإدارية الرسمية الموجهة إليك ({myCirculars.length})
            </span>
            <span className="text-slate-400">
              تحديث مباشر من إدارة المجمع
            </span>
          </div>

          {myCirculars.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-3 shadow-xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                لا توجد تعاميم جديدة حالياً
              </h3>
              <p className="text-xs text-slate-500">
                سيظهر أي تعميم إداري رسمي صادر من إدارة مجمع الشريعة هنا فور إصداره
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myCirculars.map(doc => {
                const isSigned = isDocSignedByMe(doc);
                const sig = getMySignature(doc);

                return (
                  <div
                    key={doc.id}
                    className={`bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-emerald-300 transition-colors border-r-4 ${
                      isSigned ? 'border-r-emerald-600' : 'border-r-amber-500'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 border-r-2 border-r-emerald-600">
                            تعميم إداري
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-600">
                            رقم: {doc.referenceNumber}
                          </span>
                          <span className="text-xs text-slate-400">
                            التاريخ: {doc.hijriDate}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          {doc.title}
                        </h3>
                      </div>

                      <div>
                        {isSigned ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>موقع بالعلم</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
                            <Clock className="w-4 h-4 text-amber-700" />
                            <span>بانتظار توقيعك</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="my-3 text-xs sm:text-sm text-slate-700 line-clamp-2 leading-relaxed">
                      {doc.circularData?.content}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="text-[11px] text-slate-500 font-mono">
                        {isSigned && sig ? (
                          <span className="text-emerald-800 font-bold">
                            تم التوقيع بتاريخ: {sig.formattedDate} (رمز: {sig.receiptCode})
                          </span>
                        ) : (
                          <span>يلزم الاطلاع والتوقيع بالعلم</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenDoc(doc.id, currentStaff.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSigned
                            ? 'bg-slate-800 hover:bg-slate-900 text-white'
                            : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>{isSigned ? 'استعراض التعميم الموقّع' : 'فتح التعميم والتوقيع بالعلم'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: SIGNED HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-slate-700">
              سجل التواقيع والإيصالات الرسمية المعتمدة لك ({mySignedHistory.length})
            </span>
          </div>

          {mySignedHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 border-r-4 border-r-slate-300 p-8 text-center text-slate-400 text-xs">
              لم تقم بتوقيع أي وثيقة بعد
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 border-r-4 border-r-emerald-600 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                      <th className="p-3">نوع المستند</th>
                      <th className="p-3">رقم الوثيقة</th>
                      <th className="p-3">العنوان</th>
                      <th className="p-3">تاريخ ووقت توقيعك</th>
                      <th className="p-3">كود التوثيق</th>
                      <th className="p-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mySignedHistory.map(doc => {
                      const sig = getMySignature(doc);
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/70">
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              doc.type === 'circular'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}>
                              {doc.type === 'circular' ? 'تعميم رسمي' : 'ورقة مساءلة'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700">
                            {doc.referenceNumber}
                          </td>
                          <td className="p-3 font-semibold text-slate-900">
                            {doc.title}
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            {sig?.formattedDate}
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-800">
                            {sig?.receiptCode}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => onOpenDoc(doc.id, currentStaff.id)}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              عرض
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: CALENDAR */}
      {activeSubTab === 'calendar' && (
        <AcademicCalendarView
          schoolSettings={schoolSettings}
          isStaffPortal={true}
        />
      )}

      {/* Tab Content: POINTS & RECOGNITION (نقاطي وتكريمي) */}
      {activeSubTab === 'points' && (
        <div className="space-y-6">
          {/* Top Honor & Rank Showcase */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 rounded-3xl p-6 sm:p-8 text-slate-950 shadow-md relative overflow-hidden">
            {/* Background decorative patterns */}
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-right space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 bg-slate-950/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-black text-slate-950">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                  <span>برنامج شارات التميز والتحفيز المستمر لمنسوبي المجمع</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                  رصيدك الحالي: {myTotalPoints} نقطة تميز
                </h2>

                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {myBadge.type === 'star' ? (
                    '⭐ مبارك لك! لقد حققت أعلى وسام "شارة النجم" (300+ نقطة) تقديرًا لريادتك وعطائك الاستثنائي في المجمع.'
                  ) : myBadge.type === 'advanced' ? (
                    '💎 رائع جداً! لقد حققت "الشارة المتقدم" (200+ نقطة). واصل عطاءك المتميز للوصول إلى "شارة النجم".'
                  ) : myBadge.type === 'ideal' ? (
                    '🏅 تهانينا! لقد حققت "الشارة المثالية" (100+ نقطة). أنت نموذج ملهم ونشكر لك انضباطك وجهودك.'
                  ) : (
                    `🌱 مرحباً بك في مسار التميز! أنت تجمع النقاط حالياً، متبقي لك ${myBadge.remainingToNext} نقطة فقط لتحقيق "الشارة المثالية".`
                  )}
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="bg-slate-950 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs">
                    <span>{myBadge.icon}</span>
                    <span>{myBadge.type !== 'none' ? myBadge.name : 'مسار التميز (دون 100 نقطة)'}</span>
                  </span>
                  {myBadge.nextPoints && (
                    <span className="bg-white/40 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold">
                      متبقي {myBadge.remainingToNext} نقطة لـ {myBadge.type === 'none' ? 'الشارة المثالية' : myBadge.type === 'ideal' ? 'الشارة المتقدم' : 'شارة النجم'}
                    </span>
                  )}
                  <span className="bg-white/40 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold">
                    إجمالي شهادات الشكر: {myAwards.length}
                  </span>
                </div>
              </div>

              {/* Big Score Badge Circle */}
              <div className="shrink-0 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-slate-950 text-amber-400 border-4 border-amber-300/80 shadow-xl flex flex-col items-center justify-center p-3 relative">
                  <span className="text-2xl mb-0.5">{myBadge.icon}</span>
                  <span className="font-mono font-black text-3xl text-white tracking-tight leading-none">
                    {myTotalPoints}
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mt-1">
                    نقطة تميز
                  </span>
                </div>
              </div>
            </div>

            {/* Official 3 Badges Track */}
            <div className="mt-6 pt-5 border-t border-slate-950/15">
              <h4 className="text-xs font-black text-slate-950 mb-3 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-slate-950" />
                <span>سلم شارات التميز المعتمدة للمعلمين:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BADGE_TIERS_GUIDE.map(tier => {
                  const isEarned = myTotalPoints >= tier.threshold;
                  const isNext = !isEarned && (
                    (tier.tier === 'ideal' && myTotalPoints < 100) ||
                    (tier.tier === 'advanced' && myTotalPoints >= 100 && myTotalPoints < 200) ||
                    (tier.tier === 'star' && myTotalPoints >= 200 && myTotalPoints < 300)
                  );

                  return (
                    <div
                      key={tier.tier}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isEarned
                          ? 'bg-slate-950 text-white border-amber-400/80 shadow-sm ring-2 ring-amber-300/50'
                          : isNext
                          ? 'bg-white/90 text-slate-900 border-amber-400 shadow-2xs'
                          : 'bg-white/40 text-slate-700 border-white/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{tier.icon}</span>
                          <div>
                            <span className={`block font-black text-xs ${isEarned ? 'text-amber-300' : 'text-slate-900'}`}>
                              {tier.name}
                            </span>
                            <span className={`block text-[10px] font-mono font-bold ${isEarned ? 'text-amber-200/80' : 'text-slate-500'}`}>
                              {tier.threshold} نقطة
                            </span>
                          </div>
                        </div>
                        <div>
                          {isEarned ? (
                            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>محققة</span>
                            </span>
                          ) : isNext ? (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-black">
                              قيد التحصيل ({tier.threshold - myTotalPoints} متبقي)
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                              مستوى قادم
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`text-[11px] mt-2 line-clamp-1 ${isEarned ? 'text-slate-300' : 'text-slate-600'}`}>
                        {tier.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section: Official Certificates of Appreciation */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>شهادات الشكر والتقدير الرسمية الممنوحة لك ({myAwards.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  شهادات رسمية معتمدة من إدارة المجمع قابلة للطباعة بدقة عالية والمشاركة عبر الواتس أب
                </p>
              </div>
            </div>

            {myAwards.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                  <Award className="w-7 h-7" />
                </div>
                <h4 className="font-black text-slate-800 text-sm">لا توجد شهادات شكر مسجلة بعد</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  تمنح إدارة المجمع شهادات الشكر ونقاط التميز تلقائياً للمشاركين في انضباط الطابور الصباحي، وتأدية الحصص الدراسية النموذجية، ومناوبة الإشراف اليومي. ستظهر شهاداتك فور إصدارها هنا.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myAwards.map((award) => (
                  <div
                    key={award.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400 p-5 shadow-xs transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                          </span>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {award.certificateNumber}
                            </span>
                            <h4 className="font-black text-slate-900 text-sm mt-0.5 group-hover:text-emerald-800 transition-colors">
                              {award.title}
                            </h4>
                          </div>
                        </div>

                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-black text-xs px-2.5 py-1 rounded-lg shrink-0">
                          +{award.points} نقطة
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        {award.reason}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>التاريخ: {award.date}</span>
                        {award.hijriDate && <span>الموافق: {award.hijriDate}</span>}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingAward(award)}
                        className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>معاينة وطباعة الشهادة</span>
                      </button>

                      {currentStaff.phone && (
                        <a
                          href={generateRecognitionWhatsApp(award, currentStaff, schoolSettings)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="إرسال عبر الواتس أب"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">واتساب</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Points Ledger */}
          {myAwards.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>سجل حركات نقاط التميز المعتمدة</span>
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  الإجمالي: {myTotalPoints} نقطة
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">تاريخ الاستحقاق</th>
                      <th className="p-3">المجال / الفئة</th>
                      <th className="p-3">رقم الشهادة</th>
                      <th className="p-3">بيان التميز</th>
                      <th className="p-3 text-center">النقاط المكتسبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myAwards.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-mono text-slate-700">{item.date}</span>
                          {item.hijriDate && (
                            <span className="block text-[10px] text-slate-400 font-sans">{item.hijriDate}</span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.category === 'morning_assembly' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                            item.category === 'ideal_lesson' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                            item.category === 'supervision' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                            'bg-purple-100 text-purple-900 border border-purple-200'
                          }`}>
                            {item.category === 'morning_assembly' ? 'انضباط الطابور الصباحي' :
                             item.category === 'ideal_lesson' ? 'حصة دراسية مثالية' :
                             item.category === 'supervision' ? 'الإشراف والمناوبة' : 'تكريم ومبادرات'}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-800">{item.certificateNumber}</td>
                        <td className="p-3 text-slate-700 max-w-xs">{item.reason}</td>
                        <td className="p-3 text-center">
                          <span className="font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs">
                            +{item.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certificate Print & Preview Modal */}
      {viewingAward && (
        <CertificateModal
          award={viewingAward}
          staff={currentStaff}
          schoolSettings={schoolSettings}
          onClose={() => setViewingAward(null)}
        />
      )}
    </div>
  );
};

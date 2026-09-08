import React, { useState } from 'react';
import { 
  StaffMember, 
  DispatchedDocument, 
  SchoolSettings, 
  StaffSignature 
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
  Check
} from 'lucide-react';
import { formatDisplayPhone } from '../utils/whatsapp';
import { CircularProgress } from './CircularProgress';

interface StaffPortalViewProps {
  currentStaff: StaffMember;
  documents: DispatchedDocument[];
  schoolSettings: SchoolSettings;
  onOpenDoc: (docId: string, staffId: string) => void;
  onUpdatePin: (newPin: string) => void;
  onLogout: () => void;
}

export const StaffPortalView: React.FC<StaffPortalViewProps> = ({
  currentStaff,
  documents,
  schoolSettings,
  onOpenDoc,
  onUpdatePin,
  onLogout,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inquiries' | 'circulars' | 'history'>('inquiries');
  
  // PIN change state
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState(false);

  // Filter documents belonging to THIS staff member only!
  // Inquiries strictly issued to this staff member
  const myInquiries = documents.filter(doc => 
    doc.type === 'inquiry' && 
    (doc.inquiryData?.staffId === currentStaff.id || doc.targetStaffIds.includes(currentStaff.id))
  );

  // Circulars targeted to this staff member (all school, teachers, specific stage, or specific id)
  const myCirculars = documents.filter(doc => {
    if (doc.type !== 'circular') return false;
    const aud = doc.circularData?.targetAudience || 'all';
    if (aud === 'all') return true;
    if (aud === 'teachers' && (currentStaff.role === 'teacher' || currentStaff.role === 'activity_leader')) return true;
    if (aud === 'admins' && (currentStaff.role === 'admin' || currentStaff.role === 'counselor' || currentStaff.role === 'student_affairs' || currentStaff.role === 'vice_principal')) return true;
    if (aud === currentStaff.stage) return true;
    if (doc.targetStaffIds.includes(currentStaff.id)) return true;
    return false;
  });

  // Signed documents history
  const mySignedHistory = documents.filter(doc => !!doc.signatures[currentStaff.id]);

  // Pending counts
  const pendingInquiriesCount = myInquiries.filter(doc => !doc.signatures[currentStaff.id]).length;
  const pendingCircularsCount = myCirculars.filter(doc => !doc.signatures[currentStaff.id]).length;
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
                <h1 className="text-lg sm:text-xl font-black text-white mt-1">
                  المكرم/ {currentStaff.name}
                </h1>
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
          <div className="mt-5 pt-4 border-t border-emerald-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-800/40 border-r-3 border-r-amber-400">
              <span className="text-slate-400 block text-[10px]">السجل المدني (الوطني):</span>
              <span className="font-mono font-bold text-amber-300 tracking-wider text-sm">{currentStaff.nationalId}</span>
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
                  placeholder="أدخل 4 أرقام جديدة"
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

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs sm:text-sm font-bold">
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
                const isSigned = !!doc.signatures[currentStaff.id];
                const sig = doc.signatures[currentStaff.id];
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
                const isSigned = !!doc.signatures[currentStaff.id];
                const sig = doc.signatures[currentStaff.id];

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
                      const sig = doc.signatures[currentStaff.id];
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
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Smartphone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { StaffMember, SchoolSettings } from '../types';

interface StaffPasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  schoolSettings: SchoolSettings;
  initialNationalId?: string;
  onPasswordResetSuccess: (updatedStaff: StaffMember) => void;
}

export const StaffPasswordRecoveryModal: React.FC<StaffPasswordRecoveryModalProps> = ({
  isOpen,
  onClose,
  staffList,
  schoolSettings,
  initialNationalId = '',
  onPasswordResetSuccess,
}) => {
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [matchedStaff, setMatchedStaff] = useState<StaffMember | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync initialNationalId when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsSuccess(false);
      setIsPhoneVerified(false);
      setNewPassword('');
      setConfirmPassword('');
      const cleanInit = (initialNationalId || '').replace(/[^0-9]/g, '').slice(0, 10);
      setNationalId(cleanInit);
      if (cleanInit.length === 10) {
        const found = staffList.find(s => s.nationalId === cleanInit);
        setMatchedStaff(found || null);
      } else {
        setMatchedStaff(null);
      }
    }
  }, [isOpen, initialNationalId, staffList]);

  if (!isOpen) return null;

  // Handle National ID change
  const handleNationalIdChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 10);
    setNationalId(clean);
    setErrorMsg('');
    setIsPhoneVerified(false);

    if (clean.length === 10) {
      const found = staffList.find(s => s.nationalId === clean);
      setMatchedStaff(found || null);
      if (!found) {
        setErrorMsg('رقم الهوية المدخل غير مدرج في بيانات كادر المجمع');
      }
    } else {
      setMatchedStaff(null);
    }
  };

  // Verify Phone Identity
  const handleVerifyPhone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!matchedStaff) {
      setErrorMsg('يرجى التأكد من رقم الهوية الوطنية أولاً');
      return;
    }

    const cleanInputPhone = phone.replace(/[^0-9]/g, '');
    const cleanStaffPhone = (matchedStaff.phone || '').replace(/[^0-9]/g, '');

    if (cleanInputPhone.length < 9) {
      setErrorMsg('يرجى إدخال رقم الجوال المسجل والمكون من 10 أرقام (مثال: 0501234567)');
      return;
    }

    // Match phone (either exact match or suffix match)
    const matches = 
      cleanInputPhone === cleanStaffPhone || 
      (cleanInputPhone.length >= 9 && cleanStaffPhone.endsWith(cleanInputPhone.slice(-9))) ||
      cleanInputPhone.endsWith(cleanStaffPhone.slice(-9));

    if (!matches && cleanStaffPhone.length > 0) {
      setErrorMsg('رقم الجوال المدخل لا يتطابق مع رقم الجوال المعتمد في ملف الموظف. يمكنك التواصل مع الإدارة.');
      return;
    }

    setIsPhoneVerified(true);
  };

  // Submit Password Reset
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!matchedStaff) {
      setErrorMsg('لم يتم التعرف على بيانات الموظف');
      return;
    }

    if (!isPhoneVerified) {
      handleVerifyPhone();
      return;
    }

    const pass = newPassword.trim();
    const confirmPass = confirmPassword.trim();

    if (pass.length < 4) {
      setErrorMsg('كلمة المرور الجديدة يجب ألا تقل عن 4 خانات');
      return;
    }

    if (pass !== confirmPass) {
      setErrorMsg('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    const updatedStaff: StaffMember = {
      ...matchedStaff,
      pin: pass,
      registered: true,
      registeredAt: matchedStaff.registeredAt || new Date().toISOString(),
    };

    onPasswordResetSuccess(updatedStaff);
    setIsSuccess(true);
  };

  // WhatsApp link to school admin
  const adminPhoneClean = (schoolSettings.adminPhone || '0509205097').replace(/[^0-9]/g, '').replace(/^0/, '');
  const teacherName = matchedStaff ? matchedStaff.name : 'موظف';
  const teacherId = nationalId || (matchedStaff ? matchedStaff.nationalId : '');
  const waMsg = encodeURIComponent(
    `السلام عليكم ورحمة الله، أنا الموظف (${teacherName}) - سجل مدني: (${teacherId}) في ${schoolSettings.schoolName}. أرجو التكرم بمساعدتي في استعادة أو إعادة ضبط كلمة المرور الخاصة بحسابي في المنظومة.`
  );
  const whatsappUrl = `https://wa.me/966${adminPhoneClean}?text=${waMsg}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 border-r-6 border-r-amber-500 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">
                استعادة كلمة المرور للموظف
              </h3>
              <p className="text-[11px] text-amber-200/90 font-medium">
                {schoolSettings.schoolName} • التحقق الآمن وإعادة التعيين
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {isSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                تمت استعادة وتحديث كلمة المرور بنجاح!
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                مرحباً بك أ. <strong>{matchedStaff?.name}</strong>، تم تعيين كلمة المرور الجديدة وتحديث حسابك بنجاح. يمكنك الآن تسجيل الدخول مباشرة لمساحتك الخاصة.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <span>تسجيل الدخول بكلمة المرور الجديدة</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  أدخل رقم الهوية الوطنية المسجلة ورقم الجوال المعتمد للتحقق من هويتك، ثم قم بتعيين كلمة مرور جديدة لحسابك.
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. National ID */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  رقم الهوية الوطنية (السجل المدني): <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    value={nationalId}
                    onChange={(e) => handleNationalIdChange(e.target.value)}
                    placeholder="أدخل 10 أرقام (مثال: 1028471923)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900"
                    dir="ltr"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Matched Staff Card */}
              {matchedStaff && (
                <div className="p-3 bg-emerald-50/90 border border-emerald-300/80 rounded-xl animate-in fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-emerald-800 font-bold block">الموظف المعني:</span>
                      <span className="text-sm font-black text-slate-900 block mt-0.5">{matchedStaff.name}</span>
                      <span className="text-[11px] text-slate-600 font-medium">
                        {matchedStaff.roleTitle || 'معلم'} 
                        {matchedStaff.stage && matchedStaff.stage !== 'all' ? ` • المرحلة ${matchedStaff.stage}` : ''}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-700 text-white px-2.5 py-1 rounded-full shrink-0">
                      حساب معتمد
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Registered Phone Verification */}
              {matchedStaff && (
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-800">
                        رقم الجوال المسجل بالملف: <span className="text-rose-500">*</span>
                      </label>
                      {matchedStaff.phone && (
                        <span className="text-[10px] text-slate-500 font-mono" dir="ltr">
                          (المسجل: {matchedStaff.phone.slice(0, 3)}****{matchedStaff.phone.slice(-3)})
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/[^0-9]/g, ''));
                          setIsPhoneVerified(false);
                          setErrorMsg('');
                        }}
                        placeholder="أدخل رقم جوالك للتأكيد (مثال: 0501234567)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900"
                        dir="ltr"
                        required
                      />
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  {!isPhoneVerified && (
                    <button
                      type="button"
                      onClick={() => handleVerifyPhone()}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      <span>التحقق من رقم الجوال</span>
                    </button>
                  )}
                </div>
              )}

              {/* 3. New Password Fields (Visible once phone is verified or entered) */}
              {matchedStaff && isPhoneVerified && (
                <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in">
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تم التحقق من هويتك بنجاح! أدخل كلمة المرور الجديدة أدناه:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        كلمة المرور الجديدة: <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="كلمة المرور (4+ خانات)"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900 pr-3 pl-9"
                          dir="ltr"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        تأكيد كلمة المرور: <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="أعد إدخال كلمة المرور"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900 pr-3 pl-9"
                          dir="ltr"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {newPassword.length > 0 && confirmPassword.length > 0 && (
                    <div>
                      {newPassword === confirmPassword ? (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>كلمتا المرور متطابقتان</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>كلمتا المرور غير متطابقتين</span>
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <KeyRound className="w-4 h-4 text-amber-300" />
                    <span>حفظ كلمة المرور الجديدة وتفعيلها</span>
                  </button>
                </div>
              )}

              {/* Admin WhatsApp Assistance */}
              <div className="pt-3 border-t border-slate-100">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800 block">فقدت الوصول لجوالك المسجل؟</span>
                    <span className="text-[11px] text-slate-500">تواصل مع إدارة المجمع عبر الواتساب لإعادة ضبط فورية.</span>
                  </div>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-200" />
                    <span>واتساب الإدارة</span>
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>{schoolSettings.schoolName}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

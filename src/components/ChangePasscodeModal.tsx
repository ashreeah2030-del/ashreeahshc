import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  ShieldCheck, 
  AlertCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { SchoolSettings } from '../types';

interface ChangePasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolSettings: SchoolSettings;
  onSavePassword: (newPassword: string) => void;
  isLoggedInAdmin?: boolean;
}

export const ChangePasscodeModal: React.FC<ChangePasscodeModalProps> = ({
  isOpen,
  onClose,
  schoolSettings,
  onSavePassword,
  isLoggedInAdmin = false,
}) => {
  const currentActualPassword = schoolSettings.adminPassword || 'admin';
  
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // If not already logged in, verify current password or school master code
    if (!isLoggedInAdmin) {
      const cleanCurrent = currentPasswordInput.trim();
      const isValidCurrent = 
        cleanCurrent === currentActualPassword || 
        cleanCurrent === 'admin' || 
        cleanCurrent === schoolSettings.schoolCode ||
        cleanCurrent === '1028471923'; // principal national ID

      if (!isValidCurrent) {
        setErrorMsg('رمز الدخول الحالي غير صحيح. يمكنك إدخال الرمز الحالي أو الرقم الوزاري للمجمع (432109)');
        return;
      }
    }

    const cleanNew = newPassword.trim();
    if (!cleanNew || cleanNew.length < 4) {
      setErrorMsg('يجب ألا يقل رمز الدخول الجديد عن 4 خانات (أرقام أو حروف)');
      return;
    }

    if (cleanNew !== confirmPassword.trim()) {
      setErrorMsg('رمز الدخول الجديد غير متطابق مع حقل التأكيد');
      return;
    }

    onSavePassword(cleanNew);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  const handleResetToDefault = () => {
    if (confirm('هل ترغب في إعادة رمز الدخول إلى الرمز الافتراضي (admin)؟')) {
      onSavePassword('admin');
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 border-r-6 border-r-emerald-600">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300 border border-white/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">
                تغيير رمز الدخول لإدارة المنظومة
              </h3>
              <p className="text-[11px] text-slate-300">
                {schoolSettings.schoolName} • لوحة الإدارة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {successMsg ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                تم تغيير رمز الدخول بنجاح!
              </h4>
              <p className="text-xs text-slate-600">
                يمكنك الآن استخدام الرمز السري الجديد لتسجيل الدخول إلى لوحة إدارة مجمع الشريعة.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span>
                    هذا الرمز مخصص للمدير والوكلاء للوصول إلى لوحة التحكم، وإصدار التعاميم، ومتابعة توقيعات المنسوبين.
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Current Password Field (if not already verified admin) */}
              {!isLoggedInAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    رمز الدخول الحالي (أو الرقم الوزاري 432109): *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="أدخل الرمز الحالي لتأكيد الهوية"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono text-slate-900 dir-ltr text-right"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    رمز الدخول الجديد (PIN أو كلمة مرور): *
                  </label>
                  <span className="text-[10px] text-slate-500">
                    4 خانات على الأقل
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="مثال: 1448 أو 2030 أو كلمة مخصصة"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900 dir-ltr text-right"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  تأكيد رمز الدخول الجديد: *
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة الرمز الجديد للتأكيد"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900 dir-ltr text-right"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-500 block mb-1 font-medium">اقتراحات سريعة لرموز معتمدة:</span>
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPassword('1448');
                      setConfirmPassword('1448');
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg border border-slate-200 font-mono text-[11px] transition-colors cursor-pointer"
                  >
                    1448 (العام الحالي)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPassword('2030');
                      setConfirmPassword('2030');
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg border border-slate-200 font-mono text-[11px] transition-colors cursor-pointer"
                  >
                    2030 (رؤية المملكة)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPassword('admin');
                      setConfirmPassword('admin');
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg border border-slate-200 font-mono text-[11px] transition-colors cursor-pointer"
                  >
                    admin (الافتراضي)
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  title="استعادة الرمز الافتراضي admin"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة الافتراضي</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ وتحديث رمز الدخول</span>
                  </button>
                </div>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

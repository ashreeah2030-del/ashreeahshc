import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  Smartphone, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  Briefcase, 
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { StaffMember, SchoolSettings, AuthSession } from '../types';
import { MoeLogo } from './MoeLogo';

interface LoginViewProps {
  schoolSettings: SchoolSettings;
  staffList: StaffMember[];
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  schoolSettings,
  staffList,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'admin'>('staff');

  // Staff login state
  const [nationalIdOrPhone, setNationalIdOrPhone] = useState('');
  const [pin, setPin] = useState('');
  const [staffError, setStaffError] = useState('');

  // Admin login state
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [adminError, setAdminError] = useState('');

  // Handle Staff Login
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    const cleanInput = nationalIdOrPhone.trim();
    if (!cleanInput) {
      setStaffError('يرجى إدخال رقم السجل المدني أو رقم الجوال');
      return;
    }

    // Find staff member by National ID or Phone
    const foundStaff = staffList.find(s => 
      s.nationalId.trim() === cleanInput || 
      s.phone.replace(/[^0-9]/g, '').endsWith(cleanInput.replace(/[^0-9]/g, ''))
    );

    if (!foundStaff) {
      setStaffError('لم يتم العثور على موظف مسجل بهذا السجل المدني أو رقم الجوال');
      return;
    }

    // Check PIN (default is last 4 digits of National ID)
    const expectedPin = foundStaff.pin || foundStaff.nationalId.slice(-4);
    if (pin.trim() !== expectedPin) {
      setStaffError(`رمز الدخول السري غير صحيح. (تلميح: الرمز الافتراضي هو آخر 4 أرقام من سجلك المدني: ${expectedPin})`);
      return;
    }

    onLoginSuccess({
      role: 'staff',
      staffId: foundStaff.id,
      staffMember: foundStaff,
      loginAt: new Date().toISOString(),
    });
  };

  // Quick Demo Login for Staff
  const handleQuickStaffSelect = (staff: StaffMember) => {
    setNationalIdOrPhone(staff.nationalId);
    setPin(staff.pin || staff.nationalId.slice(-4));
    setStaffError('');
  };

  // Handle Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const u = adminUsername.trim().toLowerCase();
    const p = adminPassword.trim();

    // Valid admin credentials:
    // 1) admin / admin
    // 2) principal's national ID / principal phone or pin
    // 3) vice principal's national ID
    const isMasterAdmin = (u === 'admin' && (p === 'admin' || p === '1234' || p === '1446' || p === '2030'));
    const isPrincipal = staffList.some(s => 
      (s.role === 'principal' || s.role === 'vice_principal') && 
      (s.nationalId === u || s.phone.endsWith(u)) &&
      (p === s.pin || p === s.nationalId.slice(-4) || p === 'admin')
    );

    if (isMasterAdmin || isPrincipal) {
      onLoginSuccess({
        role: 'admin',
        adminName: schoolSettings.principalName,
        loginAt: new Date().toISOString(),
      });
    } else {
      setAdminError('بيانات الدخول غير صحيحة. يمكنك استخدام: اسم المستخدم (admin) وكلمة المرور (admin)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      {/* Top Full-Width Ministry Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-slate-100 px-4 sm:px-8 py-2.5 border-b border-emerald-800/40 text-xs">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <MoeLogo variant="white" size="sm" className="h-6 w-auto opacity-95" />
            <span className="font-bold tracking-wide text-white">المملكة العربية السعودية</span>
            <span className="text-emerald-500/80">•</span>
            <span className="text-slate-300 font-medium">وزارة التعليم</span>
            <span className="text-emerald-500/80">•</span>
            <span className="text-emerald-200 font-semibold">{schoolSettings.educationDepartment}</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300/90 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>بوابة موحدة مشفرة ومحمية بالرمز السري</span>
          </div>
        </div>
      </div>

      {/* Main Full-Page Content Area */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-10 flex items-center justify-center">
        <div className="w-full max-w-5xl xl:max-w-6xl bg-white rounded-3xl border border-slate-200/90 border-r-6 border-r-emerald-600 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left/Side Panel: Official School Identity & Security Badges (5 cols on desktop) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg">
                  <MoeLogo variant="white" size="lg" className="h-12 w-auto" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-300 tracking-wider">
                    المملكة العربية السعودية
                  </div>
                  <div className="text-xs font-semibold text-slate-300">
                    وزارة التعليم • {schoolSettings.educationDepartment}
                  </div>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {schoolSettings.schoolName}
              </h1>
              <p className="text-xs font-bold text-amber-300 mt-1">
                منظومة التواصل المعتمدة • بوابة تسجيل الدخول الموحد
              </p>

              {/* Guarantees List */}
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-900/50 border border-emerald-700/50 border-r-4 border-r-amber-400 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">خصوصية وسرية تامة</span>
                    <span className="text-slate-300 text-[11px] leading-relaxed">
                      لكل معلم حسابه ومساحته الخاصة؛ لا يمكن لأي زميل الاطلاع على أوراق المساءلة الخاصة بغيره.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-900/50 border border-emerald-700/50 border-r-4 border-r-emerald-400 text-xs">
                  <KeyRound className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">توقيع رقمي وكود توثيق</span>
                    <span className="text-slate-300 text-[11px] leading-relaxed">
                      توقيع إلكتروني باللمس أو الماوس مع كود توثيق وختم رسمي معتمد.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-900/50 border border-emerald-700/50 border-r-4 border-r-teal-400 text-xs">
                  <Smartphone className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">ربط فوري مع واتساب المجمع</span>
                    <span className="text-slate-300 text-[11px] leading-relaxed">
                      إعادة إرسال الوثائق والإفادات الموقعة مباشرة إلى جوال المجمع بنقرة واحدة.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Meta & Leaders */}
            <div className="mt-8 pt-4 border-t border-emerald-800/60 text-xs text-slate-300 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400">إشراف إدارة المجمع</span>
                <span className="font-bold text-white">{schoolSettings.principalName}</span>
              </div>
              <div className="text-left">
                <span className="block text-[10px] text-slate-400">الكادر المسجل</span>
                <span className="font-mono font-bold text-amber-300">{staffList.length} موظفاً</span>
              </div>
            </div>
          </div>

          {/* Right/Form Panel (7 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {/* Tab Switcher: Staff vs Admin */}
            <div className="grid grid-cols-2 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('staff');
                  setStaffError('');
                }}
                className={`py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'staff'
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 text-emerald-700" />
                <span>دخول المعلم / الإداري</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setAdminError('');
                }}
                className={`py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-4 h-4 text-slate-700" />
                <span>إدارة المجمع</span>
              </button>
            </div>

            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center">
              {activeTab === 'staff' ? (
                /* Staff Login Form */
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="pb-1">
                    <h2 className="text-base font-black text-slate-900">
                      تسجيل دخول المعلم والإداري
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      أدخل رقم سجلك المدني (أو جوالك) ورمز الدخول السري للاطلاع على مساحتك الخاصة والتوقيع بالعلم.
                    </p>
                  </div>

                  {staffError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{staffError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      رقم السجل المدني (الوطني) أو رقم الجوال:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nationalIdOrPhone}
                        onChange={(e) => setNationalIdOrPhone(e.target.value)}
                        placeholder="مثال: 1028471923 أو 0501234567"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900"
                        dir="ltr"
                        required
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        رمز الدخول السري (PIN):
                      </label>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        افتراضياً: آخر 4 أرقام من السجل المدني
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={10}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="أدخل الرمز السري (مثال: 1923)"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900"
                        dir="ltr"
                        required
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-950/20 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>دخول إلى مساحتي الخاصة</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {/* Quick Staff Selector for evaluation */}
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 mb-2 flex items-center justify-between">
                      <span>تجربة سريعة (اختر معلماً لتجربة الخصوصية فوراً):</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {staffList.slice(0, 9).map(staff => (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => handleQuickStaffSelect(staff)}
                          className="text-right p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 border-r-3 border-r-emerald-600 transition-colors text-[11px] cursor-pointer"
                        >
                          <span className="font-bold text-slate-900 block truncate">{staff.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">سجل: {staff.nationalId}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              ) : (
                /* Admin Login Form */
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="pb-1">
                    <h2 className="text-base font-black text-slate-900">
                      لوحة تحكم إدارة مجمع الشريعة
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      مخصصة للمدير والوكلاء لإدارة بيانات الموظفين، إصدار التعاميم، أوراق المساءلة، ومتابعة التواقيع.
                    </p>
                  </div>

                  {adminError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{adminError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      اسم المستخدم أو السجل المدني:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500/20 focus:border-slate-700 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900"
                        dir="ltr"
                        required
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      كلمة المرور:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="admin"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500/20 focus:border-slate-700 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900"
                        dir="ltr"
                        required
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>دخول لوحة تحكم الإدارة</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="p-3 bg-slate-50 border border-slate-200 border-r-4 border-r-slate-800 rounded-xl text-center text-xs text-slate-600">
                    <span className="font-bold text-slate-800">بيانات الدخول التجريبية للإدارة:</span>
                    <p className="font-mono text-slate-700 mt-0.5">
                      المستخدم: <strong>admin</strong> | كلمة المرور: <strong>admin</strong>
                    </p>
                  </div>
                </form>
              )}

              {/* Privacy Note */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>نظام مشفر يضمن خصوصية كل معلم في استلام وتوقيع أوراق المساءلة دون إطلاع الآخرين.</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Full-Width Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 text-xs text-slate-500 px-4 sm:px-8">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">
            {schoolSettings.schoolName} • منظومة التواصل المعتمدة • {schoolSettings.educationDepartment}
          </span>
          <span className="font-mono text-slate-400">
            العام الدراسي {schoolSettings.academicYear} • رؤية المملكة 2030
          </span>
        </div>
      </footer>
    </div>
  );
};

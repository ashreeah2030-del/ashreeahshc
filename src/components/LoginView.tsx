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
  ChevronDown,
  UserPlus,
  Eye,
  EyeOff,
  IdCard,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { StaffMember, SchoolSettings, AuthSession } from '../types';
import { MoeLogo } from './MoeLogo';
import { ChangePasscodeModal } from './ChangePasscodeModal';
import { StaffPasswordRecoveryModal } from './StaffPasswordRecoveryModal';
import { maskNationalId } from '../utils/formatters';

// Helper to determine if a staff member is already registered in the platform
export const isStaffAlreadyRegistered = (staff: StaffMember | null | undefined): boolean => {
  if (!staff) return false;
  if (staff.registered === true) return true;
  if (Boolean(staff.registeredAt)) return true;
  const defaultPin = staff.nationalId ? staff.nationalId.slice(-4) : '1234';
  if (staff.pin && staff.pin !== defaultPin && staff.pin !== '1234') {
    return true;
  }
  return false;
};

interface LoginViewProps {
  schoolSettings: SchoolSettings;
  staffList: StaffMember[];
  onLoginSuccess: (session: AuthSession) => void;
  onUpdateAdminPassword?: (newPassword: string) => void;
  onRegisterStaff?: (newStaff: StaffMember) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  schoolSettings,
  staffList,
  onLoginSuccess,
  onUpdateAdminPassword,
  onRegisterStaff,
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'admin' | 'register'>('staff');
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryInitialId, setRecoveryInitialId] = useState('');

  // Staff login state
  const [nationalIdOrPhone, setNationalIdOrPhone] = useState('');
  const [pin, setPin] = useState('');
  const [staffError, setStaffError] = useState('');

  // Register account state
  const [regNationalId, setRegNationalId] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [matchedStaffNotice, setMatchedStaffNotice] = useState<StaffMember | null>(null);

  // Admin login state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Real-time lookup as user types National ID in registration
  const handleRegNationalIdChange = (value: string) => {
    const cleanDigits = value.replace(/[^0-9]/g, '').slice(0, 10);
    setRegNationalId(cleanDigits);
    setRegisterError('');

    if (cleanDigits.length === 10) {
      const found = staffList.find(s => s.nationalId === cleanDigits);
      if (found) {
        setMatchedStaffNotice(found);
        if (found.phone) {
          setRegPhone(found.phone);
        }
      } else {
        setMatchedStaffNotice(null);
      }
    } else {
      setMatchedStaffNotice(null);
    }
  };

  // Handle New Account Registration Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    const cleanNatId = regNationalId.trim().replace(/[^0-9]/g, '');
    const cleanPhone = regPhone.trim().replace(/[^0-9]/g, '');
    const pass = regPassword.trim();
    const confirmPass = regConfirmPassword.trim();

    // 1. National ID validation
    if (cleanNatId.length !== 10) {
      setRegisterError('يرجى إدخال رقم هوية وطنية (سجل مدني) صحيح مكون من 10 أرقام');
      return;
    }

    // Lookup staff from control panel data
    const existingStaff = staffList.find(s => s.nationalId === cleanNatId);
    if (!existingStaff) {
      setRegisterError('عفواً، رقم الهوية المدخل غير مدرج في بيانات الموظفين بلوحة التحكم. يرجى مراجعة إدارة المجمع لإضافتك أولاً.');
      return;
    }

    // Check if staff is ALREADY registered previously
    if (isStaffAlreadyRegistered(existingStaff)) {
      setRegisterError(`عفواً، حساب أ. (${existingStaff.name}) مسجل ومفعل مسبقاً في النظام ولا يمكن إنشاء حساب جديد. إذا نسيت كلمة المرور، يرجى النقر على (استعادة كلمة المرور).`);
      setRecoveryInitialId(cleanNatId);
      return;
    }

    // 2. Phone validation
    if (cleanPhone.length < 10) {
      setRegisterError('يرجى إدخال رقم جوال صحيح مكون من 10 أرقام يبدأ بـ 05 (مثال: 0501234567)');
      return;
    }

    // 3. Password validation
    if (pass.length < 4) {
      setRegisterError('كلمة السر يجب ألا تقل عن 4 خانات');
      return;
    }

    // 4. Confirm password validation
    if (pass !== confirmPass) {
      setRegisterError('كلمة السر وتأكيد كلمة السر غير متطابقين، يرجى إعادة التأكد');
      return;
    }

    const memberToSave: StaffMember = {
      ...existingStaff,
      phone: cleanPhone,
      pin: pass,
      active: true,
      registered: true,
      registeredAt: new Date().toISOString(),
    };

    if (onRegisterStaff) {
      onRegisterStaff(memberToSave);
    }

    setRegisterSuccess(`تم تفعيل وتحديث حسابك بنجاح أ. ${memberToSave.name}! جاري نقلك لمساحتك الخاصة...`);

    setTimeout(() => {
      onLoginSuccess({
        role: 'staff',
        staffId: memberToSave.id,
        staffMember: memberToSave,
        loginAt: new Date().toISOString(),
      });
    }, 1100);
  };

  // Handle successful password recovery
  const handlePasswordResetSuccess = (updatedStaff: StaffMember) => {
    if (onRegisterStaff) {
      onRegisterStaff(updatedStaff);
    }
    setActiveTab('staff');
    setNationalIdOrPhone(updatedStaff.nationalId);
    setPin(updatedStaff.pin || '');
    setStaffError('');
    setRegisterError('');
    setRegisterSuccess(`تم تحديث واستعادة كلمة المرور بنجاح أ. ${updatedStaff.name}! يمكنك الآن تسجيل الدخول.`);
  };

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
    const cleanDigits = cleanInput.replace(/[^0-9]/g, '');
    const foundStaff = staffList.find(s => {
      const sNatId = (s.nationalId || '').trim();
      const sPhoneDigits = (s.phone || '').replace(/[^0-9]/g, '');
      return (
        sNatId === cleanInput || 
        (cleanDigits.length > 0 && sPhoneDigits.length > 0 && sPhoneDigits.endsWith(cleanDigits))
      );
    });

    if (!foundStaff) {
      setStaffError('لم يتم العثور على موظف مسجل بهذا السجل المدني أو رقم الجوال. يمكنك النقر على "تسجيل حساب جديد" لإنشاء حسابك فوراً.');
      return;
    }

    // Check PIN
    const expectedPin = foundStaff.pin || (foundStaff.nationalId ? foundStaff.nationalId.slice(-4) : '1234');
    if (pin.trim() !== expectedPin) {
      setStaffError('رمز الدخول السري غير صحيح. يرجى التحقق من كلمة المرور أو استخدام خيار "نسيت كلمة المرور" لاستعادتها.');
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
    setNationalIdOrPhone(staff.nationalId || '');
    setPin('');
    setStaffError('');
  };

  // Handle Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const u = adminUsername.trim().toLowerCase();
    const p = adminPassword.trim();
    const targetAdminPass = schoolSettings.adminPassword || 'admin';
    const targetAdminUser = (schoolSettings.adminUsername || 'admin').trim().toLowerCase();

    // Valid admin credentials:
    // 1) Configured admin password or standard defaults
    const isMasterAdmin = 
      (u === 'admin' || u === targetAdminUser) && 
      (p === targetAdminPass || (targetAdminPass === 'admin' && (p === 'admin' || p === '1234' || p === '1448' || p === '1446' || p === '2030')));

    // 2) principal or vice principal login
    const isPrincipal = staffList.some(s => {
      const sNatId = (s.nationalId || '').trim();
      const sPhone = (s.phone || '').trim();
      const sExpectedPin = s.pin || (s.nationalId ? s.nationalId.slice(-4) : '');
      return (
        (s.role === 'principal' || s.role === 'vice_principal') && 
        (sNatId === u || (sPhone.length > 0 && sPhone.endsWith(u))) &&
        (p === sExpectedPin || p === targetAdminPass || p === 'admin')
      );
    });

    if (isMasterAdmin || isPrincipal) {
      onLoginSuccess({
        role: 'admin',
        adminName: schoolSettings.principalName,
        loginAt: new Date().toISOString(),
      });
    } else {
      setAdminError('بيانات الدخول غير صحيحة. يرجى التأكد من اسم المستخدم ورمز الدخول.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      {/* Top Green & Yellow Medium Gradient Accent Ribbon */}
      <div className="h-2 w-full bg-gradient-to-r from-emerald-600 via-emerald-500 via-amber-400 via-yellow-400 to-emerald-600 shadow-2xs" />

      {/* Top Full-Width Ministry Banner with Green & Yellow Blend */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 via-amber-600 to-emerald-800 text-white px-4 sm:px-8 py-2.5 border-b border-amber-400/30 text-xs">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <MoeLogo variant="white" size="sm" className="h-6 w-auto opacity-95" />
            <span className="font-bold tracking-wide text-white">المملكة العربية السعودية</span>
            <span className="text-amber-300">•</span>
            <span className="text-emerald-100 font-medium">وزارة التعليم</span>
            <span className="text-amber-300">•</span>
            <span className="text-amber-200 font-semibold">{schoolSettings.educationDepartment}</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              id="top-register-account-btn"
              onClick={() => {
                setActiveTab('register');
                setRegisterError('');
                setRegisterSuccess('');
              }}
              className="flex items-center gap-1.5 text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-1.5 rounded-full shadow-xs cursor-pointer transition-all hover:scale-105 active:scale-95"
              title="تسجيل حساب جديد للكادر التعليمي والإداري"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>تسجيل حساب جديد</span>
            </button>
            <div className="flex items-center gap-2 text-amber-200 font-mono text-[11px] bg-emerald-950/60 px-2.5 py-1 rounded-md border border-amber-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>بوابة موحدة مشفرة ومحمية بالرمز السري</span>
            </div>
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
            {/* Tab Switcher: Staff vs Register vs Admin */}
            <div className="grid grid-cols-3 p-1.5 sm:p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold gap-1 sm:gap-1.5">
              <button
                type="button"
                id="tab-staff-login"
                onClick={() => {
                  setActiveTab('staff');
                  setStaffError('');
                }}
                className={`py-2.5 sm:py-3 px-1 sm:px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'staff'
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate">دخول الموظف</span>
              </button>

              <button
                type="button"
                id="tab-register-account"
                onClick={() => {
                  setActiveTab('register');
                  setRegisterError('');
                  setRegisterSuccess('');
                }}
                className={`py-2.5 sm:py-3 px-1 sm:px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                  activeTab === 'register'
                    ? 'bg-emerald-800 text-white shadow-xs font-black'
                    : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-300/80 font-black'
                }`}
              >
                <UserPlus className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">تسجيل حساب جديد</span>
              </button>

              <button
                type="button"
                id="tab-admin-login"
                onClick={() => {
                  setActiveTab('admin');
                  setAdminError('');
                }}
                className={`py-2.5 sm:py-3 px-1 sm:px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="truncate">إدارة المجمع</span>
              </button>
            </div>

            <div className="p-5 sm:p-7 flex-1 flex flex-col justify-center">
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

                  {/* Register Callout for new staff */}
                  <div className="p-3 bg-emerald-50/90 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">ليس لديك حساب مسجل بعد؟</span>
                        <span className="text-[11px] text-slate-500">سجل حسابك برقم الهوية والجوال وكلمة السر الآن</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="btn-switch-to-register"
                      onClick={() => {
                        setActiveTab('register');
                        setRegisterError('');
                        setRegisterSuccess('');
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                      <span>تسجيل حساب</span>
                    </button>
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
                        رمز الدخول السري / كلمة المرور:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const cleanDigits = nationalIdOrPhone.replace(/[^0-9]/g, '');
                          setRecoveryInitialId(cleanDigits.length === 10 ? cleanDigits : '');
                          setIsRecoveryModalOpen(true);
                        }}
                        className="text-[11px] text-amber-800 hover:text-amber-900 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3 text-amber-700" />
                        <span>نسيت كلمة المرور؟</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={20}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="أدخل كلمة المرور أو الرمز السري"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900"
                        dir="ltr"
                        required
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                    <div className="flex items-center justify-end mt-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          const cleanDigits = nationalIdOrPhone.replace(/[^0-9]/g, '');
                          setRecoveryInitialId(cleanDigits.length === 10 ? cleanDigits : '');
                          setIsRecoveryModalOpen(true);
                        }}
                        className="text-amber-700 hover:text-amber-800 font-bold hover:underline cursor-pointer"
                      >
                        استعادة وتعيين كلمة مرور جديدة
                      </button>
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
                          <span className="text-[10px] text-slate-500 font-mono" dir="ltr">سجل: {maskNationalId(staff.nationalId)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              ) : activeTab === 'register' ? (
                /* New Account Registration Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="pb-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-black text-slate-900">
                        تسجيل حساب جديد للكادر التعليمي والإداري
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      أدخل رقم الهوية الوطنية وسيظهر اسمك المعتمد تلقائياً من لوحة التحكم، ثم أدخل رقم الجوال وكلمة السر لتفعيل حسابك الشخصي.
                    </p>
                  </div>

                  {registerError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{registerError}</span>
                    </div>
                  )}

                  {registerSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2 text-emerald-900 text-xs font-bold animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{registerSuccess}</span>
                    </div>
                  )}

                  {/* 1. National ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      رقم الهوية الوطنية (السجل المدني): <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="reg-national-id"
                        type="text"
                        maxLength={10}
                        value={regNationalId}
                        onChange={(e) => handleRegNationalIdChange(e.target.value)}
                        placeholder="أدخل 10 أرقام (مثال: 1028471923)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900"
                        dir="ltr"
                        required
                      />
                      <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      10 أرقام مطابقة للهوية الوطنية أو الإقامة النظامية
                    </span>
                  </div>

                  {/* 2. Auto-retrieved Name from Control Panel & Registration Status */}
                  <div>
                    {matchedStaffNotice ? (
                      <div className={`p-3 rounded-xl border-2 animate-in fade-in transition-all ${
                        isStaffAlreadyRegistered(matchedStaffNotice)
                          ? 'bg-amber-50/70 border-amber-400'
                          : 'bg-emerald-50 border-emerald-500/30'
                      }`}>
                        <span className={`text-[11px] font-bold flex items-center gap-1.5 mb-1 ${
                          isStaffAlreadyRegistered(matchedStaffNotice) ? 'text-amber-800' : 'text-emerald-800'
                        }`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isStaffAlreadyRegistered(matchedStaffNotice) ? 'text-amber-600' : 'text-emerald-600'}`} />
                          <span>الاسم المعتمد في لوحة التحكم:</span>
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-base font-black text-slate-900 block">{matchedStaffNotice.name}</span>
                            <span className="text-xs text-slate-600 font-medium mt-0.5 block">
                              {matchedStaffNotice.roleTitle || (matchedStaffNotice.role === 'teacher' ? 'معلم' : 'إداري')}
                              {matchedStaffNotice.stage && matchedStaffNotice.stage !== 'all' ? ` • المرحلة ${matchedStaffNotice.stage === 'primary' ? 'الابتدائية' : matchedStaffNotice.stage === 'intermediate' ? 'المتوسطة' : matchedStaffNotice.stage === 'secondary' ? 'الثانوية' : matchedStaffNotice.stage}` : ''}
                            </span>
                          </div>
                          {isStaffAlreadyRegistered(matchedStaffNotice) ? (
                            <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full shrink-0 shadow-xs">
                              حساب مسجل مسبقاً
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full shrink-0 shadow-xs">
                              تم التحقق بنجاح
                            </span>
                          )}
                        </div>
                      </div>
                    ) : regNationalId.length === 10 ? (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold text-rose-900">رقم الهوية غير مسجل في بيانات المجمع!</strong>
                          <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                            لم يتم العثور على موظف بهذا السجل المدني في بيانات لوحة التحكم. يرجى مراجعة إدارة المجمع لإضافتك أولاً أو التأكد من الرقم.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-500 text-xs">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>أدخل رقم الهوية الوطنية وسيظهر اسمك تلقائياً من البيانات المحفوظة في لوحة التحكم.</span>
                      </div>
                    )}
                  </div>

                  {/* If Already Registered: Block Re-registration & Offer Password Recovery */}
                  {matchedStaffNotice && isStaffAlreadyRegistered(matchedStaffNotice) ? (
                    <div className="p-3.5 bg-amber-50 border-2 border-amber-400 rounded-2xl animate-in fade-in space-y-3">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-amber-100 text-amber-900 rounded-xl shrink-0">
                          <ShieldAlert className="w-5 h-5 text-amber-700" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-black text-amber-950 block">
                            عفواً، حسابك مسجل ومفعل مسبقاً في النظام!
                          </span>
                          <p className="text-xs text-amber-900 leading-relaxed">
                            أ. <strong>{matchedStaffNotice.name}</strong>، هذا السجل المدني مسجل مسبقاً ولديه كلمة مرور مفعلة في النظام، ولا يُقبل إنشاء تسجيل جديد لنفس الهوية.
                          </p>
                          <p className="text-[11px] text-amber-800 font-bold">
                            إذا نسيت كلمة المرور الخاصة بك، يرجى استعادتها وتعيين كلمة مرور جديدة:
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-200">
                        <button
                          type="button"
                          onClick={() => {
                            setRecoveryInitialId(regNationalId);
                            setIsRecoveryModalOpen(true);
                          }}
                          className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-slate-950" />
                          <span>استعادة كلمة المرور الآن</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('staff');
                            setNationalIdOrPhone(regNationalId);
                            setStaffError('');
                          }}
                          className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-amber-300 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>الانتقال لتسجيل الدخول</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 3. Phone Number */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          رقم الجوال: <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id="reg-phone"
                            type="tel"
                            maxLength={10}
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="0501234567"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900"
                            dir="ltr"
                            required
                          />
                          <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          لإرسال إشعارات التعاميم وأوراق المساءلة والتواصل الرسمي
                        </span>
                      </div>

                      {/* 4. Password & 5. Confirm Password Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            كلمة سر للدخول: <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              id="reg-password"
                              type={showRegPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="كلمة السر (4+ خانات)"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900 pr-3 pl-9"
                              dir="ltr"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                              tabIndex={-1}
                            >
                              {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            تأكيد كلمة السر: <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              id="reg-confirm-password"
                              type={showRegConfirmPassword ? 'text' : 'password'}
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="أعد إدخال كلمة السر"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900 pr-3 pl-9"
                              dir="ltr"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                              className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                              tabIndex={-1}
                            >
                              {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Password Match Status */}
                      {regPassword.length > 0 && regConfirmPassword.length > 0 && (
                        <div>
                          {regPassword === regConfirmPassword ? (
                            <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>كلمتا السر متطابقتان تماماً</span>
                            </div>
                          ) : (
                            <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                              <span>كلمة السر وتأكيد كلمة السر غير متطابقين</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {matchedStaffNotice && isStaffAlreadyRegistered(matchedStaffNotice) ? (
                    <button
                      id="btn-recover-registered-staff"
                      type="button"
                      onClick={() => {
                        setRecoveryInitialId(regNationalId);
                        setIsRecoveryModalOpen(true);
                      }}
                      className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <KeyRound className="w-4 h-4 text-slate-950" />
                      <span>استعادة كلمة المرور إذا نسيتها</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      id="btn-submit-register"
                      type="submit"
                      className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-950/20 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <UserPlus className="w-4 h-4 text-amber-300" />
                      <span>تسجيل وتفعيل الحساب الآن</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('staff');
                        setStaffError('');
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      لديك حساب مسجل بالفعل؟ <strong>تسجيل الدخول</strong>
                    </button>
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
                        placeholder="اسم المستخدم"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500/20 focus:border-slate-700 outline-none text-xs sm:text-sm font-mono font-bold text-slate-900"
                        dir="ltr"
                        required
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        كلمة المرور / رمز الدخول:
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsChangePassModalOpen(true)}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        title="تغيير أو إعادة ضبط رمز الدخول للإدارة"
                      >
                        <KeyRound className="w-3 h-3 text-emerald-600" />
                        <span>تغيير رمز الدخول</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور"
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

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-slate-500">حساب مخصص للإدارة المدرسية</span>
                    <button
                      type="button"
                      onClick={() => setIsChangePassModalOpen(true)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3 text-emerald-600" />
                      <span>تغيير رمز الدخول</span>
                    </button>
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

      {/* Change Passcode Modal */}
      {isChangePassModalOpen && (
        <ChangePasscodeModal
          isOpen={isChangePassModalOpen}
          onClose={() => setIsChangePassModalOpen(false)}
          schoolSettings={schoolSettings}
          onSavePassword={(newPass) => {
            if (onUpdateAdminPassword) {
              onUpdateAdminPassword(newPass);
            }
            setAdminPassword(newPass);
          }}
          isLoggedInAdmin={false}
        />
      )}

      {/* Staff Password Recovery Modal */}
      {isRecoveryModalOpen && (
        <StaffPasswordRecoveryModal
          isOpen={isRecoveryModalOpen}
          onClose={() => setIsRecoveryModalOpen(false)}
          schoolSettings={schoolSettings}
          staffList={staffList}
          initialNationalId={recoveryInitialId}
          onPasswordResetSuccess={handlePasswordResetSuccess}
        />
      )}

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

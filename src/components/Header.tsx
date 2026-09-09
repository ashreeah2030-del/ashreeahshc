import React from 'react';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  FileCheck, 
  Settings, 
  Smartphone,
  ExternalLink,
  ShieldCheck, 
  GraduationCap,
  LogOut,
  UserCheck,
  Lock,
  User,
  BarChart3,
  KeyRound
} from 'lucide-react';
import { SchoolSettings, StaffMember, DispatchedDocument, AuthSession } from '../types';
import { MoeLogo } from './MoeLogo';
import { CircularProgress } from './CircularProgress';

interface HeaderProps {
  activeTab: 'staff' | 'circulars' | 'inquiries' | 'audits' | 'reports' | 'settings' | 'portal';
  setActiveTab: (tab: 'staff' | 'circulars' | 'inquiries' | 'audits' | 'reports' | 'settings' | 'portal') => void;
  schoolSettings: SchoolSettings;
  staffList: StaffMember[];
  documents: DispatchedDocument[];
  authSession: AuthSession | null;
  onLogout: () => void;
  onOpenTeacherSimulator: () => void;
  onOpenChangePasswordModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  schoolSettings,
  staffList,
  documents,
  authSession,
  onLogout,
  onOpenTeacherSimulator,
  onOpenChangePasswordModal
}) => {
  // Statistics
  const totalStaff = staffList.length;
  const teachersCount = staffList.filter(s => s.role === 'teacher').length;
  const adminsCount = staffList.filter(s => s.role !== 'teacher').length;
  
  const circularsCount = documents.filter(d => d.type === 'circular').length;
  const inquiriesCount = documents.filter(d => d.type === 'inquiry').length;
  
  // Total signatures required across all documents vs signatures completed
  let totalRequiredSignatures = 0;
  let totalCompletedSignatures = 0;
  documents.forEach(doc => {
    totalRequiredSignatures += doc.targetStaffIds.length;
    totalCompletedSignatures += Object.keys(doc.signatures).length;
  });

  const completionRate = totalRequiredSignatures > 0 
    ? Math.round((totalCompletedSignatures / totalRequiredSignatures) * 100)
    : 100;

  const isAdmin = authSession?.role === 'admin';
  const isStaff = authSession?.role === 'staff';

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-30">
      {/* Top Ministry Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-slate-100 px-4 py-2 border-b border-emerald-800/40">
        <div className="w-full px-2 sm:px-4 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <MoeLogo variant="white" size="sm" className="h-6 w-auto opacity-95 hover:opacity-100 transition-opacity" />
            <span className="font-bold tracking-wide text-white">المملكة العربية السعودية</span>
            <span className="text-emerald-500/80">•</span>
            <span className="text-slate-300 font-medium">وزارة التعليم</span>
            <span className="text-emerald-500/80">•</span>
            <span className="text-emerald-200 font-semibold">{schoolSettings.educationDepartment}</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* User Session Info */}
            {authSession && (
              <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-700 text-xs">
                {isAdmin ? (
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>إدارة المجمع</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <User className="w-3.5 h-3.5" />
                    <span>{authSession.staffMember?.name}</span>
                  </div>
                )}
                
                <button
                  onClick={onLogout}
                  className="mr-2 text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold text-[11px] transition-colors cursor-pointer border-r border-slate-700 pr-2"
                  title="تسجيل الخروج للعودة إلى شاشة تسجيل الدخول الموحد"
                >
                  <LogOut className="w-3 h-3" />
                  <span>خروج</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-700/50 text-emerald-200">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-300/90 font-medium">جوال الواتساب:</span>
              <span className="font-mono font-bold text-white text-xs dir-ltr">{schoolSettings.adminPhone}</span>
            </div>

            {isAdmin && onOpenChangePasswordModal && (
              <button
                type="button"
                id="header-change-passcode-btn"
                onClick={onOpenChangePasswordModal}
                className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-400/40 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:border-amber-400"
                title="تغيير رمز الدخول السري لإدارة المنظومة"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>تغيير رمز الدخول</span>
              </button>
            )}

            {isAdmin && (
              <button
                id="simulate-teacher-view-btn"
                onClick={onOpenTeacherSimulator}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg transition-all shadow-xs cursor-pointer text-xs"
                title="معاينة شاشة المعلم وتجربة التوقيع بيدك"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>محاكي شاشة المعلم</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Brand & Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-3.5 sm:py-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Logo & School Title */}
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-2xl bg-white border border-slate-200/90 border-r-4 border-r-emerald-600 shadow-xs flex items-center justify-center shrink-0 ring-2 ring-emerald-600/20 hover:shadow-sm transition-shadow">
              <MoeLogo size="lg" className="h-12 w-auto" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {schoolSettings.schoolName}
                </h1>
                <span className="bg-emerald-950 text-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-md border border-emerald-700/60 shadow-2xs border-r-2 border-r-emerald-400">
                  منظومة التواصل
                </span>
                {isStaff && (
                  <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-md border border-amber-300 border-r-2 border-r-amber-500">
                    بوابة الموظف الخاصة
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 flex items-center gap-2 flex-wrap">
                <span>المنظومة الرسمية للتعاميم وأوراق المساءلة والتوقيع بالعلم عبر الواتس أب</span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-900 bg-emerald-50 font-bold px-2.5 py-0.5 rounded-md border border-emerald-200/80 border-r-2 border-r-emerald-600 text-xs">
                  <span>إشراف إدارة المجمع:</span>
                  <span className="text-emerald-950 font-black">{schoolSettings.principalName}</span>
                </span>
              </p>
            </div>
          </div>

          {/* Quick Stats Grid (Admin only) */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2.5 text-xs w-full lg:w-auto justify-start lg:justify-end">
              <div className="bg-slate-50 border border-slate-200/90 border-r-4 border-r-emerald-600 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] font-medium">المنسوبين</span>
                  <span className="font-extrabold text-slate-900 text-xs">{totalStaff}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/90 border-r-4 border-r-teal-600 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-blue-100/80 text-blue-800 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] font-medium">التعاميم</span>
                  <span className="font-extrabold text-slate-900 text-xs">{circularsCount}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/90 border-r-4 border-r-amber-500 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-amber-100/80 text-amber-800 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] font-medium">المساءلات</span>
                  <span className="font-extrabold text-slate-900 text-xs">{inquiriesCount}</span>
                </div>
              </div>

              <div className="bg-emerald-50/90 border border-emerald-200/90 border-r-4 border-r-emerald-700 rounded-xl px-2.5 py-1.5 flex items-center gap-2.5 shadow-2xs">
                <CircularProgress
                  percentage={completionRate}
                  size={36}
                  strokeWidth={3.5}
                  textSizeClass="text-[9px] font-black"
                />
                <div>
                  <span className="text-emerald-800 block text-[9px] font-medium">نسبة التوقيع</span>
                  <span className="font-extrabold text-emerald-950 text-xs">{completionRate}% إجمالي</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation (Only shown for Admin or Portal) */}
        {isAdmin && (
          <nav className="flex items-center gap-1.5 sm:gap-2 mt-4 pt-2.5 border-t border-slate-100 overflow-x-auto no-scrollbar">
            <button
              id="tab-staff-directory"
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-700/50'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>سجل الموظفين (المعلمين والإداريين)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'staff' ? 'bg-emerald-950 text-white' : 'bg-slate-200 text-slate-700 font-bold'
              }`}>
                {totalStaff}
              </span>
            </button>

            <button
              id="tab-circulars"
              onClick={() => setActiveTab('circulars')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'circulars'
                  ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-700/50'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>التعاميم الرسمية والتوقيع</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'circulars' ? 'bg-emerald-950 text-white' : 'bg-slate-200 text-slate-700 font-bold'
              }`}>
                {circularsCount}
              </span>
            </button>

            <button
              id="tab-inquiries"
              onClick={() => setActiveTab('inquiries')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'inquiries'
                  ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-700/50'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>أوراق المساءلة والإفادة</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'inquiries' ? 'bg-emerald-950 text-white' : 'bg-slate-200 text-slate-700 font-bold'
              }`}>
                {inquiriesCount}
              </span>
            </button>

            <button
              id="tab-audits"
              onClick={() => setActiveTab('audits')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'audits'
                  ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-700/50'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>كشوفات التواقيع والتدقيق</span>
            </button>

            <button
              id="tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-700/50'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>التقارير والرسوم البيانية</span>
            </button>

            <button
              id="tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-700/50'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>إعدادات المجمع وجوال المدرسة</span>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

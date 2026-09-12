import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MessageSquare, 
  Phone, 
  Download, 
  Upload, 
  Check, 
  X,
  UserCheck,
  GraduationCap,
  Briefcase,
  KeyRound,
  RotateCcw,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Sparkles,
  ShieldCheck,
  Laptop,
  Users,
  CheckSquare,
  Square,
  Send
} from 'lucide-react';
import { StaffMember, SchoolStage, StaffRole, SchoolSettings } from '../types';
import { formatSaudiPhone, formatDisplayPhone } from '../utils/whatsapp';
import { NoorImportModal } from './NoorImportModal';
import { BulkMessageModal } from './BulkMessageModal';
import { downloadNoorExcelTemplate } from '../utils/noorParser';
import { maskNationalId } from '../utils/formatters';
import { getTeacherBadge } from '../utils/badges';

interface StaffDirectoryProps {
  staffList: StaffMember[];
  schoolSettings?: SchoolSettings;
  onAddStaff: (staff: Omit<StaffMember, 'id'>) => void;
  onUpdateStaff: (staff: StaffMember) => void;
  onDeleteStaff: (staffId: string) => void;
  onBulkImport: (staffMembers: Omit<StaffMember, 'id'>[], updateExisting?: boolean) => void;
  onClearAllStaff?: () => void;
}

export const StaffDirectory: React.FC<StaffDirectoryProps> = ({
  staffList,
  schoolSettings,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onBulkImport,
  onClearAllStaff,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'admin' | 'student_affairs_vice_principal' | 'computer_lab_prep'>('all');
  const [stageFilter, setStageFilter] = useState<SchoolStage | 'all'>('all');
  
  // Selection state for multi-messaging and actions
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNoorModalOpen, setIsNoorModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nationalId: '',
    phone: '',
    role: 'teacher' as StaffRole,
    roleTitle: 'معلم',
    stage: 'all' as SchoolStage,
    subject: '',
    notes: '',
    pin: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => {
      const matchesSearch = 
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.nationalId.includes(searchQuery) ||
        staff.phone.includes(searchQuery) ||
        staff.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.subject && staff.subject.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = 
        roleFilter === 'all' ? true :
        roleFilter === 'teacher' ? staff.role === 'teacher' :
        roleFilter === 'student_affairs_vice_principal' ? staff.role === 'student_affairs_vice_principal' :
        roleFilter === 'computer_lab_prep' ? staff.role === 'computer_lab_prep' :
        staff.role !== 'teacher';

      const matchesStage = 
        stageFilter === 'all' ? true :
        staff.stage === stageFilter || staff.stage === 'all';

      return matchesSearch && matchesRole && matchesStage;
    });
  }, [staffList, searchQuery, roleFilter, stageFilter]);

  const openAddModal = () => {
    setFormData({
      name: '',
      nationalId: '',
      phone: '05',
      role: 'teacher',
      roleTitle: 'معلم',
      stage: 'all',
      subject: '',
      notes: '',
      pin: '',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const openEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      nationalId: staff.nationalId,
      phone: staff.phone,
      role: staff.role,
      roleTitle: staff.roleTitle,
      stage: staff.stage,
      subject: staff.subject || '',
      notes: staff.notes || '',
      pin: staff.pin || staff.nationalId.slice(-4),
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().split(' ').length < 2) {
      errors.name = 'الرجاء إدخال الاسم الرباعي أو الثلاثي بشكل صحيح';
    }

    if (!formData.nationalId.trim()) {
      errors.nationalId = 'رقم السجل المدني مطلوب';
    } else if (!/^\d{10}$/.test(formData.nationalId.trim())) {
      errors.nationalId = 'يجب أن يتكون السجل المدني من 10 أرقام بالضبط';
    }

    const cleanPhone = (formData.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      errors.phone = 'الرجاء إدخال رقم جوال صحيح (مثال: 0501234567)';
    }

    if (!formData.roleTitle.trim()) {
      errors.roleTitle = 'المسمى الوظيفي مطلوب';
    }

    if (formData.pin && formData.pin.trim().length < 4) {
      errors.pin = 'يجب ألا يقل رمز الدخول السري (PIN) عن 4 أرقام';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalPin = formData.pin.trim() || formData.nationalId.trim().slice(-4);

    if (editingStaff) {
      onUpdateStaff({
        ...editingStaff,
        name: formData.name.trim(),
        nationalId: formData.nationalId.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        roleTitle: formData.roleTitle.trim(),
        stage: formData.stage,
        subject: formData.subject.trim(),
        notes: formData.notes.trim(),
        pin: finalPin,
      });
      setEditingStaff(null);
    } else {
      onAddStaff({
        name: formData.name.trim(),
        nationalId: formData.nationalId.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        roleTitle: formData.roleTitle.trim(),
        stage: formData.stage,
        subject: formData.subject.trim(),
        notes: formData.notes.trim(),
        active: true,
        pin: finalPin,
      });
      setIsAddModalOpen(false);
    }
  };

  // Bulk Import CSV or Tabulated Text
  const handleProcessImport = () => {
    if (!importText.trim()) return;

    const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedStaff: Omit<StaffMember, 'id'>[] = [];
    let count = 0;

    for (const line of lines) {
      // Split by comma, tab, or pipe
      const parts = line.split(/[,;\t|]+/).map(p => p.trim());
      if (parts.length >= 3) {
        // Expected format: Name, NationalID, Phone, RoleTitle, Stage, Subject
        const name = parts[0];
        const nationalId = (parts[1] || '').replace(/[^0-9]/g, '');
        const phone = (parts[2] || '').replace(/[^0-9+]/g, '');
        const roleTitle = parts[3] || 'معلم';
        const stageStr = parts[4] || 'all';
        const subject = parts[5] || '';

        let stage: SchoolStage = 'all';
        if (stageStr.includes('ابتدائ')) stage = 'elementary';
        else if (stageStr.includes('متوسط')) stage = 'intermediate';
        else if (stageStr.includes('ثانوي')) stage = 'secondary';

        const isTeacher = !roleTitle.includes('إداري') && !roleTitle.includes('وكيل') && !roleTitle.includes('مدير') && !roleTitle.includes('سكرتير');

        if (name && nationalId.length === 10) {
          parsedStaff.push({
            name,
            nationalId,
            phone: phone.startsWith('05') ? phone : `0${phone}`,
            role: isTeacher ? 'teacher' : 'admin',
            roleTitle,
            stage,
            subject,
            active: true,
          });
          count++;
        }
      }
    }

    if (parsedStaff.length > 0) {
      onBulkImport(parsedStaff);
      setImportNotice(`تم استيراد ${count} موظفاً بنجاح وإضافتهم إلى قاعدة بيانات مجمع الشريعة!`);
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportText('');
        setImportNotice(null);
      }, 1500);
    } else {
      setImportNotice('لم يتم العثور على أسطر صالحة. يرجى التأكد من الصيغة: الاسم, السجل المدني (10 أرقام), رقم الجوال, المسمى الوظيفي');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['الاسم', 'السجل المدني', 'رقم الجوال', 'الوظيفة', 'المرحلة', 'المادة والتخصص', 'ملاحظات'];
    const rows = staffList.map(s => [
      `"${s.name}"`,
      `"${s.nationalId}"`,
      `"${s.phone}"`,
      `"${s.roleTitle}"`,
      `"${s.stage === 'elementary' ? 'ابتدائي' : s.stage === 'intermediate' ? 'متوسط' : s.stage === 'secondary' ? 'ثانوي' : 'عام'}"`,
      `"${s.subject || ''}"`,
      `"${s.notes || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `سجل_منسوبي_مجمع_الشريعة_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct WhatsApp chat
  const openDirectWhatsApp = (phone: string, name: string) => {
    const cleanPhone = formatSaudiPhone(phone);
    const text = encodeURIComponent(`السلام عليكم ورحمة الله وبركاته الزميل العزيز ${name}، تحية طيبة من إدارة مجمع الشريعة التعليمي للبنين.`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Multi-Selection Handlers
  const toggleSelectStaff = (id: string) => {
    setSelectedStaffIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (filteredStaff.length > 0 && filteredStaff.every(s => selectedStaffIds.has(s.id))) {
      setSelectedStaffIds(prev => {
        const next = new Set(prev);
        filteredStaff.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedStaffIds(prev => {
        const next = new Set(prev);
        filteredStaff.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const handleSelectAllTeachers = () => {
    setSelectedStaffIds(new Set(staffList.filter(s => s.role === 'teacher').map(s => s.id)));
  };

  const handleSelectAllStaff = () => {
    setSelectedStaffIds(new Set(staffList.map(s => s.id)));
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast / Notice */}
      {feedbackNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-emerald-900 font-bold shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Noor Excel Import Action Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/60">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20 shrink-0 shadow-inner">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white">
                استيراد كشف شاغلي الوظائف التعليمية والإدارية من نظام نور
              </h3>
              <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                Excel (.xlsx / .xls)
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-1">
              مجمع الشريعة التعليمي للبنين (رمز 432109) • استورد بيانات المعلمين والإداريين مباشرة من ملف إكسل المصدر من نور.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            id="quick-fetch-noor-btn"
            onClick={() => setIsNoorModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs sm:text-sm font-black px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="w-4 h-4 text-slate-950" />
            <span>استيراد ملف إكسل نور</span>
          </button>

          <button
            type="button"
            onClick={downloadNoorExcelTemplate}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/15"
            title="تحميل نموذج إكسل جاهز للتعبئة متوافق مع نظام نور"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" />
            <span>تحميل نموذج إكسل</span>
          </button>
        </div>
      </div>

      {/* Top Action & Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="staff-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، رقم السجل المدني (10 أرقام)، الجوال، أو التخصص..."
              className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              id="bulk-message-btn"
              onClick={() => setIsBulkMessageModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer border border-emerald-500 hover:shadow-md"
              title="إرسال رسائل واتساب للجميع أو للمحددين"
            >
              <MessageSquare className="w-4 h-4" />
              <span>إرسال رسائل للكل / المحددين</span>
              {selectedStaffIds.size > 0 && (
                <span className="bg-white text-emerald-800 text-[11px] font-black px-1.5 py-0.2 rounded-full">
                  {selectedStaffIds.size}
                </span>
              )}
            </button>

            <button
              id="bulk-import-noor-btn"
              onClick={() => setIsNoorModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer border border-emerald-700 hover:shadow-md"
              title="استيراد بيانات شاغلي الوظائف التعليمية والإدارية من ملف إكسل نظام نور"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>استيراد ملف إكسل نور</span>
            </button>

            <button
              id="add-new-staff-btn"
              onClick={openAddModal}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف فردي</span>
            </button>

            <button
              id="export-staff-btn"
              onClick={handleExportCSV}
              disabled={staffList.length === 0}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              title="تصدير كشف الموظفين كملف Excel"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>تصدير Excel</span>
            </button>

            {staffList.length > 0 && onClearAllStaff && (
              <button
                id="clear-all-staff-btn"
                onClick={() => setShowClearConfirmModal(true)}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                title="تفريغ وحذف جميع الموظفين من السجل"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>تفريغ السجل (حذف الكل)</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500">تصفية حسب الدور:</span>
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                roleFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({staffList.length})
            </button>
            <button
              onClick={() => setRoleFilter('teacher')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                roleFilter === 'teacher' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المعلمون ({staffList.filter(s => s.role === 'teacher').length})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                roleFilter === 'admin' ? 'bg-white text-blue-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الهيئة الإدارية ({staffList.filter(s => s.role !== 'teacher').length})
            </button>
            {staffList.some(s => s.role === 'student_affairs_vice_principal') && (
              <button
                onClick={() => setRoleFilter('student_affairs_vice_principal')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  roleFilter === 'student_affairs_vice_principal' ? 'bg-white text-purple-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                وكيل شؤون الطلاب ({staffList.filter(s => s.role === 'student_affairs_vice_principal').length})
              </button>
            )}
            {staffList.some(s => s.role === 'computer_lab_prep') && (
              <button
                onClick={() => setRoleFilter('computer_lab_prep')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  roleFilter === 'computer_lab_prep' ? 'bg-white text-sky-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                محضر الحاسب ({staffList.filter(s => s.role === 'computer_lab_prep').length})
              </button>
            )}
          </div>

          <span className="font-semibold text-slate-500 mr-2">المرحلة:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['all', 'elementary', 'intermediate', 'secondary'] as const).map(stage => (
              <button
                key={stage}
                onClick={() => setStageFilter(stage)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  stageFilter === stage ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {stage === 'all' ? 'جميع المراحل' : stage === 'elementary' ? 'الابتدائية' : stage === 'intermediate' ? 'المتوسطة' : 'الثانوية'}
              </button>
            ))}
          </div>

          <div className="mr-auto text-slate-400">
            عرض <span className="font-bold text-slate-700">{filteredStaff.length}</span> من أصل {staffList.length}
          </div>
        </div>
      </div>

      {/* Multi-Select Floating Action Bar */}
      {selectedStaffIds.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3.5 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {selectedStaffIds.size}
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-emerald-900 block">
                تم تحديد {selectedStaffIds.size} من منسوبي المجمع
              </span>
              <span className="text-[11px] text-emerald-700">
                يمكنك الآن إرسال رسائل واتساب جماعية ومخصصة للمحددين بنقرة واحدة
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="send-selected-message-btn"
              onClick={() => setIsBulkMessageModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>إرسال رسالة واتساب للمحددين ({selectedStaffIds.size})</span>
            </button>
            <button
              type="button"
              onClick={handleSelectAllTeachers}
              className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              تحديد جميع المعلمين ({staffList.filter(s => s.role === 'teacher').length})
            </button>
            <button
              type="button"
              onClick={handleSelectAllStaff}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              تحديد الكل ({staffList.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStaffIds(new Set())}
              className="text-rose-700 hover:bg-rose-100 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Staff Table / Cards / Empty State */}
      {staffList.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-emerald-300 p-8 sm:p-14 text-center shadow-xs">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <FileSpreadsheet className="w-10 h-10" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
            سجل الموظفين فارغ - بانتظار استيراد ملف إكسل من نظام نور
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-6 leading-relaxed">
            تم تفريغ كافة الموظفين غير المرتبطين بالمجمع. يمكنك الآن استيراد كشف شاغلي الوظائف التعليمية والإدارية الفعلي لمجمع الشريعة التعليمي للبنين مباشرة عبر ملف Excel (.xlsx أو .xls) المصدّر من نظام نور.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsNoorModalOpen(true)}
              className="flex items-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
              <span>استيراد كشف نور من ملف Excel (.xlsx / .xls)</span>
            </button>

            <button
              onClick={downloadNoorExcelTemplate}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-bold px-5 py-3.5 rounded-2xl transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>تحميل نموذج إكسل نور فارغ</span>
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold px-5 py-3.5 rounded-2xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف فردي يدوياً</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredStaff.length > 0 && filteredStaff.every(s => selectedStaffIds.has(s.id))}
                      onChange={toggleSelectAllFiltered}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      title="تحديد أو إلغاء تحديد كل المعروضين"
                    />
                  </th>
                  <th className="py-3.5 px-3">#</th>
                  <th className="py-3.5 px-4">اسم الموظف الرباعي</th>
                  <th className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span>الهوية الوطنية</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium" title="رقم الهوية محمي ومخفي افتراضياً ما عدا آخر 4 أرقام">
                        محمية
                      </span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4">رقم الجوال</th>
                  <th className="py-3.5 px-4">المسمى الوظيفي / التخصص</th>
                  <th className="py-3.5 px-4">المرحلة</th>
                  <th className="py-3.5 px-4">نقاط التميز والشارة</th>
                  <th className="py-3.5 px-4 text-center">التواصل والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">لم يتم العثور على موظفين يطابقون البحث</p>
                      <p className="text-xs text-slate-400 mt-1">تأكد من كتابة الاسم أو رقم السجل المدني بشكل صحيح</p>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff, idx) => {
                    const isTeacher = staff.role === 'teacher';
                    const isSelected = selectedStaffIds.has(staff.id);
                    const badge = getTeacherBadge(staff.points || 0);
                    return (
                      <tr 
                        key={staff.id} 
                        className={`transition-colors ${
                          isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStaff(staff.id)}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            title={`تحديد ${staff.name}`}
                          />
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-400 text-xs">
                          {idx + 1}
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isTeacher 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : staff.role === 'student_affairs_vice_principal'
                                ? 'bg-purple-100 text-purple-800'
                                : staff.role === 'computer_lab_prep'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isTeacher ? (
                                <GraduationCap className="w-4 h-4" />
                              ) : staff.role === 'computer_lab_prep' ? (
                                <Laptop className="w-4 h-4" />
                              ) : staff.role === 'student_affairs_vice_principal' ? (
                                <Users className="w-4 h-4" />
                              ) : (
                                <Briefcase className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{staff.name}</span>
                              {staff.notes && (
                                <span className="text-[11px] text-slate-400 line-clamp-1">{staff.notes}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* National ID (Masked) */}
                        <td className="py-3.5 px-4">
                          <span 
                            className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md tracking-wider border border-slate-200/70 shadow-2xs inline-block" 
                            dir="ltr"
                          >
                            {maskNationalId(staff.nationalId)}
                          </span>
                        </td>

                        {/* Mobile */}
                        <td className="py-3.5 px-4">
                          <a 
                            href={`tel:${staff.phone}`}
                            className="font-mono text-emerald-700 font-semibold hover:underline flex items-center gap-1.5"
                            dir="ltr"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600 inline" />
                            {formatDisplayPhone(staff.phone)}
                          </a>
                        </td>

                        {/* Role & Subject */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isTeacher 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : staff.role === 'student_affairs_vice_principal'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200 font-bold'
                              : staff.role === 'computer_lab_prep'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200 font-bold'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {staff.roleTitle}
                          </span>
                          {staff.subject && (
                            <span className="block text-[11px] text-slate-500 mt-0.5 font-medium">
                              {staff.subject}
                            </span>
                          )}
                        </td>

                        {/* Stage */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                            {staff.stage === 'elementary' ? 'الابتدائية' :
                             staff.stage === 'intermediate' ? 'المتوسطة' :
                             staff.stage === 'secondary' ? 'الثانوية' : 'عام / المجمع'}
                          </span>
                        </td>

                        {/* Points & Badge */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                              {staff.points || 0} نقطة
                            </span>
                            {badge.type !== 'none' ? (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-bold ${badge.pillClass}`}>
                                <span>{badge.icon}</span>
                                <span>{badge.name}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                متبقي {badge.remainingToNext} للشارة المثالية
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Direct WhatsApp Message */}
                            <button
                              onClick={() => openDirectWhatsApp(staff.phone, staff.name)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                              title={`محادثة واتساب مباشرة مع ${staff.name}`}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(staff)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                              title="تعديل البيانات"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              id={`delete-staff-${staff.id}`}
                              onClick={() => setStaffToDelete(staff)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                              title={`حذف الموظف (${staff.name})`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {(isAddModalOpen || editingStaff) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 border-r-6 border-r-emerald-600 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStaff ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد بمجمع الشريعة'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStaff(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="mt-4 space-y-4 text-xs sm:text-sm">
              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الرباعي للموظف *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: عبدالله بن محمد بن علي الشريفي"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.name}</p>}
              </div>

              {/* National ID & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السجل المدني (الوطني) *</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="10 أرقام (مثال: 1083921029)"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                  {formData.nationalId && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>العرض المحمي:</span>
                      <strong className="font-mono font-bold text-emerald-800" dir="ltr">
                        {maskNationalId(formData.nationalId)}
                      </strong>
                    </div>
                  )}
                  {formErrors.nationalId && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.nationalId}</p>}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الجوال (للواتس أب) *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="05XXXXXXXX"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    dir="ltr"
                  />
                  {formErrors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.phone}</p>}
                </div>
              </div>

              {/* Role & Role Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الفئة الوظيفية *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as StaffRole;
                      let defaultTitle = formData.roleTitle;
                      if (newRole === 'teacher') defaultTitle = 'معلم';
                      else if (newRole === 'vice_principal') defaultTitle = 'وكيل شؤون المعلمين والموظفين';
                      else if (newRole === 'student_affairs_vice_principal') defaultTitle = 'وكيل شؤون الطلاب';
                      else if (newRole === 'computer_lab_prep') defaultTitle = 'محضر الحاسب الآلي';
                      else if (newRole === 'counselor') defaultTitle = 'موجه طلابي';
                      else if (newRole === 'activity_leader') defaultTitle = 'رائد النشاط';
                      else if (newRole === 'lab_prep') defaultTitle = 'محضر مختبر علوم';
                      else if (newRole === 'admin') defaultTitle = 'إداري شؤون الموظفين';
                      else if (newRole === 'principal') defaultTitle = 'مدير المجمع';
                      setFormData({ ...formData, role: newRole, roleTitle: defaultTitle });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  >
                    <option value="teacher">معلم</option>
                    <option value="vice_principal">وكيل شؤون معلمين / وكيل مجمع</option>
                    <option value="student_affairs_vice_principal">وكيل شؤون الطلاب</option>
                    <option value="computer_lab_prep">محضر الحاسب الآلي</option>
                    <option value="counselor">موجه طلابي</option>
                    <option value="activity_leader">رائد نشاط</option>
                    <option value="lab_prep">محضر مختبر علوم</option>
                    <option value="admin">إداري / سكرتير</option>
                    <option value="principal">مدير المجمع</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المسمى الوظيفي الدقيق *</label>
                  <input
                    type="text"
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    placeholder="مثال: معلم لغة عربية"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                  {formErrors.roleTitle && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.roleTitle}</p>}
                </div>
              </div>

              {/* Stage & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المرحلة الدراسية بالمجمع</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as SchoolStage })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  >
                    <option value="all">عام / كامل المجمع</option>
                    <option value="elementary">المرحلة الابتدائية</option>
                    <option value="intermediate">المرحلة المتوسطة</option>
                    <option value="secondary">المرحلة الثانوية</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">التخصص أو المادة</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="مثال: رياضيات، فيزياء، لغتي..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية (اختياري)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="مثال: منسق الجودة، مسؤول منصة مدرستي..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>

              {/* Staff Access PIN */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                    <span>رمز الدخول السري للموظف (PIN للمنظومة)</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={20}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="أدخل رمز الدخول السري"
                    className="w-full px-3 py-2 font-mono font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm dir-ltr text-right"
                  />
                  {formData.nationalId && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pin: formData.nationalId.slice(-4) })}
                      className="shrink-0 px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      title="إعادة تعيين الرمز السري"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>إعادة تعيين</span>
                    </button>
                  )}
                </div>
                {formErrors.pin && <p className="text-red-500 text-xs font-medium">{formErrors.pin}</p>}
                <p className="text-[11px] text-slate-500 leading-normal">
                  يستخدمه المعلم أو الإداري لتسجيل الدخول إلى بوابته الخاصة واستعراض التعاميم وتوقيع أوراق المساءلة.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
                {editingStaff ? (
                  <button
                    type="button"
                    onClick={() => {
                      const staff = editingStaff;
                      setIsAddModalOpen(false);
                      setEditingStaff(null);
                      setStaffToDelete(staff);
                    }}
                    className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الموظف</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingStaff(null);
                    }}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingStaff ? 'حفظ التعديلات' : 'إضافة الموظف'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 border-r-6 border-r-emerald-600 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">استيراد جماعي لمنسوبي مجمع الشريعة</h3>
                <p className="text-xs text-slate-500 mt-0.5">الصق قائمة الأسماء مع السجلات والجوالات دفعة واحدة</p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs sm:text-sm">
              <div className="bg-emerald-50 border border-emerald-200 border-r-4 border-r-emerald-600 rounded-xl p-3 text-emerald-900 text-xs">
                <p className="font-bold mb-1">الصيغة المطلوبة لكل سطر (مفصولة بفواصل أو مسافات جدولة):</p>
                <p className="font-mono text-[11px] text-emerald-800 dir-ltr text-right">
                  الاسم الرباعي , السجل المدني (10 أرقام) , رقم الجوال , المسمى الوظيفي , المرحلة , المادة
                </p>
                <p className="text-[11px] text-emerald-700 mt-1">
                  مثال: فهد بن سالم الزهراني, 1083921029, 0501122334, معلم لغة عربية, ثانوي, لغة عربية
                </p>
              </div>

              <textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="الصق الأسطر هنا..."
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />

              {importNotice && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
                  {importNotice}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>معالجة وإضافة الموظفين</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Noor System Advanced Import Modal */}
      <NoorImportModal
        isOpen={isNoorModalOpen}
        onClose={() => setIsNoorModalOpen(false)}
        existingStaffList={staffList}
        onImportComplete={(imported, updateExisting) => {
          onBulkImport(imported, updateExisting);
        }}
      />

      {/* Delete Staff Confirmation Modal */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 border-r-6 border-r-rose-600 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  تأكيد حذف الموظف من السجل
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  أنت على وشك حذف سجل هذا الموظف من قاعدة بيانات المجمع
                </p>
              </div>
            </div>

            {/* Staff Details Card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">الاسم الرباعي:</span>
                <span className="font-bold text-slate-900">{staffToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">السجل المدني (الوطني):</span>
                <span className="font-mono font-bold text-slate-800" dir="ltr">{maskNationalId(staffToDelete.nationalId)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">المسمى الوظيفي:</span>
                <span className="font-semibold text-emerald-800">{staffToDelete.roleTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">المرحلة التعليمية:</span>
                <span className="font-semibold text-slate-700">
                  {staffToDelete.stage === 'elementary' ? 'المرحلة الابتدائية' :
                   staffToDelete.stage === 'intermediate' ? 'المرحلة المتوسطة' :
                   staffToDelete.stage === 'secondary' ? 'المرحلة الثانوية' : 'عام / كامل المجمع'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">رقم الجوال:</span>
                <span className="font-mono text-slate-700 dir-ltr">{formatDisplayPhone(staffToDelete.phone)}</span>
              </div>
            </div>

            {/* Warning Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>تنبيه إداري:</strong> سيتم استبعاد الموظف من قائمة الكشوف وتوزيع التعاميم الجديدة. التوقيعات السابقة المحفوظة بأرشيف المجمع ستبقى موثقة قانونياً باسمه.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs sm:text-sm cursor-pointer"
              >
                إلغاء وتراجع
              </button>
              <button
                type="button"
                id="confirm-delete-staff-btn"
                onClick={() => {
                  const deletedName = staffToDelete.name;
                  onDeleteStaff(staffToDelete.id);
                  setStaffToDelete(null);
                  setFeedbackNotice(`تم حذف الموظف (${deletedName}) من سجلات مجمع الشريعة بنجاح.`);
                  setTimeout(() => setFeedbackNotice(null), 5000);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الحذف نهائياً</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Staff Confirmation Modal */}
      {showClearConfirmModal && onClearAllStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 border-r-6 border-r-rose-600 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  تفريغ وحذف جميع سجلات الموظفين
                </h3>
                <p className="text-xs text-rose-700 font-semibold mt-0.5">
                  إجراء إداري لتصفير القائمة تمهيداً لاستيراد الكشف الجديد
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              هل أنت متأكد من رغبتك في حذف كافة الموظفين ({staffList.length} موظفاً) من السجل بالكامل؟
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                سيتم مسح الأسماء الحالية بالكامل ليتسنى لك استيراد كشف منسوبي مجمع الشريعة التعليمي للبنين عبر ملف إكسل نظام نور.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs sm:text-sm cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                id="confirm-clear-all-staff-btn"
                onClick={() => {
                  onClearAllStaff();
                  setShowClearConfirmModal(false);
                  setFeedbackNotice('تم تفريغ وحذف جميع سجلات الموظفين بنجاح. السجل الآن جاهز لاستيراد ملف نور.');
                  setTimeout(() => setFeedbackNotice(null), 5000);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد تفريغ السجل بالكامل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk WhatsApp Messaging Modal */}
      <BulkMessageModal
        isOpen={isBulkMessageModalOpen}
        onClose={() => setIsBulkMessageModalOpen(false)}
        staffList={staffList}
        initialSelectedStaffIds={Array.from(selectedStaffIds)}
        schoolSettings={schoolSettings}
      />
    </div>
  );
};

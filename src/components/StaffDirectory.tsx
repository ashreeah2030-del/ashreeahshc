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
  RotateCcw
} from 'lucide-react';
import { StaffMember, SchoolStage, StaffRole } from '../types';
import { formatSaudiPhone, formatDisplayPhone } from '../utils/whatsapp';

interface StaffDirectoryProps {
  staffList: StaffMember[];
  onAddStaff: (staff: Omit<StaffMember, 'id'>) => void;
  onUpdateStaff: (staff: StaffMember) => void;
  onDeleteStaff: (staffId: string) => void;
  onBulkImport: (staffMembers: Omit<StaffMember, 'id'>[]) => void;
}

export const StaffDirectory: React.FC<StaffDirectoryProps> = ({
  staffList,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onBulkImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'admin'>('all');
  const [stageFilter, setStageFilter] = useState<SchoolStage | 'all'>('all');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
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
        const nationalId = parts[1].replace(/[^0-9]/g, '');
        const phone = parts[2].replace(/[^0-9+]/g, '');
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

  return (
    <div className="space-y-6">
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
              id="add-new-staff-btn"
              onClick={openAddModal}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>

            <button
              id="bulk-import-staff-btn"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
              title="استيراد جماعي لقائمة المعلمين والإداريين"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>استيراد جماعي</span>
            </button>

            <button
              id="export-staff-btn"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
              title="تصدير كشف الموظفين كملف Excel"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500">تصفية حسب الدور:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
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

      {/* Staff Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">اسم الموظف الرباعي</th>
                <th className="py-3.5 px-4">السجل المدني (الوطني)</th>
                <th className="py-3.5 px-4">رقم الجوال</th>
                <th className="py-3.5 px-4">المسمى الوظيفي / التخصص</th>
                <th className="py-3.5 px-4">المرحلة</th>
                <th className="py-3.5 px-4 text-center">التواصل والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">لم يتم العثور على موظفين يطابقون البحث</p>
                    <p className="text-xs text-slate-400 mt-1">تأكد من كتابة الاسم أو رقم السجل المدني بشكل صحيح</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff, idx) => {
                  const isTeacher = staff.role === 'teacher';
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isTeacher 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isTeacher ? <GraduationCap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{staff.name}</span>
                            {staff.notes && (
                              <span className="text-[11px] text-slate-400 line-clamp-1">{staff.notes}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* National ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md tracking-wider border border-slate-200/60">
                          {staff.nationalId}
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
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الموظف (${staff.name}) من سجل المجمع؟`)) {
                                onDeleteStaff(staff.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                            title="حذف من السجل"
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
                      else if (newRole === 'vice_principal') defaultTitle = 'وكيل المجمع';
                      else if (newRole === 'counselor') defaultTitle = 'موجه طلابي';
                      else if (newRole === 'activity_leader') defaultTitle = 'رائد النشاط';
                      else if (newRole === 'lab_prep') defaultTitle = 'محضر مختبر';
                      else if (newRole === 'admin') defaultTitle = 'إداري شؤون الموظفين';
                      setFormData({ ...formData, role: newRole, roleTitle: defaultTitle });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  >
                    <option value="teacher">معلم</option>
                    <option value="vice_principal">وكيل شؤون معلمين / وكيل مرحلة</option>
                    <option value="counselor">موجه طلابي</option>
                    <option value="activity_leader">رائد نشاط</option>
                    <option value="lab_prep">محضر مختبر</option>
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
                  <span className="text-[10px] text-slate-500 font-medium">
                    افتراضياً: آخر 4 أرقام من السجل المدني
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9a-zA-Z]/g, '') })}
                    placeholder={formData.nationalId ? formData.nationalId.slice(-4) : "مثال: 1923"}
                    className="w-full px-3 py-2 font-mono font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm dir-ltr text-right"
                  />
                  {formData.nationalId && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pin: formData.nationalId.slice(-4) })}
                      className="shrink-0 px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      title="إعادة تعيين الرمز السري إلى آخر 4 أرقام من السجل المدني"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>استعادة الافتراضي</span>
                    </button>
                  )}
                </div>
                {formErrors.pin && <p className="text-red-500 text-xs font-medium">{formErrors.pin}</p>}
                <p className="text-[11px] text-slate-500 leading-normal">
                  يستخدمه المعلم أو الإداري لتسجيل الدخول إلى بوابته الخاصة واستعراض التعاميم وتوقيع أوراق المساءلة.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
    </div>
  );
};

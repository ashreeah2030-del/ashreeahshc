import React, { useState, useMemo } from 'react';
import { 
  X, 
  Send, 
  Check, 
  Copy, 
  Users, 
  MessageSquare, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Search, 
  CheckSquare, 
  Square,
  Sparkles,
  PhoneCall,
  FileText
} from 'lucide-react';
import { StaffMember, SchoolSettings } from '../types';
import { formatSaudiPhone, formatDisplayPhone } from '../utils/whatsapp';

interface BulkMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  initialSelectedStaffIds?: string[];
  schoolSettings?: SchoolSettings;
}

type AudienceFilter = 'all' | 'teachers' | 'admins' | 'selected' | 'custom';

interface MessageTemplate {
  id: string;
  title: string;
  body: string;
}

export const BulkMessageModal: React.FC<BulkMessageModalProps> = ({
  isOpen,
  onClose,
  staffList,
  initialSelectedStaffIds = [],
  schoolSettings,
}) => {
  const schoolName = schoolSettings?.schoolName || 'مجمع الشريعة التعليمي للبنين';
  const principalName = schoolSettings?.principalName || 'مدير المجمع';

  // Default preset message templates
  const templates: MessageTemplate[] = useMemo(() => [
    {
      id: 'assembly',
      title: '⏰ الاصطفاف الصباحي والانضباط',
      body: `السلام عليكم ورحمة الله وبركاته
المكرم الزميل/ {الاسم} المحترم ({المسمى})
تحية طيبة من إدارة ${schoolName}:

نؤكد على أهمية التواجد المبكر والمشاركة الفاعلة في الاصطفاف الصباحي والإشراف الميداني اليومي، حرصاً على بداية جادة وتحقيق الانضباط المدرسي لأبنائنا الطلاب.

شاكرين ومقدرين حسن تعاونكم وحرصكم الدائم.
إدارة المجمع: ${principalName}`
    },
    {
      id: 'grades',
      title: '📊 رصد درجات وتقويم الطلاب بنظام نور',
      body: `السلام عليكم ورحمة الله وبركاته
المكرم الزميل/ {الاسم} المحترم ({المسمى})
تحية طيبة من إدارة ${schoolName}:

نأمل من سعادتكم التكرم بسرعة إكمال رصد درجات أعمال السنة وتقويم المهارات المستمرة للطلاب في نظام نور والتأكد من إغلاق المهارات في الموعد المحدد نظاماً.

وفقكم الله وسدد خطاكم.
إدارة المجمع: ${principalName}`
    },
    {
      id: 'meeting',
      title: '👥 دعوة لاجتماع منسوبي المجمع',
      body: `السلام عليكم ورحمة الله وبركاته
المكرم الزميل/ {الاسم} المحترم ({المسمى})
تحية طيبة من إدارة ${schoolName}:

تدعوكم إدارة المجمع لحضور اجتماع منسوبي المجمع التعليمي في مركز مصادر التعلم لمناقشة الخطة التشغيلية ومستجدات العمل التعليمي.

نأمل الالتزام بالحضور في الموعد المحدد.
شاكرين لكم اهتمامكم.
إدارة المجمع: ${principalName}`
    },
    {
      id: 'planning',
      title: '📝 الخطط والتحضير الأسبوعي',
      body: `السلام عليكم ورحمة الله وبركاته
المكرم الزميل/ {الاسم} المحترم ({المسمى})
تحية طيبة من إدارة ${schoolName}:

نذكركم بأهمية استكمال التحضير الإلكتروني وتحديث الخطط الأسبوعية في منصة مدرستي بما يضمن فاعلية الموقف التعليمي واستثمار الحصص الدراسية بالشكل الأمثل.

متمنين لكم أسبوعاً دراسياً حافلاً بالعطاء والتميز.
إدارة المجمع: ${principalName}`
    },
    {
      id: 'appreciation',
      title: '🌟 شكر وتقدير وتحفيز',
      body: `السلام عليكم ورحمة الله وبركاته
المكرم الزميل الفاضل/ {الاسم} المحترم ({المسمى})
تحية إجلال وتقدير من إدارة ${schoolName}:

يسر إدارة المجمع أن تتقدم لكم بجزيل الشكر والامتنان على جهودكم الملموسة وعطائكم المتميز وحرصكم المستمر على رعاية ومتابعة أبنائنا الطلاب.

جزاكم الله خيراً وبارك في مساعيكم الخيرة.
إدارة المجمع: ${principalName}`
    },
    {
      id: 'general',
      title: '📢 إشعار وتنبيه إداري عام',
      body: `السلام عليكم ورحمة الله وبركاته
المكرم الزميل/ {الاسم} المحترم ({المسمى})
تحية طيبة من إدارة ${schoolName}:

نود إحاطتكم علماً بما يلي:
[اكتب نص الإشعار هنا]

شاكرين لكم دوام التعاون.
إدارة المجمع: ${principalName}`
    }
  ], [schoolName, principalName]);

  // State
  const [selectedAudience, setSelectedAudience] = useState<AudienceFilter>(
    initialSelectedStaffIds.length > 0 ? 'selected' : 'all'
  );
  const [customSelectedIds, setCustomSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedStaffIds.length > 0 ? initialSelectedStaffIds : staffList.map(s => s.id))
  );
  const [messageText, setMessageText] = useState(templates[0].body);
  const [searchFilter, setSearchFilter] = useState('');
  const [sentStaffIds, setSentStaffIds] = useState<Set<string>>(new Set());
  const [copiedPhones, setCopiedPhones] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Compute targeted recipients based on selected audience
  const targetedStaff = useMemo(() => {
    if (selectedAudience === 'all') {
      return staffList;
    }
    if (selectedAudience === 'teachers') {
      return staffList.filter(s => s.role === 'teacher');
    }
    if (selectedAudience === 'admins') {
      return staffList.filter(s => s.role !== 'teacher');
    }
    if (selectedAudience === 'selected' || selectedAudience === 'custom') {
      return staffList.filter(s => customSelectedIds.has(s.id));
    }
    return staffList;
  }, [selectedAudience, customSelectedIds, staffList]);

  // Filtered staff inside custom selector
  const customModalList = useMemo(() => {
    if (!searchFilter.trim()) return staffList;
    const q = searchFilter.toLowerCase();
    return staffList.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.roleTitle.toLowerCase().includes(q) || 
      s.phone.includes(q)
    );
  }, [staffList, searchFilter]);

  if (!isOpen) return null;

  // Toggle selection in custom list
  const toggleCustomStaff = (id: string) => {
    setCustomSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllCustom = () => {
    setCustomSelectedIds(new Set(staffList.map(s => s.id)));
  };

  const selectOnlyTeachers = () => {
    setCustomSelectedIds(new Set(staffList.filter(s => s.role === 'teacher').map(s => s.id)));
  };

  const clearAllCustom = () => {
    setCustomSelectedIds(new Set());
  };

  // Build personalized message for a staff member
  const buildPersonalizedMessage = (staff: StaffMember) => {
    return messageText
      .replace(/{الاسم}/g, staff.name)
      .replace(/{المسمى}/g, staff.roleTitle)
      .replace(/{المجمع}/g, schoolName);
  };

  // Send single WhatsApp
  const handleSendWhatsApp = (staff: StaffMember) => {
    const text = buildPersonalizedMessage(staff);
    const cleanPhone = formatSaudiPhone(staff.phone);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    
    // Mark as sent
    setSentStaffIds(prev => new Set(prev).add(staff.id));
    window.open(url, '_blank');
  };

  // Next unsent staff member
  const nextUnsentStaff = targetedStaff.find(s => !sentStaffIds.has(s.id));

  // Send to next staff in queue
  const handleSendNext = () => {
    if (nextUnsentStaff) {
      handleSendWhatsApp(nextUnsentStaff);
    }
  };

  // Copy all targeted phone numbers (for WhatsApp broadcast list or group)
  const handleCopyPhones = () => {
    const phones = targetedStaff
      .map(s => s.phone)
      .filter(Boolean)
      .join(', ');
    navigator.clipboard.writeText(phones);
    setCopiedPhones(true);
    setTimeout(() => setCopiedPhones(false), 2500);
  };

  // Copy message text
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const sentCount = targetedStaff.filter(s => sentStaffIds.has(s.id)).length;
  const progressPercent = targetedStaff.length > 0 
    ? Math.round((sentCount / targetedStaff.length) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 border-r-6 border-r-emerald-600 animate-in fade-in zoom-in duration-150 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>إرسال رسائل للمعلمين والمنسوبين عبر واتساب</span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  {targetedStaff.length} مستلم
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                إرسال رسائل فردية أو جماعية بنقرة زر مع دعم تخصيص الاسم والقوالب المعتمدة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* 1. Target Audience Selection */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>تحديد المستهدفين بالرسالة:</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                تم استهداف <strong className="text-emerald-700">{targetedStaff.length}</strong> من أصل {staffList.length}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAudience('all')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedAudience === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>جميع المنسوبين ({staffList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAudience('teachers')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedAudience === 'teachers'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>المعلمون فقط ({staffList.filter(s => s.role === 'teacher').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAudience('admins')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedAudience === 'admins'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>الهيئة الإدارية ({staffList.filter(s => s.role !== 'teacher').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAudience('custom')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedAudience === 'custom' || selectedAudience === 'selected'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>تحديد مخصص ({customSelectedIds.size})</span>
              </button>
            </div>

            {/* Custom Multi-Select Drawer / Accordion */}
            {(selectedAudience === 'custom' || selectedAudience === 'selected') && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 text-xs">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="بحث بالاسم أو الوظيفة..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full pr-8 pl-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllCustom}
                      className="text-emerald-700 hover:underline font-bold"
                    >
                      تحديد الكل
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={selectOnlyTeachers}
                      className="text-emerald-700 hover:underline font-bold"
                    >
                      تحديد المعلمين فقط
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={clearAllCustom}
                      className="text-rose-600 hover:underline font-bold"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>

                <div className="max-h-40 overflow-y-auto bg-white rounded-xl border border-slate-200 p-2 divide-y divide-slate-100">
                  {customModalList.map(staff => {
                    const isChecked = customSelectedIds.has(staff.id);
                    return (
                      <label
                        key={staff.id}
                        className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCustomStaff(staff.id)}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="font-bold text-slate-800 text-xs">{staff.name}</span>
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {staff.roleTitle}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400" dir="ltr">
                          {formatDisplayPhone(staff.phone)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Message Templates Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>نماذج وقوالب الرسائل الجاهزة:</span>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMessageText(t.body)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Message Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>نص الرسالة:</span>
              </label>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>المتغيرات:</span>
                <button
                  type="button"
                  onClick={() => setMessageText(prev => prev + ' {الاسم}')}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded font-mono text-[11px] font-bold transition-colors cursor-pointer"
                  title="إدراج اسم المعلم تلقائياً"
                >
                  + &#123;الاسم&#125;
                </button>
                <button
                  type="button"
                  onClick={() => setMessageText(prev => prev + ' {المسمى}')}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded font-mono text-[11px] font-bold transition-colors cursor-pointer"
                  title="إدراج مسمى الوظيفة"
                >
                  + &#123;المسمى&#125;
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="اكتب نص الرسالة هنا..."
              className="w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all shadow-inner leading-relaxed"
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
              <span>سيتم استبدال الرمز <code className="text-emerald-700 font-bold">&#123;الاسم&#125;</code> باسم كل معلم تلقائياً عند الإرسال.</span>
              <span>{messageText.length} حرف</span>
            </div>
          </div>

          {/* 4. Live WhatsApp Preview */}
          {targetedStaff.length > 0 && (
            <div className="bg-[#e5ddd5] p-3 sm:p-4 rounded-2xl border border-slate-300/80 shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold mb-2">
                <span>معاينة الرسالة كما ستصل للزميل ({targetedStaff[0].name}):</span>
                <span className="text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">WhatsApp Preview</span>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-2xl rounded-tr-xs shadow-xs max-w-lg border border-slate-200/60 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans relative">
                {buildPersonalizedMessage(targetedStaff[0])}
                <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-400">
                  <span>الآن</span>
                  <Check className="w-3.5 h-3.5 text-sky-500 inline" />
                </div>
              </div>
            </div>
          )}

          {/* 5. Dispatch Queue & Controls */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <span>إرسال الرسائل لقائمة المستهدفين ({targetedStaff.length})</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  تم إرسال {sentCount} من أصل {targetedStaff.length} ({progressPercent}%)
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full sm:w-48 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Main Action Buttons Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Send Next Button */}
              <button
                type="button"
                onClick={handleSendNext}
                disabled={!nextUnsentStaff}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                  nextUnsentStaff
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20 active:scale-98'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {nextUnsentStaff 
                    ? `إرسال التالي: ${nextUnsentStaff.name} عبر واتساب` 
                    : 'اكتمل إرسال جميع الرسائل بنجاح'}
                </span>
              </button>

              {/* Copy Phone Numbers */}
              <button
                type="button"
                onClick={handleCopyPhones}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                title="نسخ أرقام الجوال مفصولة بفواصل لاستخدامها في قوائم البث"
              >
                {copiedPhones ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPhones ? 'تم نسخ الأرقام!' : 'نسخ قائمة الأرقام'}</span>
              </button>

              {/* Copy Message Text */}
              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                title="نسخ نص الرسالة للحافظة"
              >
                {copiedMessage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMessage ? 'تم نسخ النص!' : 'نسخ نص الرسالة'}</span>
              </button>

              {/* Reset Status */}
              {sentStaffIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSentStaffIds(new Set())}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer mr-auto"
                  title="إعادة تعيين حالات الإرسال"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة تعيين</span>
                </button>
              )}
            </div>

            {/* Individual Staff Dispatch Queue */}
            <div className="max-h-60 overflow-y-auto bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
              {targetedStaff.map((staff, idx) => {
                const isSent = sentStaffIds.has(staff.id);
                return (
                  <div 
                    key={staff.id} 
                    className={`py-2 px-3 flex items-center justify-between gap-3 transition-colors ${
                      isSent ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-slate-400 w-5 text-center">{idx + 1}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{staff.name}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {staff.roleTitle}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400" dir="ltr">
                          {formatDisplayPhone(staff.phone)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSent ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم الإرسال</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>في الانتظار</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(staff)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          isSent 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        title={`إرسال رسالة واتساب للزميل ${staff.name}`}
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSent ? 'إعادة' : 'إرسال'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            ملاحظة: تفتح الرسائل عبر تطبيق أو ويب واتساب مباشرة برقم الجوال المعتمد لكل معلم.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};

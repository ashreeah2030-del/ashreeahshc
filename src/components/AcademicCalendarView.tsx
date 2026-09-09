import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  Printer, 
  Share2, 
  Search, 
  Plus, 
  CheckCircle2, 
  GraduationCap, 
  Flag, 
  BookOpen, 
  Palmtree, 
  Briefcase, 
  Filter, 
  Download, 
  ChevronRight, 
  AlertCircle,
  X
} from 'lucide-react';
import { SchoolSettings } from '../types';
import { 
  CalendarEvent, 
  AcademicSemesterInfo, 
  DEFAULT_ACADEMIC_SEMESTERS, 
  OFFICIAL_CALENDAR_EVENTS, 
  ACADEMIC_YEAR_TITLE 
} from '../data/academicCalendarData';

interface AcademicCalendarViewProps {
  schoolSettings: SchoolSettings;
  isStaffPortal?: boolean;
}

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = ({
  schoolSettings,
  isStaffPortal = false,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<'all' | '1' | '2' | '3'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom School Events
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('sharia_school_custom_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventHijri, setNewEventHijri] = useState('15 ربيع الأول 1448هـ');
  const [newEventGregorian, setNewEventGregorian] = useState(new Date().toISOString().slice(0, 10));
  const [newEventSemester, setNewEventSemester] = useState<'1' | '2' | '3'>('1');
  const [newEventDescription, setNewEventDescription] = useState('');

  // Combine official and custom school events
  const allEvents = useMemo(() => {
    return [...OFFICIAL_CALENDAR_EVENTS, ...customEvents];
  }, [customEvents]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(evt => {
      const matchesSemester = selectedSemester === 'all' ? true : evt.semester === selectedSemester;
      const matchesType = selectedType === 'all' ? true : evt.type === selectedType;
      const matchesSearch = 
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.hijriDate.includes(searchQuery) ||
        (evt.description && evt.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSemester && matchesType && matchesSearch;
    });
  }, [allEvents, selectedSemester, selectedType, searchQuery]);

  // Handle Add Custom Event
  const handleSaveCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEvt: CalendarEvent = {
      id: `custom-evt-${Date.now()}`,
      title: newEventTitle.trim(),
      hijriDate: newEventHijri.trim(),
      gregorianDate: newEventGregorian,
      type: 'school_event',
      semester: newEventSemester,
      description: newEventDescription.trim() || `حدث خاص بـ ${schoolSettings.schoolName}`,
      isImportant: true,
    };

    const updated = [newEvt, ...customEvents];
    setCustomEvents(updated);
    try {
      localStorage.setItem('sharia_school_custom_events', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setIsAddEventModalOpen(false);
    setNewEventTitle('');
    setNewEventDescription('');
  };

  // Delete Custom Event
  const handleDeleteCustomEvent = (id: string) => {
    const updated = customEvents.filter(e => e.id !== id);
    setCustomEvents(updated);
    try {
      localStorage.setItem('sharia_school_custom_events', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📅 التقويم الدراسي للعام ${schoolSettings.academicYear || ACADEMIC_YEAR_TITLE}\n` +
      `المدرسة: ${schoolSettings.schoolName}\n` +
      `الإدارة: ${schoolSettings.educationDepartment}\n\n` +
      `📌 أهم المواعيد:\n` +
      `• اليوم الوطني: 11-12 ربيع الأول 1448هـ\n` +
      `• إجازة الخريف: 25 جمادى الأولى 1448هـ\n` +
      `• اختبارات الفصل الأول: 17 جمادى الآخرة 1448هـ\n` +
      `• إجازة نهاية الفصل الأول: 28 جمادى الآخرة 1448هـ\n` +
      `• بداية الفصل الثاني: 9 رجب 1448هـ\n` +
      `• إجازة يوم التأسيس: 15 شعبان 1448هـ\n` +
      `• إجازة عيد الفطر: 18 رمضان 1448هـ\n` +
      `• اختبارات الفصل الثاني: 4 ذو القعدة 1448هـ\n` +
      `• بداية الفصل الثالث: 25 ذو القعدة 1448هـ\n` +
      `• إجازة عيد الأضحى: 4 ذو الحجة 1448هـ\n` +
      `• نهاية العام الدراسي: 30 محرم 1449هـ\n\n` +
      `مع تحيات إدارة ${schoolSettings.schoolName}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Get Type Badge
  const renderTypeBadge = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'vacation':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
            <Palmtree className="w-3 h-3 text-amber-700" />
            <span>إجازة رسمية</span>
          </span>
        );
      case 'exam':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
            <BookOpen className="w-3 h-3 text-rose-700" />
            <span>فترة اختبارات</span>
          </span>
        );
      case 'national_day':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <Flag className="w-3 h-3 text-emerald-700" />
            <span>مناسبة وطنية</span>
          </span>
        );
      case 'semester_start':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
            <GraduationCap className="w-3 h-3 text-blue-700" />
            <span>بداية فصل / استئناف</span>
          </span>
        );
      case 'school_event':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-700" />
            <span>حدث مدرسي خاص</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <Briefcase className="w-3 h-3 text-slate-600" />
            <span>دوام وتدريب</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <CalendarIcon className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black">
                  التقويم الدراسي للعام {schoolSettings.academicYear || ACADEMIC_YEAR_TITLE}
                </h1>
                <span className="bg-emerald-400/20 text-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300/30">
                  معتمد • وزارة التعليم
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
                {schoolSettings.schoolName} • الفصول الدراسية، فترات الاختبارات، الإجازات المطولة والرسمية
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة عبر واتساب</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-emerald-100 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التقويم</span>
            </button>

            {!isStaffPortal && (
              <button
                type="button"
                onClick={() => setIsAddEventModalOpen(true)}
                className="flex items-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>إضافة موعد مدرسي للمجمع</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Semesters Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEFAULT_ACADEMIC_SEMESTERS.map((sem) => {
          const isCurrent = sem.status === 'current';
          return (
            <div
              key={sem.semesterNumber}
              onClick={() => setSelectedSemester(selectedSemester === String(sem.semesterNumber) as any ? 'all' : String(sem.semesterNumber) as any)}
              className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer relative overflow-hidden ${
                isCurrent 
                  ? 'bg-emerald-50/80 border-emerald-400 border-r-6 border-r-emerald-700 shadow-sm ring-1 ring-emerald-400/40'
                  : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-xs'
              } ${selectedSemester === String(sem.semesterNumber) ? 'ring-2 ring-emerald-600' : ''}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  {sem.name}
                </span>
                {isCurrent ? (
                  <span className="text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-full shadow-2xs">
                    الفصل الحالي النشط
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {sem.weeksCount} أسبوعاً دراسياً
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">تاريخ البداية:</span>
                  <span className="font-bold text-slate-800">{sem.startDateHijri}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">نهاية الفصل:</span>
                  <span className="font-bold text-slate-800">{sem.endDateHijri}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium shrink-0">إجازة الفصل:</span>
                  <span className="font-semibold text-emerald-800 text-[11px] text-left">
                    {sem.vacationDateHijri}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في مواعيد التقويم، الإجازات، الاختبارات، أو التواريخ..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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

          {/* Semester Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            <button
              onClick={() => setSelectedSemester('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSemester === 'all'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كامل العام ({allEvents.length})
            </button>
            <button
              onClick={() => setSelectedSemester('1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSemester === '1'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الفصل الأول
            </button>
            <button
              onClick={() => setSelectedSemester('2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSemester === '2'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الفصل الثاني
            </button>
            <button
              onClick={() => setSelectedSemester('3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSemester === '3'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الفصل الثالث
            </button>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium ml-1">التصنيف:</span>
          <button
            onClick={() => setSelectedType('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedType === 'all' ? 'bg-emerald-800 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setSelectedType('vacation')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedType === 'vacation' ? 'bg-amber-700 text-white font-bold' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            الإجازات الرسمية
          </button>
          <button
            onClick={() => setSelectedType('exam')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedType === 'exam' ? 'bg-rose-700 text-white font-bold' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            فترات الاختبارات
          </button>
          <button
            onClick={() => setSelectedType('national_day')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedType === 'national_day' ? 'bg-emerald-700 text-white font-bold' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            المناسبات الوطنية
          </button>
          <button
            onClick={() => setSelectedType('semester_start')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedType === 'semester_start' ? 'bg-blue-700 text-white font-bold' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            بداية الفصول
          </button>
          {customEvents.length > 0 && (
            <button
              onClick={() => setSelectedType('school_event')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedType === 'school_event' ? 'bg-purple-700 text-white font-bold' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              مواعيد المجمع الخاصة ({customEvents.length})
            </button>
          )}
        </div>
      </div>

      {/* Events Timeline / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              جدول محطات العام الدراسي 1448هـ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              يعرض {filteredEvents.length} حدثاً وموعداً معتمداً
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-md border border-emerald-300">
            العام المعتمد: {schoolSettings.academicYear || '1448هـ'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs sm:text-sm">
              لم يتم العثور على أحداث تطابق بحثك الحالي.
            </div>
          ) : (
            filteredEvents.map((evt, idx) => (
              <div 
                key={evt.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                    {idx + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {evt.title}
                      </h4>
                      {renderTypeBadge(evt.type)}
                      {evt.semester && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                          {evt.semester === '1' ? 'الفصل الأول' : evt.semester === '2' ? 'الفصل الثاني' : 'الفصل الثالث'}
                        </span>
                      )}
                      {evt.daysCount && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-bold">
                          المدة: {evt.daysCount} أيام
                        </span>
                      )}
                    </div>
                    {evt.description && (
                      <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                        {evt.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <span className="font-bold text-emerald-900 text-xs sm:text-sm">
                    {evt.hijriDate}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 dir-ltr">
                    {evt.gregorianDate}
                  </span>
                  {evt.type === 'school_event' && !isStaffPortal && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomEvent(evt.id)}
                      className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold mt-1"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Custom School Event Modal */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 border-r-6 border-r-emerald-600 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                إضافة حدث أو موعد مدرسي خاص بالمجمع
              </h3>
              <button
                onClick={() => setIsAddEventModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomEvent} className="mt-4 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-800 mb-1">عنوان الحدث أو الموعد *</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="مثال: اجتماع مجلس أولياء الأمور للفصل الأول"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">التاريخ الهجري *</label>
                  <input
                    type="text"
                    value={newEventHijri}
                    onChange={(e) => setNewEventHijri(e.target.value)}
                    placeholder="15 ربيع الأول 1448هـ"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">الفصل الدراسي *</label>
                  <select
                    value={newEventSemester}
                    onChange={(e) => setNewEventSemester(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs font-semibold"
                  >
                    <option value="1">الفصل الدراسي الأول</option>
                    <option value="2">الفصل الدراسي الثاني</option>
                    <option value="3">الفصل الدراسي الثالث</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">تفاصيل أو تعليمات الحدث</label>
                <textarea
                  rows={3}
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="مثال: يعقد الاجتماع في الصالة الرياضية بالمجمع الساعة 6 مساءً بحضور أولياء الأمور والهيئة التعليمية..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs transition-colors"
                >
                  حفظ الحدث
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

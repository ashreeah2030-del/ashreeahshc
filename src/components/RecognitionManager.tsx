import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Sparkles, 
  Send, 
  Printer, 
  Star, 
  Trash2, 
  Plus, 
  Search, 
  CheckCircle2, 
  TrendingUp, 
  Trophy, 
  Medal, 
  UserCheck, 
  Clock, 
  GraduationCap, 
  ShieldCheck, 
  Calendar, 
  Filter, 
  ExternalLink,
  ChevronRight,
  Flame,
  Crown
} from 'lucide-react';
import { 
  StaffMember, 
  SchoolSettings, 
  RecognitionAward, 
  RecognitionCategory 
} from '../types';
import { maskNationalId, getFormattedHijriDate } from '../utils/formatters';
import { generateRecognitionWhatsApp } from '../utils/whatsapp';
import { CertificateModal } from './CertificateModal';

interface RecognitionManagerProps {
  staffList: StaffMember[];
  schoolSettings: SchoolSettings;
  awards: RecognitionAward[];
  onAddAward: (awardData: Omit<RecognitionAward, 'id' | 'createdAt' | 'certificateNumber'>) => void;
  onDeleteAward: (awardId: string) => void;
}

interface CategoryConfig {
  id: RecognitionCategory;
  name: string;
  defaultPoints: number;
  defaultTitle: string;
  defaultCitation: string;
  badgeColor: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'morning_assembly',
    name: 'المشاركة في انضباط الطابور الصباحي',
    defaultPoints: 25,
    defaultTitle: 'شهادة شكر لانضباط الطابور الصباحي',
    defaultCitation: 'تقديرًا لحضوره المبكر وتفانيه المشهود في تنظيم ومتابعة الاصطفاف الصباحي، وغرس الانضباط والقدوة الحسنة في نفوس أبنائنا الطلاب.',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: <Flame className="w-4 h-4 text-amber-600" />,
  },
  {
    id: 'ideal_lesson',
    name: 'تأدية حصة مثالية ونموذجية',
    defaultPoints: 35,
    defaultTitle: 'شهادة شكر لتأدية حصة نموذجية مثالية',
    defaultCitation: 'تقديرًا لإبداعه وتميزه في تقديم حصة دراسية نموذجية محققة لأعلى معايير جودة التدريس واستراتيجيات التعلم النشط والتفاعل الصفي الإيجابي.',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: <GraduationCap className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'supervision',
    name: 'المشاركة في الإشراف والمناوبة',
    defaultPoints: 25,
    defaultTitle: 'شهادة شكر للمشاركة في الإشراف والمناوبة',
    defaultCitation: 'تقديرًا لالتزامه العالي وحرصه الدائم على حفظ أمن وسلامة الطلاب أثناء الإشراف اليومي والمناوبة الميدانية في فناء ومرافق المجمع.',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    icon: <ShieldCheck className="w-4 h-4 text-blue-600" />,
  },
  {
    id: 'custom',
    name: 'تكريم وتميز ومبادرة نوعية',
    defaultPoints: 30,
    defaultTitle: 'شهادة شكر وتقدير لمبادرة تعليمية متميزة',
    defaultCitation: 'تقديرًا لمبادراته التربوية الفاعلة وجهوده المخلصة في خدمة البيئة التعليمية والمساهمة الرائدة في تعزيز جودة العمل المدرسي.',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    icon: <Award className="w-4 h-4 text-purple-600" />,
  },
];

export const RecognitionManager: React.FC<RecognitionManagerProps> = ({
  staffList,
  schoolSettings,
  awards,
  onAddAward,
  onDeleteAward,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'ledger' | 'leaderboard'>('create');
  
  // Create Award Form State
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<RecognitionCategory>('morning_assembly');
  const [customTitle, setCustomTitle] = useState<string>(CATEGORIES[0].defaultTitle);
  const [points, setPoints] = useState<number>(CATEGORIES[0].defaultPoints);
  const [citationText, setCitationText] = useState<string>(CATEGORIES[0].defaultCitation);
  const [notes, setNotes] = useState<string>('');
  
  // Search & Filter State in Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | RecognitionCategory>('all');
  
  // Selected Certificate for View/Print
  const [viewingAward, setViewingAward] = useState<RecognitionAward | null>(null);

  // Success Feedback
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // When changing category, auto-fill default title, points and citation
  const handleCategoryChange = (catId: RecognitionCategory) => {
    setSelectedCategory(catId);
    const found = CATEGORIES.find(c => c.id === catId);
    if (found) {
      setCustomTitle(found.defaultTitle);
      setPoints(found.defaultPoints);
      setCitationText(found.defaultCitation);
    }
  };

  // Submit new award
  const handleCreateAward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      alert('فضلاً اختر المعلم أو الموظف المراد تكريمه');
      return;
    }

    const staff = staffList.find(s => s.id === selectedStaffId);
    if (!staff) {
      alert('الموظف المحدد غير موجود');
      return;
    }

    const categoryObj = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];
    const hijri = getFormattedHijriDate(today);

    const awardPayload: Omit<RecognitionAward, 'id' | 'createdAt' | 'certificateNumber'> = {
      staffId: staff.id,
      staffName: staff.name,
      staffNationalId: staff.nationalId,
      staffPhone: staff.phone,
      roleTitle: staff.roleTitle,
      category: selectedCategory,
      categoryTitle: categoryObj.name,
      title: customTitle.trim() || categoryObj.defaultTitle,
      details: citationText.trim() || categoryObj.defaultCitation,
      points: Number(points) || 10,
      date: isoDate,
      hijriDate: hijri,
      awardedBy: `إدارة ${schoolSettings.schoolName}`,
      notes: notes.trim() || undefined,
    };

    onAddAward(awardPayload);

    setSuccessBanner(`تم إصدار شهادة الشكر والتقدير ومنح +${points} نقطة بنجاح للأستاذ/ ${staff.name}!`);
    setTimeout(() => setSuccessBanner(null), 5000);

    // Reset Form
    setSelectedStaffId('');
    handleCategoryChange('morning_assembly');
    setNotes('');

    // Switch to ledger to see it
    setActiveSubTab('ledger');
  };

  // Filtered Awards for Ledger
  const filteredAwards = useMemo(() => {
    return awards.filter(award => {
      const matchesQuery = 
        award.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        award.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        award.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || award.category === categoryFilter;

      return matchesQuery && matchesCategory;
    });
  }, [awards, searchQuery, categoryFilter]);

  // Statistics
  const totalPointsAwarded = useMemo(() => {
    return awards.reduce((sum, a) => sum + (a.points || 0), 0);
  }, [awards]);

  // Leaderboard Calculation
  const leaderboard = useMemo(() => {
    // Group points & awards count by staff
    const map = new Map<string, { staff: StaffMember; points: number; count: number }>();
    
    // First include all staff with their current points
    staffList.forEach(staff => {
      map.set(staff.id, {
        staff,
        points: staff.points || 0,
        count: 0,
      });
    });

    // Tally awards count
    awards.forEach(award => {
      const entry = map.get(award.staffId);
      if (entry) {
        entry.count += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.points - a.points);
  }, [staffList, awards]);

  const topPerformer = leaderboard.length > 0 && leaderboard[0].points > 0 ? leaderboard[0] : null;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Motivation Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-700/50 relative overflow-hidden">
        {/* Background ambient accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black px-3 py-1 rounded-full shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نظام التكريم والتحفيز ونقاط التميز المدرسي</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              تكريم وتحفيز منسوبي {schoolSettings.schoolName}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
              إصدار شهادات شكر وتقدير رسمية، ومكافأة المعلمين بنقاط تميز مستحقة للمشاركة في{' '}
              <strong className="text-amber-300">انضباط الطابور الصباحي</strong>، أو{' '}
              <strong className="text-amber-300">تأدية حصة دراسية مثالية</strong>، أو{' '}
              <strong className="text-amber-300">المشاركة في الإشراف والمناوبة</strong>، مع إمكانية إرسالها الفوري عبر الواتس أب.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full md:w-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] text-emerald-200 block font-medium">الشهادات الصادرة</span>
              <span className="text-xl sm:text-2xl font-black text-white">{awards.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] text-amber-200 block font-medium">إجمالي النقاط الممنوحة</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">+{totalPointsAwarded}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-emerald-200 block font-medium">متصدر التميز</span>
              <span className="text-xs font-bold text-white truncate block">
                {topPerformer ? topPerformer.staff.name : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 border-r-6 border-r-emerald-600 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-950 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button 
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs underline cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('create')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'create'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>إصدار شهادة شكر وتكريم جديد</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ledger')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'ledger'
              ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>سجل التكريم والشهادات الممنوحة</span>
          <span className="bg-slate-200 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded-full">
            {awards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('leaderboard')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'leaderboard'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>لوحة شرف فرسان التميز (المتصدرين)</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: CREATE RECOGNITION AWARD & CERTIFICATE */}
      {/* ============================================================ */}
      {activeSubTab === 'create' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden p-6 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>إصدار شهادة شكر وتقدير ومنح نقاط تميز</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                اختر المعلم المراد تحفيزه، وحدد سبب التكريم (طابور صباحي، حصة نموذجية، إشراف ومناوبة) لإصدار الشهادة الرسمية فوراً.
              </p>
            </div>

            <form onSubmit={handleCreateAward} className="space-y-6">
              {/* Step 1: Select Staff Member */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. اختر المعلم أو الموظف المكرم *
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm font-bold text-slate-800"
                >
                  <option value="">-- اختر من قائمة منسوبي المجمع --</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} - {staff.roleTitle} (الرصيد الحالي: {staff.points || 0} نقطة | السجل: {maskNationalId(staff.nationalId)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  2. مجال التكريم والإنجاز المستحق *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`text-right p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {cat.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900 block">
                              {cat.name}
                            </span>
                          </div>
                          <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                            افتراضي: +{cat.defaultPoints} نقطة تميز
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Certificate Title & Points */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    3. عنوان موضوع التكريم
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600"
                    placeholder="مثال: شهادة شكر لانضباط الطابور الصباحي"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    النقاط الممنوحة (تضاف لرصيد المعلم) *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                      required
                      className="w-full px-3.5 py-2.5 bg-amber-50/60 border border-amber-300 rounded-xl text-xs sm:text-sm font-mono font-black text-amber-950 outline-none text-center"
                    />
                    <span className="text-xs font-bold text-slate-500 shrink-0">نقطة</span>
                  </div>
                  {/* Quick point chips */}
                  <div className="flex items-center gap-1 mt-1.5 justify-end">
                    {[10, 25, 35, 50].map(pt => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setPoints(pt)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold transition-colors cursor-pointer ${
                          points === pt ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        +{pt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 4: Citation Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  4. نص الثناء والإشادة المطبوع في الشهادة الرسمية
                </label>
                <textarea
                  rows={3}
                  value={citationText}
                  onChange={(e) => setCitationText(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed outline-none focus:border-emerald-600"
                  placeholder="أدخل عبارة الشكر والتقدير التي ستظهر داخل الإطار الرسمي للشهادة..."
                />
              </div>

              {/* Step 5: Optional Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  5. ملاحظات إدارية داخلية (اختياري)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 outline-none"
                  placeholder="مثال: تم التكريم بحضور وكيل الشؤون التعليمية أثناء الطابور الصباحي"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ring-2 ring-emerald-500/20"
                >
                  <Award className="w-5 h-5 text-amber-300" />
                  <span>اعتماد وإصدار شهادة الشكر (+{points} نقطة)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: AWARDS LEDGER */}
      {/* ============================================================ */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم المعلم، رقم الشهادة..."
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <span className="text-slate-400 font-bold shrink-0">التصنيف:</span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  categoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({awards.length})
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat.id ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Awards List */}
          {filteredAwards.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">لا توجد شهادات تكريم مطابقة</h3>
              <p className="text-xs text-slate-400">
                يمكنك إصدار أول شهادة شكر وتقدير للمعلمين عبر تبويب "إصدار شهادة شكر وتكريم جديد".
              </p>
              <button
                onClick={() => setActiveSubTab('create')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إصدار شهادة شكر الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAwards.map(award => {
                const staff = staffList.find(s => s.id === award.staffId);
                const { url: waUrl } = generateRecognitionWhatsApp(
                  staff || {
                    id: award.staffId,
                    name: award.staffName,
                    nationalId: award.staffNationalId,
                    phone: award.staffPhone,
                    role: 'teacher',
                    roleTitle: award.roleTitle,
                    stage: 'all',
                    active: true,
                  },
                  award,
                  schoolSettings
                );

                return (
                  <div 
                    key={award.id}
                    className="bg-white rounded-2xl border border-slate-200/90 border-r-6 border-r-amber-500 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      {/* Top Meta */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {award.certificateNumber}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{award.hijriDate}</span>
                        </span>
                      </div>

                      {/* Recipient */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-black text-slate-900">
                            {award.staffName}
                          </h3>
                          <span className="bg-emerald-100 text-emerald-950 font-black text-xs px-2.5 py-1 rounded-full border border-emerald-300 font-mono">
                            +{award.points} نقطة
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {award.roleTitle} • السجل: <span className="font-mono font-medium" dir="ltr">{maskNationalId(award.staffNationalId)}</span>
                        </p>
                      </div>

                      {/* Reason Badge */}
                      <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>{award.categoryTitle}</span>
                      </div>

                      {/* Details preview */}
                      <p className="text-xs text-slate-600 bg-amber-50/40 p-3 rounded-xl border border-amber-100 leading-relaxed italic">
                        "{award.details}"
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* View Certificate */}
                        <button
                          onClick={() => setViewingAward(award)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all shadow-2xs cursor-pointer"
                          title="عرض وطباعة الشهادة الرسمية"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>معاينة وطباعة</span>
                        </button>

                        {/* WhatsApp Send */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                          title="إرسال الشهادة ورسالة التهنئة لواتساب المعلم"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال بالواتساب</span>
                        </a>
                      </div>

                      {/* Delete Award */}
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من رغبتك في حذف هذه الشهادة وخصم ${award.points} نقطة من رصيد المعلم؟`)) {
                            onDeleteAward(award.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف الشهادة وخصم النقاط"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: LEADERBOARD / HONOR ROLL */}
      {/* ============================================================ */}
      {activeSubTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden p-6 sm:p-8">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 shadow-xs">
                <Trophy className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                لوحة شرف فرسان مجمع الشريعة التعليمي
              </h2>
              <p className="text-xs text-slate-500">
                ترتيب المعلمين والإداريين حسب مجموع نقاط التميز المجمعة من انضباط الطابور، الحصص المثالية، والإشراف اليومي.
              </p>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                لا يوجد منسوبين مسجلين في النظام حالياً
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaderboard.map((item, index) => {
                  const isTop1 = index === 0 && item.points > 0;
                  const isTop2 = index === 1 && item.points > 0;
                  const isTop3 = index === 2 && item.points > 0;

                  return (
                    <div 
                      key={item.staff.id}
                      className={`py-4 px-3 sm:px-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                        isTop1 ? 'bg-amber-50/60 border border-amber-200' :
                        isTop2 ? 'bg-slate-50/70' :
                        isTop3 ? 'bg-amber-50/20' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Rank Badge */}
                        <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                          {isTop1 ? (
                            <span className="bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 w-full h-full rounded-2xl flex items-center justify-center">
                              <Crown className="w-5 h-5 text-amber-950" />
                            </span>
                          ) : isTop2 ? (
                            <span className="bg-slate-300 text-slate-900 w-full h-full rounded-2xl flex items-center justify-center">
                              🥈
                            </span>
                          ) : isTop3 ? (
                            <span className="bg-amber-700/20 text-amber-900 w-full h-full rounded-2xl flex items-center justify-center">
                              🥉
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 font-mono w-full h-full rounded-2xl flex items-center justify-center">
                              #{index + 1}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                              {item.staff.name}
                            </h3>
                            {isTop1 && (
                              <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
                                فارس التميز الأول
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.staff.roleTitle} • السجل: <span className="font-mono" dir="ltr">{maskNationalId(item.staff.nationalId)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-left bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
                          <span className="text-[10px] text-slate-400 block font-sans text-right">رصيد النقاط:</span>
                          <span className="text-base font-black text-emerald-800 font-mono">
                            {item.points} <span className="text-[11px] font-sans text-slate-600 font-bold">نقطة</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaffId(item.staff.id);
                            setActiveSubTab('create');
                          }}
                          className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                          title="منح تكريم جديد لهذا المعلم"
                        >
                          + منح تكريم
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Certificate Modal */}
      {viewingAward && (
        <CertificateModal
          award={viewingAward}
          staff={staffList.find(s => s.id === viewingAward.staffId)}
          schoolSettings={schoolSettings}
          onClose={() => setViewingAward(null)}
        />
      )}
    </div>
  );
};

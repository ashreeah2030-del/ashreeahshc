import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  ClipboardPaste, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Check, 
  HelpCircle, 
  Sparkles, 
  Users, 
  RotateCcw,
  Info,
  Building2,
  Search,
  CheckCheck
} from 'lucide-react';
import { StaffMember } from '../types';
import { 
  parseNoorExcelFile, 
  parseNoorText, 
  downloadNoorExcelTemplate, 
  ParsedNoorStaff, 
  ParsedNoorResult 
} from '../utils/noorParser';
import { formatDisplayPhone } from '../utils/whatsapp';
import { maskNationalId } from '../utils/formatters';

interface NoorImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStaffList: StaffMember[];
  onImportComplete: (staffMembers: Omit<StaffMember, 'id'>[], updateExisting: boolean) => void;
}

export const NoorImportModal: React.FC<NoorImportModalProps> = ({
  isOpen,
  onClose,
  existingStaffList,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'paste'>('excel');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedNoorResult | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showNoorGuide, setShowNoorGuide] = useState(false);

  // Selected items state for preview table
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [previewFilterStage, setPreviewFilterStage] = useState<'all' | 'elementary' | 'intermediate' | 'secondary'>('all');
  const [previewSearchQuery, setPreviewSearchQuery] = useState('');
  const [updateExistingStaff, setUpdateExistingStaff] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Excel file upload
  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
        setErrorMessage('صيغة الملف غير مدعومة. يرجى رفع ملف إكسل بصيغة (.xlsx أو .xls) أو ملف (.csv).');
        setIsProcessing(false);
        return;
      }

      const result = await parseNoorExcelFile(file, existingStaffList);
      handleParsedOutput(result);
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء قراءة ملف الإكسل.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle Paste Text
  const handleProcessPaste = () => {
    setErrorMessage(null);
    if (!pasteText.trim()) {
      setErrorMessage('يرجى لصق بيانات جدول نور أولاً في المربع أدناه.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = parseNoorText(pasteText, existingStaffList);
      handleParsedOutput(result);
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء معالجة النص.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to handle result and initialize selection
  const handleParsedOutput = (result: ParsedNoorResult) => {
    if (result.totalFound === 0) {
      setErrorMessage('لم يتم العثور على أي صفوف بيانات في الملف أو النص. تأكد من أن الملف يحتوي على أعمدة: الاسم والسجل المدني.');
      setParseResult(null);
      return;
    }

    setParseResult(result);
    // Select all valid staff by default
    const validIds = new Set<string>();
    result.staffList.forEach((s) => {
      if (s.isValid) {
        validIds.add(s.tempId);
      }
    });
    setSelectedStaffIds(validIds);
  };

  // Toggle selection for a single row
  const toggleSelectStaff = (tempId: string) => {
    const next = new Set(selectedStaffIds);
    if (next.has(tempId)) {
      next.delete(tempId);
    } else {
      next.add(tempId);
    }
    setSelectedStaffIds(next);
  };

  // Select all or Deselect all in preview
  const handleSelectAllPreview = () => {
    if (!parseResult) return;
    if (selectedStaffIds.size === parseResult.staffList.length) {
      setSelectedStaffIds(new Set());
    } else {
      const allIds = new Set<string>(parseResult.staffList.map((s) => s.tempId));
      setSelectedStaffIds(allIds);
    }
  };

  // Confirm and save selected staff into school system
  const handleConfirmImport = () => {
    if (!parseResult) return;

    const toImport: Omit<StaffMember, 'id'>[] = parseResult.staffList
      .filter((s) => selectedStaffIds.has(s.tempId))
      .map((s) => ({
        name: s.name,
        nationalId: s.nationalId,
        phone: s.phone || '0500000000',
        role: s.role,
        roleTitle: s.roleTitle,
        stage: s.stage,
        subject: s.subject || '',
        notes: s.notes || 'مستورد من ملف إكسل نظام نور',
        active: true,
        pin: s.nationalId.slice(-4),
      }));

    if (toImport.length === 0) {
      setErrorMessage('يرجى تحديد موظف واحد على الأقل لإتمام الاستيراد.');
      return;
    }

    onImportComplete(toImport, updateExistingStaff);
    onClose();
  };

  // Filter preview records
  const filteredPreviewList = parseResult?.staffList.filter((s) => {
    if (previewFilterStage !== 'all' && s.stage !== previewFilterStage) {
      return false;
    }
    if (previewSearchQuery.trim()) {
      const q = previewSearchQuery.trim().toLowerCase();
      const matchesName = s.name.toLowerCase().includes(q);
      const matchesId = s.nationalId.includes(q);
      const matchesPhone = s.phone.includes(q);
      const matchesSubject = s.subject.toLowerCase().includes(q);
      const matchesTitle = s.roleTitle.toLowerCase().includes(q);
      if (!matchesName && !matchesId && !matchesPhone && !matchesSubject && !matchesTitle) {
        return false;
      }
    }
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between gap-4 shrink-0 border-b border-emerald-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20 shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  استيراد بيانات منسوبي المجمع من نظام نور
                </h2>
                <span className="bg-emerald-400/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-medium">
                  صيغة Excel (.xlsx / .xls)
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                مجمع الشريعة التعليمي للبنين (رمز 432109) • استيراد كشف شاغلي الوظائف التعليمية والإدارية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNoorGuide(!showNoorGuide)}
              className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="دليل استخراج ملف الإكسل من نظام نور"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">دليل التصدير من نور</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          {/* Noor System Instructions Collapsible Guide */}
          {showNoorGuide && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-xs text-emerald-950 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>خطوات استخراج ملف الإكسل من حساب نظام نور الرسمي للمدرسة:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNoorGuide(false)}
                  className="text-emerald-700 hover:text-emerald-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pr-1 leading-relaxed">
                <li>سجل الدخول إلى نظام نور الوزاري (<a href="https://noor.moe.gov.sa" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline">noor.moe.gov.sa</a>) بحساب مدير المجمع أو الوكيل.</li>
                <li>من القائمة الجانبية، اختر <strong>التقارير</strong> &gt; <strong>تقارير الكوادر البشرية</strong> أو <strong>شاغلي الوظائف التعليمية</strong>.</li>
                <li>افتح تقرير <strong>بيانات شاغلي الوظائف التعليمية والإدارية بالمدرسة</strong> لمجمع الشريعة التعليمي.</li>
                <li>انقر على زر الحفظ والتصدير أعلى التقرير واختر <strong>تصدير إلى Excel (.xlsx)</strong>.</li>
                <li>ارفع الملف المستخرج هنا مباشرة، وسيقوم النظام باستخراج الأسماء والسجلات والجوالات وتعيين الرمز السري آلياً.</li>
              </ol>

              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  الأعمدة المطلوبة: (الاسم، السجل المدني 10 أرقام، رقم الجوال، الوظيفة، المرحلة).
                </span>
                <button
                  type="button"
                  onClick={downloadNoorExcelTemplate}
                  className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل نموذج إكسل جاهز للتعبئة</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* VIEW 1: Upload / Input Mode */}
          {!parseResult && (
            <div className="space-y-5">
              {/* Method Switcher Tabs & Download Template */}
              <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    id="tab-excel-noor"
                    onClick={() => {
                      setActiveTab('excel');
                      setErrorMessage(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'excel'
                        ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-emerald-300'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>رفع ملف إكسل نور (Excel .xlsx / .xls)</span>
                  </button>

                  <button
                    type="button"
                    id="tab-paste-noor"
                    onClick={() => {
                      setActiveTab('paste');
                      setErrorMessage(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'paste'
                        ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-emerald-300'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardPaste className="w-4 h-4 text-slate-700" />
                    <span>نسخ ولصق جدول نور</span>
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-download-noor-excel-template"
                  onClick={downloadNoorExcelTemplate}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  title="تحميل نموذج كشف نور بصيغة Excel فارغ ومعتمد"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>تحميل قالب Excel جاهز</span>
                </button>
              </div>

              {/* TAB 1: Excel File Drag & Drop */}
              {activeTab === 'excel' && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3.5 ${
                    isDragging
                      ? 'border-emerald-600 bg-emerald-50/70 scale-[1.01]'
                      : 'border-slate-300 hover:border-emerald-600 hover:bg-slate-50/80 bg-slate-50/30'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                  />

                  <div className="w-20 h-20 rounded-3xl bg-emerald-100/90 flex items-center justify-center text-emerald-800 mb-1 shadow-inner">
                    <FileSpreadsheet className="w-10 h-10" />
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                      اسحب وأفلت ملف إكسل نظام نور هنا (.xlsx أو .xls)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      أو انقر هنا لتصفح واختيار الملف المصدّر من نظام نور لمجمع الشريعة
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <span className="text-xs bg-white text-slate-700 px-3 py-1 rounded-lg font-semibold border border-slate-200 shadow-xs">
                      ✓ يتعرف على كشوفات نور تلقائياً
                    </span>
                    <span className="text-xs bg-white text-slate-700 px-3 py-1 rounded-lg font-semibold border border-slate-200 shadow-xs">
                      ✓ يضبط صيغة أرقام الجوالات السعودية
                    </span>
                    <span className="text-xs bg-white text-slate-700 px-3 py-1 rounded-lg font-semibold border border-slate-200 shadow-xs">
                      ✓ يعين الرمز السري (PIN) من آخر 4 أرقام للهوية
                    </span>
                  </div>

                  {isProcessing && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-700 font-bold mt-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>جارٍ قراءة وتحليل ملف الإكسل المستخرج من نور...</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Direct Paste from Noor */}
              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                    <p className="font-bold text-slate-800 mb-0.5">
                      طريقة اللصق السريع من شاشة نظام نور:
                    </p>
                    <p>
                      حدد جدول المعلمين في نظام نور بالفأرة، ثم اضغط <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 border rounded">Ctrl+C</kbd> (نسخ)، ثم الصق في المربع أدناه بالضغط على <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 border rounded">Ctrl+V</kbd>. سيتعرف النظام على الأعمدة الفاصلة فوراً.
                    </p>
                  </div>

                  <textarea
                    rows={8}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="الصق جدول نور أو أسطر الكادر هنا..."
                    className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none leading-relaxed"
                  />

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleProcessPaste}
                      disabled={isProcessing || !pasteText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>{isProcessing ? 'جارٍ التحليل...' : 'تحليل البيانات المستخرجة'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: Parsed Preview Mode */}
          {parseResult && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                  <span className="text-slate-500 block">إجمالي السجلات المستخرجة</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-800 font-mono">
                    {parseResult.totalFound}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200/80">
                  <span className="text-slate-500 block">سجلات مكتملة البيانات</span>
                  <span className="text-lg sm:text-xl font-black text-blue-800 font-mono">
                    {parseResult.validCount}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80">
                  <span className="text-slate-500 block">مسجلين مسبقاً بالمجمع</span>
                  <span className="text-lg sm:text-xl font-black text-amber-800 font-mono">
                    {parseResult.existingCount}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">المحدد للاستيراد الآن</span>
                  <span className="text-lg sm:text-xl font-black text-slate-800 font-mono">
                    {selectedStaffIds.size}
                  </span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewFilterStage('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      previewFilterStage === 'all'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    الكل ({parseResult.staffList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilterStage('elementary')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      previewFilterStage === 'elementary'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ابتدائي ({parseResult.staffList.filter(s => s.stage === 'elementary').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilterStage('intermediate')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      previewFilterStage === 'intermediate'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    متوسط ({parseResult.staffList.filter(s => s.stage === 'intermediate').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilterStage('secondary')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      previewFilterStage === 'secondary'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ثانوي ({parseResult.staffList.filter(s => s.stage === 'secondary').length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={previewSearchQuery}
                      onChange={(e) => setPreviewSearchQuery(e.target.value)}
                      placeholder="بحث في البيانات المستخرجة..."
                      className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setParseResult(null);
                      setSelectedStaffIds(new Set());
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                    title="إعادة رفع ملف آخر"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ملف آخر</span>
                  </button>
                </div>
              </div>

              {/* Selection Bar */}
              <div className="flex items-center justify-between text-xs bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllPreview}
                    className="font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>
                      {selectedStaffIds.size === parseResult.staffList.length ? 'إلغاء تحديد الكل' : 'تحديد جميع الموظفين'}
                    </span>
                  </button>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">
                    تم تحديد <strong className="font-mono text-slate-900">{selectedStaffIds.size}</strong> من أصل {parseResult.staffList.length}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  انقر على أي صف لتحديده أو استبعاده من الاستيراد
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStaffIds.size === parseResult.staffList.length && parseResult.staffList.length > 0}
                            onChange={handleSelectAllPreview}
                            className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300"
                          />
                        </th>
                        <th className="p-3">اسم الموظف / المعلم</th>
                        <th className="p-3">السجل المدني</th>
                        <th className="p-3">رقم الجوال</th>
                        <th className="p-3">المسمى الوظيفي</th>
                        <th className="p-3">المرحلة</th>
                        <th className="p-3">التخصص</th>
                        <th className="p-3 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPreviewList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            لا توجد نتائج تطابق البحث في السجلات المستخرجة.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewList.map((staff) => {
                          const isSelected = selectedStaffIds.has(staff.tempId);
                          return (
                            <tr
                              key={staff.tempId}
                              onClick={() => toggleSelectStaff(staff.tempId)}
                              className={`transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                                  : 'hover:bg-slate-50 opacity-60'
                              }`}
                            >
                              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectStaff(staff.tempId)}
                                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <span>{staff.name}</span>
                                  {staff.isExisting && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300 font-medium">
                                      موجود مسبقاً
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 font-mono font-semibold text-slate-800" dir="ltr">
                                {maskNationalId(staff.nationalId)}
                              </td>
                              <td className="p-3 font-mono text-slate-700" dir="ltr">
                                {staff.phone ? formatDisplayPhone(staff.phone) : '—'}
                              </td>
                              <td className="p-3 text-slate-700">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                                  {staff.roleTitle}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600">
                                {staff.stage === 'elementary' ? 'ابتدائي' : staff.stage === 'intermediate' ? 'متوسط' : staff.stage === 'secondary' ? 'ثانوي' : 'مشترك'}
                              </td>
                              <td className="p-3 text-slate-600">
                                {staff.subject || '—'}
                              </td>
                              <td className="p-3 text-center">
                                {staff.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" />
                                    <span>جاهز</span>
                                  </span>
                                ) : (
                                  <span 
                                    className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full"
                                    title={staff.validationErrors.join(', ')}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>تنبيه</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-7 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
            {parseResult ? (
              <span>
                تم تحديد <strong className="text-slate-900 font-mono">{selectedStaffIds.size}</strong> من أصل <strong className="text-slate-900 font-mono">{parseResult.staffList.length}</strong> موظفاً
              </span>
            ) : (
              <span>استيراد كشف نور الرسمي • مجمع الشريعة التعليمي للبنين (1448هـ)</span>
            )}

            <label className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={updateExistingStaff}
                onChange={(e) => setUpdateExistingStaff(e.target.checked)}
                className="rounded text-emerald-700 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span>تحديث بيانات الموظف إذا تطابق رقم السجل المدني</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            {parseResult && (
              <button
                type="button"
                id="btn-confirm-noor-import"
                onClick={handleConfirmImport}
                disabled={selectedStaffIds.size === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>إتمام استيراد ({selectedStaffIds.size}) موظفاً إلى المجمع</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

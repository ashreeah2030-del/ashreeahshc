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
  UserCheck, 
  RotateCcw,
  ArrowRight,
  Info
} from 'lucide-react';
import { StaffMember } from '../types';
import { 
  parseNoorExcelFile, 
  parseNoorText, 
  downloadNoorExcelTemplate, 
  ParsedNoorStaff, 
  ParsedNoorResult 
} from '../utils/noorParser';

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
        setErrorMessage('صيغة الملف غير مدعومة. يرجى رفع ملف Excel (.xlsx أو .xls) أو CSV.');
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
      setErrorMessage('يرجى لصق البيانات أولاً في المربع أدناه.');
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
      setErrorMessage('لم يتم العثور على أي صفوف بيانات في الملف أو النص. تأكد من أن الملف يحتوي على أعمدة: الاسم والسجل المدني والجوال.');
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

  // Toggle individual selection
  const toggleSelectStaff = (tempId: string) => {
    const next = new Set(selectedStaffIds);
    if (next.has(tempId)) {
      next.delete(tempId);
    } else {
      next.add(tempId);
    }
    setSelectedStaffIds(next);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (!parseResult) return;
    if (selectedStaffIds.size === parseResult.staffList.length) {
      setSelectedStaffIds(new Set());
    } else {
      setSelectedStaffIds(new Set(parseResult.staffList.map((s) => s.tempId)));
    }
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (!parseResult) return;

    const toImport = parseResult.staffList
      .filter((s) => selectedStaffIds.has(s.tempId))
      .map((s) => ({
        name: s.name,
        nationalId: s.nationalId,
        phone: s.phone,
        role: s.role,
        roleTitle: s.roleTitle,
        stage: s.stage,
        subject: s.subject,
        notes: s.notes,
        active: true,
        pin: s.pin,
      }));

    if (toImport.length === 0) {
      setErrorMessage('يرجى تحديد موظف واحد على الأقل لإتمام الاستيراد.');
      return;
    }

    onImportComplete(toImport, updateExistingStaff);
    onClose();
  };

  // Reset to initial input
  const handleReset = () => {
    setParseResult(null);
    setPasteText('');
    setErrorMessage(null);
    setSelectedStaffIds(new Set());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="noor-import-modal"
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 border-r-6 border-r-emerald-600 animate-in fade-in zoom-in-95 duration-150 my-auto overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-900 via-emerald-800 to-slate-900 text-white px-5 sm:px-7 py-4.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">استيراد الموظفين من نظام نور</h2>
                <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  تلقائي ذكي
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                مجمع الشريعة التعليمي للبنين • يدعم ملفات Excel والنصوص المنسوخة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNoorGuide(!showNoorGuide)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
              title="خطوات تصدير الملف من نظام نور"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>طريقة التصدير من نور</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step-by-Step Noor Guidance (Collapsible) */}
        {showNoorGuide && (
          <div className="bg-amber-50/90 border-b border-amber-200 px-5 sm:px-7 py-3.5 text-xs text-amber-950 shrink-0 animate-in slide-in-from-top duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-900 text-xs">
                    كيف تستخرج كشف منسوبي المدرسة من نظام نور في دقيقة واحدة؟
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-amber-900/90 leading-relaxed pr-1">
                    <li>سجّل دخولك إلى <a href="https://noor.moe.gov.sa" target="_blank" rel="noreferrer" className="font-bold underline text-amber-950">نظام نور (noor.moe.gov.sa)</a> بحساب الإدارة المدرسية.</li>
                    <li>من القائمة الجانبية اختر <strong>التقارير</strong> ثم <strong>تقارير المعلمين</strong> (أو بيانات شؤون المعلمين).</li>
                    <li>اختر <strong>بيانات شاغلي الوظائف التعليمية والإدارية</strong>، ثم اضغط أيقونة الحفظ واصطحب ملف <strong>Excel</strong>.</li>
                    <li>اسحب الملف وأفلته مباشرة هنا، وسيتولى النظام استخراج الأسماء، السجلات المدنية، وأرقام الجوالات وتعيين الأدوار والمراحل التعليمية تلقائياً!</li>
                  </ol>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNoorGuide(false)}
                className="text-amber-700 hover:text-amber-900 text-xs font-bold shrink-0"
              >
                إغلاق الإرشاد
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
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
              {/* Method Switcher Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('excel');
                      setErrorMessage(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'excel'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>رفع ملف إكسل نور (.xlsx / .xls)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('paste');
                      setErrorMessage(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'paste'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardPaste className="w-4 h-4 text-slate-700" />
                    <span>نسخ ولصق جدول نور مباشرة</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={downloadNoorExcelTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="تحميل ملف إكسل قياسي جاهز للتعبئة"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>تحميل نموذج إكسل جاهز</span>
                </button>
              </div>

              {/* TAB 1: Excel File Drag & Drop */}
              {activeTab === 'excel' && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-emerald-600 bg-emerald-50/60 scale-[1.01]'
                      : 'border-slate-300 hover:border-emerald-600 hover:bg-slate-50/70'
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

                  <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-800 mb-1 shadow-xs">
                    <UploadCloud className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                      اسحب وأفلت ملف إكسل المصدر من نظام نور هنا
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      أو انقر هنا لاختيار الملف من جهازك بصيغة <span className="font-mono font-bold text-slate-700">.xlsx</span> أو <span className="font-mono font-bold text-slate-700">.xls</span> أو <span className="font-mono font-bold text-slate-700">.csv</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                      ✓ يتعرف على ترويسة تقارير نور تلقائياً
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                      ✓ تصحيح أرقام الجوالات السعودية
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                      ✓ تعيين الرمز السري (PIN) الافتراضي
                    </span>
                  </div>

                  {isProcessing && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold mt-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>جارٍ قراءة بيانات منسوبي المجمع وتحليل الأعمدة...</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Direct Paste from Noor */}
              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                    <p className="font-bold text-slate-800 mb-0.5">
                      طريقة اللصق السريع من متصفح نظام نور:
                    </p>
                    <p>
                      حدد جدول المعلمين في نظام نور بالفأرة، ثم اضغط <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 border rounded">Ctrl+C</kbd> (نسخ)، ثم الصق في المربع أدناه بالضغط على <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 border rounded">Ctrl+V</kbd>. سيتعرف النظام على الأعمدة الفاصلة فوراً.
                    </p>
                  </div>

                  <textarea
                    rows={8}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="الصق جدول نور أو الأسطر هنا..."
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

          {/* VIEW 2: Parsed Result & Verification Table */}
          {parseResult && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      تم استخراج {parseResult.totalFound} موظفاً ومعلماً من التقرير
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5 flex-wrap">
                      <span className="text-emerald-700 font-bold">
                        {parseResult.validCount} بياناتهم مكتملة
                      </span>
                      {parseResult.invalidCount > 0 && (
                        <span className="text-rose-600 font-bold">
                          • {parseResult.invalidCount} ينقصهم السجل أو الجوال
                        </span>
                      )}
                      {parseResult.existingCount > 0 && (
                        <span className="text-amber-700 font-bold">
                          • {parseResult.existingCount} مسجلين مسبقاً بالمجمع
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة رفع ملف آخر</span>
                </button>
              </div>

              {/* Batch Options */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
                <label className="flex items-center gap-2 cursor-pointer select-none font-semibold">
                  <input
                    type="checkbox"
                    checked={updateExistingStaff}
                    onChange={(e) => setUpdateExistingStaff(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300"
                  />
                  <span>تحديث بيانات الموظفين المسجلين مسبقاً في حال تطابق رقم السجل المدني (تحديث الجوال والتخصص)</span>
                </label>

                <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-md border border-emerald-300 shrink-0">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>رمز الدخول السري الافتراضي: آخر 4 أرقام من السجل</span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStaffIds.size === parseResult.staffList.length && parseResult.staffList.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300"
                            title="تحديد أو إلغاء تحديد الكل"
                          />
                        </th>
                        <th className="p-3">الاسم الرباعي</th>
                        <th className="p-3">السجل المدني</th>
                        <th className="p-3">رقم الجوال</th>
                        <th className="p-3">المسمى الوظيفي</th>
                        <th className="p-3">المرحلة</th>
                        <th className="p-3">التخصص / المادة</th>
                        <th className="p-3 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.staffList.map((staff, idx) => {
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
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300 font-medium">
                                    موجود مسبقاً
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-mono font-semibold text-slate-800 dir-ltr text-right">
                              {staff.nationalId}
                            </td>
                            <td className="p-3 font-mono text-slate-700 dir-ltr text-right">
                              {staff.phone}
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
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-7 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {parseResult ? (
              <span>
                تم تحديد <strong className="text-slate-900 font-mono">{selectedStaffIds.size}</strong> من أصل <strong className="text-slate-900 font-mono">{parseResult.staffList.length}</strong> موظفاً
              </span>
            ) : (
              <span>نظام نور المعتمد • مجمع الشريعة التعليمي للبنين</span>
            )}
          </div>

          <div className="flex items-center gap-2">
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
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
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

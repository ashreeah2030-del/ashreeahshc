import React, { useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileDown,
  CheckCircle2, 
  Clock, 
  Send, 
  Building2, 
  Calendar, 
  FileText,
  AlertTriangle,
  ShieldCheck,
  QrCode,
  Loader2,
  Check,
  Sparkles
} from 'lucide-react';
import { DispatchedDocument, StaffMember, SchoolSettings } from '../types';
import { generateStaffDispatchWhatsApp } from '../utils/whatsapp';
import { MoeLogo } from './MoeLogo';
import { CircularProgress } from './CircularProgress';
import { maskNationalId } from '../utils/formatters';

interface SignatureAuditModalProps {
  document: DispatchedDocument;
  staffList: StaffMember[];
  schoolSettings: SchoolSettings;
  onClose: () => void;
}

export const SignatureAuditModal: React.FC<SignatureAuditModalProps> = ({
  document: doc,
  staffList,
  schoolSettings,
  onClose,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'signed' | 'pending'>('all');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccessNotice, setExportSuccessNotice] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const printContainerRef = useRef<HTMLDivElement>(null);

  const targetStaff = staffList.filter(s => doc.targetStaffIds.includes(s.id));
  const totalTarget = targetStaff.length;
  const signedStaffIds = Object.keys(doc.signatures);
  const signedCount = signedStaffIds.length;
  const pendingCount = totalTarget - signedCount;

  const filteredStaff = targetStaff.filter(staff => {
    const isSigned = !!doc.signatures[staff.id];
    if (filterStatus === 'signed') return isSigned;
    if (filterStatus === 'pending') return !isSigned;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!printContainerRef.current) return;
    setIsExportingPdf(true);
    setExportError(null);

    try {
      // Dynamically load html2pdf for fast initial page load
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      const element = printContainerRef.current;
      const cleanRefNumber = (doc.referenceNumber || 'DOC').replace(/[\/\\]/g, '-');
      const filename = `كشف_توثيق_توقيعات_${cleanRefNumber}_${schoolSettings.schoolName.replace(/\s+/g, '_')}.pdf`;

      const opt = {
        margin: 8,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollY: 0,
          scrollX: 0,
          ignoreElements: (element: Element) => {
            return element.classList.contains('pdf-hide') || element.classList.contains('print:hidden');
          }
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'landscape' as const,
          compress: true
        },
        pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }
      };

      await html2pdf().set(opt).from(element).save();

      setExportSuccessNotice('تم تصدير وتنزيل كشف التواقيع المعتمد كملف PDF بنجاح للأرشفة المدرسية!');
      setTimeout(() => setExportSuccessNotice(null), 5000);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setExportError('تعذر توليد ملف الـ PDF مباشرة. يمكنك استخدام زر "طباعة الكشف" لحفظه كـ PDF عبر متصفحك.');
      setTimeout(() => setExportError(null), 6000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const isCircular = doc.type === 'circular';
  const currentDateFormatted = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTimeFormatted = new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className={`bg-white rounded-2xl max-w-5xl xl:max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 border-r-6 animate-in fade-in zoom-in duration-150 ${
        isCircular ? 'border-r-emerald-600' : 'border-r-amber-500'
      }`}>
        {/* Header - Not printed */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                {isCircular ? 'كشف توقيعات التعميم' : 'كشف إفادة وتوقيع المساءلة'}
              </span>
              <span className="text-xs text-slate-500 font-mono">رقم: {doc.referenceNumber}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {doc.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Export as PDF Button */}
            <button
              id="btn-export-pdf"
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-700/60 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              title="توليد وتنزيل مستند رسمي بجدول التواقيع ورموز التوثيق كملف PDF"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري توليد ملف الـ PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>تصدير كملف PDF</span>
                </>
              )}
            </button>

            {/* Print Official Sheet Button */}
            <button
              id="btn-print-official"
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              title="طباعة الكشف الرسمي عبر الطابعة المدرسية"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكشف الرسمي</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success or Error Notice Banner */}
        {exportSuccessNotice && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in print:hidden">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportSuccessNotice}</span>
            </div>
            <button
              onClick={() => setExportSuccessNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {exportError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in print:hidden">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{exportError}</span>
            </div>
            <button
              onClick={() => setExportError(null)}
              className="text-amber-700 hover:text-amber-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Printable & Exportable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div ref={printContainerRef} className="bg-white p-2 sm:p-4 space-y-5">
            {/* Official Letterhead for print & PDF */}
            <div className="border-b-2 border-slate-400/80 pb-4">
              <div className="flex items-center justify-between text-xs gap-4">
                {/* School & Ministry Header Right */}
                <div className="text-right leading-relaxed shrink-0">
                  <div className="flex items-center gap-1 font-bold text-slate-900 mb-0.5">
                    <span className="text-amber-600 font-serif">🇸🇦</span>
                    <span>المملكة العربية السعودية</span>
                  </div>
                  <p className="text-slate-700 font-medium">وزارة التعليم</p>
                  <p className="font-bold text-emerald-950">{schoolSettings.educationDepartment}</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{schoolSettings.schoolName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">الرقم الإحصائي الوزاري: 441029</p>
                </div>

                {/* Central Title and Logo */}
                <div className="text-center flex-1 px-2">
                  <div className="flex justify-center mb-1">
                    <MoeLogo size="lg" className="h-14 w-auto drop-shadow-2xs" />
                  </div>
                  <h4 className="font-black text-base text-slate-900 mt-1">
                    كشف التوقيع بالعلم والتوثيق المعتمد
                  </h4>
                  <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>منظومة التوثيق الرقمي والأرشفة المدرسية</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">العام الدراسي: {schoolSettings.academicYear}</p>
                </div>

                {/* Reference Details Left */}
                <div className="text-left font-mono text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0 space-y-0.5">
                  <p>رقم الوثيقة: <strong className="text-emerald-950 font-bold">{doc.referenceNumber}</strong></p>
                  <p>تاريخ الصدور: <strong>{doc.hijriDate}</strong></p>
                  <p>المستهدفون: <strong>{totalTarget}</strong> موظف</p>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 mt-1">
                    تاريخ الاستخراج: <strong>{currentDateFormatted}</strong>
                  </p>
                </div>
              </div>

              {/* Document Summary Banner */}
              <div className="mt-4 p-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold whitespace-nowrap">الموضوع الرسمي:</span>
                  <span className="text-slate-100 font-bold text-xs sm:text-sm">{doc.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-emerald-200 bg-emerald-900/90 px-2.5 py-1 rounded-md border border-emerald-700/60 font-semibold">
                    {doc.type === 'circular' ? 'تعميم إداري رسمي' : 'مساءلة إدارية'}
                  </span>
                  <span className="text-[10px] text-amber-300 bg-slate-800/80 px-2 py-0.5 rounded border border-amber-500/40 font-mono">
                    توثيق معتمد
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Badges - Filter buttons on screen, static on print & PDF */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 print:hidden pdf-hide">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الكل ({totalTarget})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('signed')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterStatus === 'signed'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  تم التوقيع بالعلم ({signedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterStatus === 'pending'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  في انتظار التوقيع ({pendingCount})
                </button>
              </div>

              {/* Static summary for PDF and Print */}
              <div className="hidden print:flex pdf-show items-center gap-4 text-xs font-bold text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span>إجمالي المستهدفين: {totalTarget}</span>
                <span>•</span>
                <span className="text-emerald-800">الموقعون بالعلم: {signedCount}</span>
                <span>•</span>
                <span className="text-amber-800">قيد الانتظار: {pendingCount}</span>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 border-r-3 border-r-emerald-600 rounded-xl px-3 py-1.5 shadow-2xs">
                <CircularProgress
                  percentage={totalTarget > 0 ? Math.round((signedCount / totalTarget) * 100) : 0}
                  size={36}
                  strokeWidth={4}
                  textSizeClass="text-[10px] font-black"
                />
                <div className="text-xs">
                  <span className="text-slate-500 block text-[10px]">نسبة الإنجاز والاعتماد:</span>
                  <span className="font-bold text-slate-800">{signedCount} من {totalTarget} موظف ({totalTarget > 0 ? Math.round((signedCount / totalTarget) * 100) : 0}%)</span>
                </div>
              </div>
            </div>

            {/* Official Table with Staff Names, Signature Dates, and Authorized Verification Codes */}
            <div className={`border border-slate-300 border-r-4 rounded-xl overflow-hidden shadow-2xs ${
              isCircular ? 'border-r-emerald-600' : 'border-r-amber-500'
            }`}>
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 font-black">
                    <th className="p-2.5 w-10 text-center">م</th>
                    <th className="p-2.5">اسم الموظف الرباعي</th>
                    <th className="p-2.5">الهوية الوطنية</th>
                    <th className="p-2.5">المسمى الوظيفي</th>
                    <th className="p-2.5 text-center">حالة التوقيع بالعلم</th>
                    <th className="p-2.5">تاريخ ووقت التوقيع</th>
                    <th className="p-2.5 text-center">رمز التوثيق المعتمد</th>
                    <th className="p-2.5 text-center">التوقيع الإلكتروني المعتمد</th>
                    <th className="p-2.5 print:hidden pdf-hide text-center">تذكير واتساب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStaff.map((staff, index) => {
                    const signature = doc.signatures[staff.id];
                    const isSigned = !!signature;
                    const { url: waUrl } = generateStaffDispatchWhatsApp(staff, doc, schoolSettings);
                    const verificationCode = signature?.receiptCode || (isSigned ? `SHR-${staff.nationalId.slice(-4)}` : null);

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2.5 font-mono text-slate-500 text-center">{index + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{staff.name}</td>
                        <td className="p-2.5 font-mono text-slate-700" dir="ltr">{maskNationalId(staff.nationalId)}</td>
                        <td className="p-2.5 text-slate-600">{staff.roleTitle}</td>
                        <td className="p-2.5 text-center">
                          {isSigned ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>وقع بالعلم</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px] whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>قيد الانتظار</span>
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {signature?.formattedDate || '—'}
                        </td>
                        <td className="p-2.5 text-center">
                          {isSigned && verificationCode ? (
                            <span className="font-mono font-bold text-emerald-950 bg-emerald-100/90 text-[11px] px-2.5 py-1 rounded-md border border-emerald-300 shadow-2xs whitespace-nowrap inline-block">
                              {verificationCode}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 text-[10px] italic">
                              قيد الاعتماد
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {signature ? (
                            <div className="flex flex-col items-center justify-center space-y-1">
                              {signature.signatureImage ? (
                                <img
                                  src={signature.signatureImage}
                                  alt={`توقيع ${staff.name}`}
                                  className="h-8 max-w-[110px] object-contain border border-slate-300 rounded p-0.5 bg-white shadow-2xs"
                                />
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  توقيع رقمي موثق
                                </span>
                              )}
                              {signature.responseText && (
                                <p className="text-[10px] text-slate-600 max-w-xs line-clamp-2 italic">
                                  "{signature.responseText}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">لم يتم التوقيع بعد</span>
                          )}
                        </td>
                        <td className="p-2.5 print:hidden pdf-hide text-center">
                          {!isSigned && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                              title="إرسال رسالة تذكير للتوقيع عبر الواتس أب"
                            >
                              <Send className="w-3 h-3" />
                              <span>تذكير</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Official School Administrative Approvals and Archiving Section */}
            <div className="pt-6 border-t-2 border-slate-300 space-y-4">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800 text-xs">وكيل شؤون المعلمين والموظفين</p>
                  <p className="text-emerald-950 font-black text-sm mt-1.5">{schoolSettings.vicePrincipalName}</p>
                  <div className="mt-4 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[11px] text-slate-500 px-4">
                    <span>التوقيع: ............................</span>
                    <span>التاريخ: {currentDateFormatted}</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800 text-xs">مدير مجمع الشريعة التعليمي للبنين</p>
                  <p className="text-emerald-950 font-black text-sm mt-1.5">{schoolSettings.principalName}</p>
                  <div className="mt-4 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[11px] text-slate-500 px-4">
                    <span>الختم والتوقيع: ............................</span>
                    <span>التاريخ: {currentDateFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Archiving Verification Footer Notice */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-medium">
                    مستند توثيقي رسمي معتمد صادر عن مجمع الشريعة التعليمي للبنين — يُحفظ في الأرشيف الإداري وسجلات المدرسة.
                  </span>
                </div>
                <div className="font-mono text-[10px] text-slate-500 shrink-0">
                  رمز الأرشفة: SHR-ARCHIVE-{(doc.referenceNumber || '').replace(/[\/\\]/g, '-')}-{Date.now().toString().slice(-6)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 print:hidden">
          <span className="text-slate-500">
            كشف التواقيع المعتمد لمجمع الشريعة التعليمي للبنين • جاهز للتصدير كـ PDF والحفظ الإداري
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-700/60 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التصدير...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>تصدير كملف PDF</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

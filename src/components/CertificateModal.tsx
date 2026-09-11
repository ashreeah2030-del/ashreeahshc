import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  Send, 
  Award, 
  Sparkles, 
  Check, 
  Copy, 
  Star, 
  QrCode, 
  Building2,
  Calendar,
  Share2
} from 'lucide-react';
import { RecognitionAward, SchoolSettings, StaffMember } from '../types';
import { MoeLogo } from './MoeLogo';
import { maskNationalId } from '../utils/formatters';
import { generateRecognitionWhatsApp } from '../utils/whatsapp';

interface CertificateModalProps {
  award: RecognitionAward;
  staff?: StaffMember;
  schoolSettings: SchoolSettings;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  award,
  staff,
  schoolSettings,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Associated staff or fallback
  const targetStaff: StaffMember = staff || {
    id: award.staffId,
    name: award.staffName,
    nationalId: award.staffNationalId,
    phone: award.staffPhone,
    role: 'teacher',
    roleTitle: award.roleTitle,
    stage: 'all',
    active: true,
  };

  const { url: waUrl, text: waText } = generateRecognitionWhatsApp(targetStaff, award, schoolSettings);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(waText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm sm:text-base text-amber-100">
              شهادة شكر وتقدير رسمية معتمدة
            </span>
            <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-amber-500/30">
              {award.certificateNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp Send Button */}
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
              title="إرسال الشهادة ورسالة التهنئة لجوال المعلم عبر الواتس أب"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إرسال بالواتساب</span>
            </a>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
              title="طباعة الشهادة (A4 بالعرض)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">طباعة الشهادة</span>
            </button>

            {/* Copy Text Button */}
            <button
              onClick={handleCopyText}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="نسخ نص التهنئة"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 rounded-xl transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* THE OFFICIAL PRINTABLE CERTIFICATE CANVAS */}
        {/* ======================================================== */}
        <div 
          ref={certificateRef}
          id="official-appreciation-certificate"
          className="p-4 sm:p-8 bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/30 print:p-8 print:m-0 print:w-full print:h-auto"
        >
          {/* Certificate Frame with Double Borders & Ornamental Corners */}
          <div className="relative border-8 border-double border-amber-500/50 rounded-2xl p-6 sm:p-10 bg-white/95 shadow-md print:shadow-none print:border-amber-600 print:rounded-none">
            {/* Top Ornamental Ribbon Corner Accents */}
            <div className="absolute top-2 right-2 w-10 h-10 border-t-4 border-r-4 border-amber-600 rounded-tr-lg pointer-events-none" />
            <div className="absolute top-2 left-2 w-10 h-10 border-t-4 border-l-4 border-amber-600 rounded-tl-lg pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-10 h-10 border-b-4 border-r-4 border-amber-600 rounded-br-lg pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-10 h-10 border-b-4 border-l-4 border-amber-600 rounded-bl-lg pointer-events-none" />

            {/* Certificate Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-amber-200/80">
              {/* Right: Ministry & School Info */}
              <div className="text-right space-y-0.5 text-xs text-slate-700">
                <p className="font-extrabold text-slate-900 text-sm">المملكة العربية السعودية</p>
                <p className="font-bold text-emerald-900">وزارة التعليم</p>
                <p className="text-slate-600 font-medium">{schoolSettings.educationDepartment}</p>
                <p className="font-black text-amber-900">{schoolSettings.schoolName}</p>
              </div>

              {/* Center: Official Ministry of Education Emblem */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-2 bg-emerald-50 rounded-2xl border border-emerald-200/80 shadow-xs mb-1">
                  <MoeLogo size="lg" className="h-12 sm:h-14 w-auto" />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 tracking-wider">
                  منظومة التميز والتحفيز المدرسي
                </span>
              </div>

              {/* Left: Certificate Metadata */}
              <div className="text-left text-xs text-slate-600 space-y-0.5 font-mono">
                <div className="bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-right">
                  <p><span className="text-slate-500 font-sans">رقم التوثيق: </span><strong className="text-amber-900">{award.certificateNumber}</strong></p>
                  <p><span className="text-slate-500 font-sans">التاريخ: </span><strong className="text-slate-800">{award.hijriDate}</strong></p>
                  <p><span className="text-slate-500 font-sans">الموافق: </span><span>{award.date}</span></p>
                </div>
              </div>
            </div>

            {/* Certificate Center Title */}
            <div className="text-center my-6 sm:my-8 space-y-2">
              <div className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black rounded-full shadow-sm border border-amber-300">
                <Sparkles className="w-5 h-5 text-amber-900" />
                <span className="text-lg sm:text-2xl tracking-wider">شَهَادَةُ شُكْرٍ وَتَقْدِيرٍ</span>
                <Sparkles className="w-5 h-5 text-amber-900" />
              </div>

              <p className="text-xs sm:text-sm text-amber-900 font-bold tracking-wide">
                (وسام التميز والعطاء التربوي)
              </p>
            </div>

            {/* Honoree Introduction */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                تَسُرُّ إدارة <strong>{schoolSettings.schoolName}</strong> أن تتقدم بأسمى آيات الشكر والامتنان والتقدير للزميل الفاضل:
              </p>

              {/* Teacher Name Highlight Box */}
              <div className="bg-gradient-to-r from-emerald-50 via-amber-50/70 to-emerald-50 p-3.5 sm:p-4 rounded-2xl border-2 border-emerald-600/40 shadow-xs inline-block w-full max-w-lg mx-auto">
                <h2 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-wide">
                  الأستاذ / {award.staffName}
                </h2>
                <div className="flex items-center justify-center gap-3 mt-1.5 text-xs text-slate-600 font-medium flex-wrap">
                  <span className="bg-white/80 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {award.roleTitle}
                  </span>
                  <span className="bg-white/80 px-2.5 py-0.5 rounded-md border border-slate-200">
                    السجل المدني: <strong className="font-mono text-slate-800" dir="ltr">{maskNationalId(award.staffNationalId)}</strong>
                  </span>
                </div>
              </div>

              {/* Achievement Category Badge */}
              <div className="pt-2">
                <span className="text-xs text-slate-500 block mb-1.5">نظير مشاركته الفاعلة وتميزه في:</span>
                <div className="inline-flex items-center gap-2 bg-amber-100/90 text-amber-950 border border-amber-300 font-black px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base shadow-2xs">
                  <Award className="w-5 h-5 text-amber-700" />
                  <span>{award.categoryTitle}</span>
                </div>
              </div>

              {/* Citation Body Text */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed italic font-medium">
                "{award.details}"
              </div>

              {/* Points Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white px-5 py-2 rounded-full font-bold text-xs sm:text-sm shadow-xs border border-amber-400">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>رصيد النقاط المستحقة المضافة:</span>
                <span className="text-amber-300 font-mono text-base font-black dir-ltr">+{award.points}</span>
                <span className="text-emerald-200 text-xs">نقطة تميز</span>
              </div>
            </div>

            {/* Endorsement & Signatures Footer */}
            <div className="mt-8 pt-6 border-t-2 border-dashed border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-700">
              {/* QR Verification Code Stamp */}
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="w-12 h-12 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center shrink-0">
                  <QrCode className="w-10 h-10 text-slate-800" />
                </div>
                <div className="text-right text-[10px] space-y-0.5">
                  <p className="font-bold text-slate-800">شهادة معتمدة إلكترونياً</p>
                  <p className="text-slate-500 font-mono">{award.certificateNumber}</p>
                  <p className="text-emerald-700 font-bold">موثقة بمنظومة التواصل</p>
                </div>
              </div>

              {/* Official Round Stamp Impression */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-700 p-1 flex items-center justify-center text-emerald-800 text-[9px] font-black uppercase tracking-tighter transform -rotate-6 shadow-2xs">
                  <div className="w-full h-full rounded-full border border-emerald-700 flex flex-col items-center justify-center p-1 bg-emerald-50/50">
                    <span>مجمع الشريعة</span>
                    <span className="font-mono text-[8px] text-amber-700">★ 1448هـ ★</span>
                    <span>الختم الرسمي</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">الختم المعتمد</span>
              </div>

              {/* Principal Signature & Endorsement */}
              <div className="text-center sm:text-left space-y-1">
                <p className="text-xs font-bold text-slate-600">مدير مجمع الشريعة التعليمي للبنين</p>
                <p className="text-sm font-black text-emerald-950">{schoolSettings.principalName}</p>
                <div className="font-serif italic text-emerald-800 text-xs pt-1 opacity-90">
                  [معتمد وموقع رقمياً]
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info bar (hidden on print) */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 print:hidden">
          <span>💡 يمكنك تصدير الشهادة بالطباعة المباشرة على مقاس A4، أو إرسالها الفوري عبر الواتس أب لجوال المعلم.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer"
          >
            إغلاق المعاينة
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Send, 
  RotateCcw, 
  Printer, 
  ArrowRight, 
  Smartphone, 
  Check, 
  FileText, 
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  Hash
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DispatchedDocument, StaffMember, SchoolSettings, StaffSignature } from '../types';
import { generateSchoolReturnWhatsApp } from '../utils/whatsapp';
import { MoeLogo } from './MoeLogo';
import { maskNationalId } from '../utils/formatters';

interface DocumentSignViewProps {
  document: DispatchedDocument;
  staff: StaffMember;
  schoolSettings: SchoolSettings;
  onSaveSignature: (docId: string, signature: StaffSignature) => void;
  onBackToDashboard?: () => void;
}

export const DocumentSignView: React.FC<DocumentSignViewProps> = ({
  document: doc,
  staff,
  schoolSettings,
  onSaveSignature,
  onBackToDashboard,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [savedSignature, setSavedSignature] = useState<StaffSignature | null>(null);

  const isCircular = doc.type === 'circular';
  const isInquiry = doc.type === 'inquiry';
  const existingSignature = doc.signatures[staff.id] || 
    (Object.values(doc.signatures || {}) as StaffSignature[]).find(s => s.nationalId && staff.nationalId && s.nationalId === staff.nationalId);

  // If already signed previously
  useEffect(() => {
    if (existingSignature) {
      setSavedSignature(existingSignature);
      setIsSubmitted(true);
      if (existingSignature.responseText) {
        setResponseText(existingSignature.responseText);
      }
    }
  }, [existingSignature]);

  // Setup Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = 140;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f4c81'; // Official administrative blue-navy ink
  }, []);

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Submit Signature & Return to School
  const handleConfirmSignature = () => {
    if (isInquiry && !responseText.trim()) {
      alert('الرجاء كتابة إفادتك ومبرراتك بشأن المساءلة قبل التوقيع.');
      return;
    }

    if (!hasDrawn && !existingSignature) {
      alert('الرجاء التوقيع بيدك في المربع المخصص للتوقيع بالعلم.');
      return;
    }

    if (!isAgreed) {
      alert('الرجاء تأكيد الإقرار والاطلاع بالعلم بتحديد خانة التعهد.');
      return;
    }

    const canvas = canvasRef.current;
    const signatureImage = canvas ? canvas.toDataURL('image/png') : (existingSignature?.signatureImage || '');

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SA')} - ${now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
    const receiptCode = `SHR-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSignature: StaffSignature = {
      staffId: staff.id,
      staffName: staff.name,
      nationalId: staff.nationalId,
      phone: staff.phone,
      signedAt: now.toISOString(),
      formattedDate,
      signatureImage,
      responseText: responseText.trim(),
      status: 'signed',
      receiptCode,
    };

    onSaveSignature(doc.id, newSignature);
    setSavedSignature(newSignature);
    setIsSubmitted(true);

    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.log(err);
    }
  };

  // Open WhatsApp to Send Back to School
  const handleSendBackToSchoolWhatsApp = () => {
    const signatureToUse = savedSignature || existingSignature;
    if (!signatureToUse) return;

    const { url } = generateSchoolReturnWhatsApp(staff, doc, signatureToUse, schoolSettings);
    window.open(url, '_blank');
  };

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Bar / Navigation */}
      <div className="flex items-center justify-between">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للوحة تحكم المجمع</span>
          </button>
        )}

        <div className="flex items-center gap-2 mr-auto text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>واجهة الموظف الذكية (متوافقة مع شاشات الجوال)</span>
        </div>
      </div>

      {/* Main Document Paper Container */}
      <div className={`bg-white rounded-2xl border-2 border-slate-300 shadow-lg overflow-hidden print:border-none print:shadow-none border-r-6 ${
        isCircular ? 'border-r-emerald-600' : 'border-r-amber-500'
      }`}>
        {/* Official Saudi Ministry & School Header */}
        <div className="bg-gradient-to-b from-slate-50 to-white border-b-2 border-emerald-900/20 p-5 sm:p-7 text-center relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-4">
            {/* Ministry Side */}
            <div className="text-right text-xs leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5">
                <span className="text-amber-600 font-serif">🇸🇦</span>
                <span>المملكة العربية السعودية</span>
              </div>
              <p className="font-semibold text-slate-700">وزارة التعليم</p>
              <p className="text-emerald-900 font-bold">{schoolSettings.educationDepartment}</p>
              <p className="text-slate-900 font-black text-sm mt-0.5">{schoolSettings.schoolName}</p>
            </div>

            {/* Emblem Center */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-2 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center ring-2 ring-emerald-600/20">
                <MoeLogo size="lg" className="h-14 w-auto drop-shadow-2xs" />
              </div>
              <span className="text-xs font-black text-emerald-950 mt-1.5 bg-emerald-100/80 px-2.5 py-0.5 rounded-md border border-emerald-300/80 shadow-2xs">
                {isCircular ? 'تعميم إداري رسمي' : 'ورقة مساءلة رسمية'}
              </span>
            </div>

            {/* Reference & Date Side */}
            <div className="text-left text-xs leading-relaxed font-mono dir-ltr bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-slate-800 font-bold">الرقم: <strong className="text-emerald-950">{doc.referenceNumber}</strong></p>
              <p className="text-slate-700">التاريخ: <strong>{doc.hijriDate}</strong></p>
              <p className="text-slate-500 text-[11px]">الموافق: {doc.date}</p>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-3.5 rounded-xl shadow-sm border border-emerald-800/60">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-amber-300">
              {doc.title}
            </h1>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-5 sm:p-8 space-y-6">
          {/* Employee Verification Ribbon */}
          <div className="bg-emerald-50/80 border border-emerald-200 border-r-4 border-r-emerald-600 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-700" />
              <span className="text-slate-600">الموظف المعني:</span>
              <strong className="text-slate-900 text-sm">{staff.name}</strong>
              <span className="text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded font-semibold">
                {staff.roleTitle}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-700">
              <span>السجل المدني: <strong className="font-mono text-slate-900" dir="ltr">{maskNationalId(staff.nationalId)}</strong></span>
              <span>الجوال: <strong className="font-mono text-slate-900" dir="ltr">{staff.phone}</strong></span>
            </div>
          </div>

          {/* Content section */}
          {isCircular ? (
            <div className="space-y-4">
              <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200 border-r-4 border-r-emerald-600 text-sm sm:text-base font-normal">
                {doc.circularData?.content}
              </div>

              {doc.circularData?.instructions && (
                <div className="p-3 bg-amber-50 border border-amber-200 border-r-4 border-r-amber-500 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block mb-0.5">تعليمات الإدارة:</strong>
                    {doc.circularData.instructions}
                  </div>
                </div>
              )}

              {/* Optional notes for circular */}
              {!isSubmitted && (
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1.5">
                    ملاحظات أو تعليق الموظف (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="يمكنك كتابة أي ملاحظة أو استفسار لإدارة المجمع هنا..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>
              )}
            </div>
          ) : (
            // Inquiry Body
            <div className="space-y-5">
              {/* Incident Details Card */}
              <div className="bg-amber-50/60 border-2 border-amber-200/80 border-r-6 border-r-amber-500 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>موضوع واقعة المساءلة: {doc.inquiryData?.reasonTitle}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 bg-white/80 p-3 rounded-lg border border-amber-200/60 border-r-3 border-r-amber-500">
                  <p>📅 <strong>تاريخ الواقعة:</strong> {doc.inquiryData?.incidentDate} ({doc.hijriDate})</p>
                  {doc.inquiryData?.incidentTimeOrPeriods && (
                    <p>⏰ <strong>التوقيت / الحصص:</strong> {doc.inquiryData.incidentTimeOrPeriods}</p>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <strong className="text-amber-950 block mb-1">بيان الواقعة المرصودة:</strong>
                  <p className="bg-white p-3 rounded-lg border border-amber-200/60 border-r-3 border-r-amber-500 leading-relaxed font-medium">
                    {doc.inquiryData?.details}
                  </p>
                </div>

                <div className="text-xs text-amber-900 bg-amber-100/60 p-2.5 rounded-lg font-semibold border-r-3 border-r-amber-600">
                  📌 <strong>المطلوب نظاماً:</strong> {doc.inquiryData?.requiredAction}
                </div>
              </div>

              {/* Staff Statement Input (Required for inquiry) */}
              {!isSubmitted ? (
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-900 text-xs sm:text-sm">
                    إفادة الموظف ومبرراته الرسمية <span className="text-red-600">* (مطلوبة)</span>
                  </label>
                  <p className="text-xs text-slate-500">
                    أخي الزميل، يرجى تدوين أسباب وتبرير الغياب أو التأخر بكل دقة ووضوح لرفعها لإدارة المجمع:
                  </p>
                  <textarea
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="أفيد سعادتكم بأن سبب التأخر / الغياب يعود إلى..."
                    className="w-full p-3.5 bg-slate-50 border-2 border-emerald-600/40 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none leading-relaxed font-medium"
                  />
                </div>
              ) : (
                <div className="bg-emerald-50/80 border border-emerald-200 border-r-4 border-r-emerald-600 rounded-xl p-4 space-y-1">
                  <strong className="text-xs text-emerald-900 font-bold block">إفادة الموظف المسجلة والمعتمدة:</strong>
                  <p className="text-xs sm:text-sm text-slate-800 bg-white p-3 rounded-lg border border-emerald-200/60 border-r-3 border-r-emerald-600 leading-relaxed font-medium">
                    "{savedSignature?.responseText || 'تم التوقيع بالعلم دون إبداء إفادة إضافية'}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Signature Section */}
          <div className="pt-4 border-t-2 border-slate-100">
            {!isSubmitted ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>التوقيع الإلكتروني بالعلم</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      وقع بيدك أو باللمس على الشاشة في المربع أدناه لإثبات الاطلاع والعلم
                    </p>
                  </div>

                  {hasDrawn && (
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>مسح وإعادة التوقيع</span>
                    </button>
                  )}
                </div>

                {/* Canvas Signature Pad */}
                <div className="border-2 border-dashed border-emerald-600/60 border-r-4 border-r-emerald-600 rounded-2xl bg-slate-50/60 relative overflow-hidden touch-none">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-36 cursor-crosshair block"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-semibold">
                      <span>✍️ ارسم توقيعك هنا باللمس أو الماوس</span>
                    </div>
                  )}
                </div>

                {/* Agreement Checkbox */}
                <label className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 border-r-4 border-r-emerald-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed font-medium">
                    أقر أنا الموظف <strong>({staff.name})</strong>، صاحب السجل المدني <strong className="font-mono" dir="ltr">({maskNationalId(staff.nationalId)})</strong>، بأنني اطلعت على ما ورد بعاليه وأوقع بالعلم، وأتحمل كامل المسؤولية النظامية.
                  </span>
                </label>

                {/* Confirmation Button */}
                <button
                  type="button"
                  onClick={handleConfirmSignature}
                  disabled={!isAgreed}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    isAgreed
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/10'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>اعتماد التوقيع بالعلم وتجهيز الإرسال لجوال المدرسة</span>
                </button>
              </div>
            ) : (
              /* Signed Confirmation View */
              <div className="bg-emerald-50 border-2 border-emerald-300 border-r-6 border-r-emerald-600 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-emerald-950 text-base">
                        تم اعتماد التوقيع بالعلم بنجاح!
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        تم تسجيل توقيعك إلكترونياً وحفظ الوثيقة برمز التوثيق: <strong className="font-mono">{savedSignature?.receiptCode}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-left text-xs font-mono text-emerald-800 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-300">
                    <span>{savedSignature?.formattedDate}</span>
                  </div>
                </div>

                {/* Display Captured Signature */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-emerald-200/80">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-1">توقيع الموظف المعتمد:</span>
                    {savedSignature?.signatureImage ? (
                      <img
                        src={savedSignature.signatureImage}
                        alt="توقيع الموظف"
                        className="h-16 max-w-[200px] object-contain border-b border-slate-300 pb-1"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">تم التوقيع بالعلم</span>
                    )}
                    <span className="text-[11px] text-slate-600 block mt-1 font-bold">
                      {staff.name} - السجل: <span className="font-mono" dir="ltr">{maskNationalId(staff.nationalId)}</span>
                    </span>
                  </div>

                  {/* Stamp / Verification Badge */}
                  <div className="border-2 border-emerald-800 rounded-xl p-3 text-center text-[10px] text-emerald-950 bg-gradient-to-b from-emerald-50 to-slate-50 w-48 shadow-2xs">
                    <p className="font-black text-emerald-950 text-xs">مجمع الشريعة التعليمي</p>
                    <p className="text-[10px] text-emerald-800 font-bold">{schoolSettings.educationDepartment}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">منظومة التواصل الموحدة</p>
                    <div className="mt-1 pt-1 border-t border-emerald-300 flex items-center justify-center gap-1 font-mono font-bold text-emerald-900 text-xs">
                      <span>كود التوثيق:</span>
                      <span>{savedSignature?.receiptCode}</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Resend Button to School */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleSendBackToSchoolWhatsApp}
                    className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 transition-colors cursor-pointer"
                  >
                    <Send className="w-5 h-5" />
                    <span>إرسال الوثيقة الموقعة الآن إلى جوال إدارة المدرسة عبر الواتس أب</span>
                  </button>

                  <p className="text-center text-[11px] text-emerald-800">
                    عند النقر، سيتم فتح محادثة الواتساب مع جوال إدارة المجمع (<strong>{schoolSettings.adminPhone}</strong>) مجهزة بالإفادة ورمز التوثيق ورابط الوثيقة الموقعة.
                  </p>
                </div>

                {/* Print button */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold px-4 py-2 rounded-lg hover:bg-emerald-100/50 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>طباعة / حفظ كملف PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

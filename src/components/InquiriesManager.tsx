import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Send, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Printer, 
  Copy, 
  Check, 
  X,
  ExternalLink,
  Calendar,
  AlertCircle,
  MessageSquare,
  FileSignature
} from 'lucide-react';
import { DispatchedDocument, StaffMember, SchoolSettings, InquiryDetails, InquiryReason } from '../types';
import { generateStaffDispatchWhatsApp, getDocumentSigningUrl } from '../utils/whatsapp';
import { maskNationalId } from '../utils/formatters';

interface InquiriesManagerProps {
  documents: DispatchedDocument[];
  staffList: StaffMember[];
  schoolSettings: SchoolSettings;
  onAddInquiry: (newDoc: DispatchedDocument) => void;
  onOpenSignPortal: (docId: string, staffId: string) => void;
  onOpenAuditModal: (doc: DispatchedDocument) => void;
}

export const InquiriesManager: React.FC<InquiriesManagerProps> = ({
  documents,
  staffList,
  schoolSettings,
  onAddInquiry,
  onOpenSignPortal,
  onOpenAuditModal,
}) => {
  const currentYearDigits = schoolSettings.academicYear.replace(/[^0-9]/g, '') || '1448';

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [reasonType, setReasonType] = useState<InquiryReason>('lateness');
  const [inquiryNumber, setInquiryNumber] = useState(`م/${currentYearDigits}/${Math.floor(400 + Math.random() * 500)}`);
  const [hijriDate, setHijriDate] = useState(`25 ربيع الأول ${schoolSettings.academicYear || '1448هـ'}`);
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [incidentTimeOrPeriods, setIncidentTimeOrPeriods] = useState('الحصة الأولى (الساعة 7:00 صباحاً)');
  const [details, setDetails] = useState('');
  const [requiredAction, setRequiredAction] = useState('تدوين أسباب ومبررات التأخر والإفادة والتوقيع بالعلم عبر النموذج وإعادته لجوال المدرسة خلال 24 ساعة.');
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  // Inquiry list
  const inquiries = documents.filter(d => d.type === 'inquiry');

  // Reason Presets
  const handleReasonChange = (newReason: InquiryReason) => {
    setReasonType(newReason);
    if (newReason === 'absence') {
      setIncidentTimeOrPeriods('كامل اليوم الدراسي (7 حصص)');
      setDetails('لوحظ غيابكم عن العمل دون إشعار مسبق أو تقديم عذر مقبول لدى إدارة المجمع.');
    } else if (newReason === 'lateness') {
      setIncidentTimeOrPeriods('الحصة الأولى (الساعة 7:00 ص - 7:45 ص)');
      setDetails('لوحظ تأخركم عن الحضور الصباحي والاصطفاف والحصة الأولى، مما ترتب عليه بقاء الطلاب بدون معلم.');
    } else if (newReason === 'grades_delay') {
      setIncidentTimeOrPeriods('الفترة الدراسية الأولى');
      setDetails('لوحظ عدم استكمال رصد درجات الطلاب والمهام الأدائية عبر نظام نور في الموعد المحدد بالتعميم الإداري.');
    } else if (newReason === 'leaving_early') {
      setIncidentTimeOrPeriods('الحصتين السادسة والسابعة (الانصراف)');
      setDetails('لوحظ مغادرتكم المجمع قبل انتهاء الدوام الرسمي وخروج الطلاب دون إذن خطي من الإدارة.');
    } else {
      setIncidentTimeOrPeriods('');
      setDetails('');
    }
  };

  const handleCreateInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find(s => s.id === selectedStaffId);
    if (!staff) {
      alert('الرجاء اختيار الموظف المراد مساءلته');
      return;
    }

    if (!details.trim()) {
      alert('الرجاء كتابة تفاصيل الواقعة');
      return;
    }

    let reasonTitle = 'مساءلة إدارية';
    if (reasonType === 'absence') reasonTitle = 'مساءلة غياب عن العمل بدون عذر';
    else if (reasonType === 'lateness') reasonTitle = 'مساءلة تأخر صباحي عن الحصة الأولى';
    else if (reasonType === 'grades_delay') reasonTitle = 'مساءلة تأخر رصد الدرجات بنظام نور';
    else if (reasonType === 'leaving_early') reasonTitle = 'مساءلة انصراف مبكر قبل نهاية الدوام';
    else reasonTitle = 'مساءلة تقصير في أداء الواجب الوظيفي';

    const inqData: InquiryDetails = {
      inquiryNumber,
      date: new Date().toISOString().slice(0, 10),
      hijriDate,
      staffId: staff.id,
      staffName: staff.name,
      staffNationalId: staff.nationalId,
      staffPhone: staff.phone,
      reasonType,
      reasonTitle,
      incidentDate,
      incidentTimeOrPeriods,
      details,
      requiredAction,
    };

    const newDoc: DispatchedDocument = {
      id: `doc-inq-${Date.now()}`,
      type: 'inquiry',
      title: `${reasonTitle} - ${staff.name}`,
      referenceNumber: inquiryNumber,
      date: new Date().toISOString().slice(0, 10),
      hijriDate,
      createdAt: new Date().toISOString(),
      inquiryData: inqData,
      targetStaffIds: [staff.id],
      signatures: {},
    };

    onAddInquiry(newDoc);
    setIsNewModalOpen(false);

    // Prompt to open WhatsApp directly
    const { url } = generateStaffDispatchWhatsApp(staff, newDoc, schoolSettings);
    if (confirm(`تم إصدار ورقة المساءلة رقم (${inquiryNumber}) للموظف: ${staff.name}\n\nهل ترغب في فتح محادثة الواتس أب الآن لإرسالها له مباشرة؟`)) {
      window.open(url, '_blank');
    }
  };

  const copySigningLink = (docId: string, staffId: string) => {
    const url = getDocumentSigningUrl(docId, staffId);
    navigator.clipboard.writeText(url);
    setCopiedDocId(docId);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 border-r-4 border-r-amber-500 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>أوراق المساءلة الإدارية والإفادات الرسمية</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إصدار أوراق المساءلة وإرسالها للمعلمين والإداريين عبر الواتس أب وتلقي إفاداتهم وتواقيعهم بالعلم
          </p>
        </div>

        <button
          id="btn-issue-new-inquiry"
          onClick={() => {
            setInquiryNumber(`م/${currentYearDigits}/${Math.floor(400 + Math.random() * 500)}`);
            setHijriDate(`25 ربيع الأول ${schoolSettings.academicYear || '1448هـ'}`);
            setSelectedStaffId(staffList[0]?.id || '');
            handleReasonChange('lateness');
            setIsNewModalOpen(true);
          }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إصدار ورقة مساءلة جديدة</span>
        </button>
      </div>

      {/* Inquiries List */}
      <div className="grid grid-cols-1 gap-4">
        {inquiries.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 border-r-4 border-r-slate-300 text-slate-400">
            <AlertTriangle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700 text-base">لا توجد أوراق مساءلة صادرة</h3>
            <p className="text-xs text-slate-400 mt-1">سجل المجمع نظيف وخالٍ من المساءلات حالياً</p>
          </div>
        ) : (
          inquiries.map(doc => {
            const inq = doc.inquiryData;
            const staff = staffList.find(s => s.id === inq?.staffId);
            const signature = inq ? doc.signatures[inq.staffId] : undefined;
            const isAnswered = !!signature;

            const { url: waUrl } = staff 
              ? generateStaffDispatchWhatsApp(staff, doc, schoolSettings) 
              : { url: '#' };

            return (
              <div 
                key={doc.id}
                className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all p-5 border-r-4 ${
                  isAnswered ? 'border-r-emerald-600' : 'border-r-amber-500'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-md border border-amber-300 font-mono border-r-2 border-r-amber-500">
                        رقم: {doc.referenceNumber}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {doc.hijriDate}
                      </span>
                      {isAnswered ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-md border border-emerald-300 border-r-2 border-r-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          تمت الإفادة والتوقيع بالعلم
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-md border border-amber-300 border-r-2 border-r-amber-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          في انتظار رد الموظف وتوقيعه
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {inq?.reasonTitle || doc.title}
                    </h3>

                    {/* Staff info card */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 border-r-4 border-r-emerald-600 text-xs">
                      <span className="font-bold text-slate-800">
                        الموظف: <span className="text-emerald-800 font-extrabold">{inq?.staffName}</span>
                      </span>
                      <span className="text-slate-500">
                        السجل المدني: <span className="font-mono text-slate-700 font-bold" dir="ltr">{maskNationalId(inq?.staffNationalId)}</span>
                      </span>
                      <span className="text-slate-500">
                        الجوال: <span className="font-mono text-slate-700 font-bold" dir="ltr">{inq?.staffPhone}</span>
                      </span>
                      {inq?.incidentTimeOrPeriods && (
                        <span className="text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded font-medium">
                          التوقيت: {inq.incidentTimeOrPeriods}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-amber-50/40 p-2.5 rounded-xl border border-amber-100 border-r-4 border-r-amber-500">
                      <strong className="text-amber-900">واقعة المساءلة: </strong>
                      {inq?.details}
                    </p>

                    {/* If answered, display teacher's response */}
                    {isAnswered && signature && (
                      <div className="mt-3 p-3 bg-emerald-50/80 border border-emerald-200 border-r-4 border-r-emerald-600 rounded-xl">
                        <div className="flex items-center justify-between text-xs text-emerald-900 font-bold mb-1">
                          <span className="flex items-center gap-1">
                            <FileSignature className="w-4 h-4 text-emerald-700" />
                            <span>إفادة وتبرير الموظف الرسمية:</span>
                          </span>
                          <span className="text-[11px] text-emerald-700 font-mono">
                            {signature.formattedDate}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-emerald-200/60 leading-relaxed font-medium">
                          "{signature.responseText || 'تم التوقيع بالعلم بدون إبداء إفادة إضافية'}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 text-xs">
                  <span className="text-slate-500">
                    رمز الوثيقة: <span className="font-mono text-slate-700 font-semibold">{doc.id}</span>
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* WhatsApp Send Link to Teacher */}
                    {staff && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-1.5 font-bold px-3.5 py-2 rounded-xl transition-colors ${
                          isAnswered
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                        title="إرسال المساءلة عبر الواتس أب لجوال المعلم"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isAnswered ? 'إعادة إرسال بالواتساب' : 'إرسال المساءلة بالواتساب'}</span>
                      </a>
                    )}

                    {/* Copy Signing Link */}
                    {staff && (
                      <button
                        onClick={() => copySigningLink(doc.id, staff.id)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="نسخ رابط الإفادة والتوقيع"
                      >
                        {copiedDocId === doc.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Teacher Portal Simulator Button */}
                    {staff && (
                      <button
                        onClick={() => onOpenSignPortal(doc.id, staff.id)}
                        className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                        title="فتح نموذج الإفادة والتوقيع للموظف (كتابة الإفادة والتوقيع باليد)"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{isAnswered ? 'استعراض الإفادة والتوقيع' : 'فتح شاشة إفادة الموظف'}</span>
                      </button>
                    )}

                    {/* View Official Print View */}
                    <button
                      onClick={() => onOpenAuditModal(doc)}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                      title="معاينة وطباعة ورقة المساءلة الرسمية"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>الطباعة الرسمية</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create New Inquiry Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 border-r-6 border-r-amber-500 animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>إصدار ورقة مساءلة إدارية</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">مجمع الشريعة التعليمي للبنين - الإدارة المدرسية</p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInquiry} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
              {/* Select Staff Member */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">الموظف المراد مساءلته *</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none font-semibold text-slate-800"
                >
                  <option value="">-- اختر المعلم أو الإداري من القائمة --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.roleTitle} (السجل: {maskNationalId(s.nationalId)} | الجوال: {s.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Inquiry Reason Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">موضوع وسبب المساءلة *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleReasonChange('lateness')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                      reasonType === 'lateness'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    تأخر صباحي
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReasonChange('absence')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                      reasonType === 'absence'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    غياب بدون عذر
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReasonChange('grades_delay')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                      reasonType === 'grades_delay'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    تأخر رصد درجات
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReasonChange('leaving_early')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                      reasonType === 'leaving_early'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    انصراف مبكر
                  </button>
                </div>
              </div>

              {/* Number, Date, Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم المساءلة *</label>
                  <input
                    type="text"
                    value={inquiryNumber}
                    onChange={(e) => setInquiryNumber(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الواقعة *</label>
                  <input
                    type="text"
                    value={hijriDate}
                    onChange={(e) => setHijriDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none"
                    placeholder={`مثال: 25 ربيع الأول ${schoolSettings.academicYear || '1448هـ'}`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">وقت الواقعة أو الحصص</label>
                  <input
                    type="text"
                    value={incidentTimeOrPeriods}
                    onChange={(e) => setIncidentTimeOrPeriods(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none"
                    placeholder="الحصة الأولى والثانية"
                  />
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">تفاصيل واقعة المساءلة بالتحديد *</label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="اكتب ما تم رصده وتوثيقه بشأن الموظف..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none leading-relaxed"
                />
              </div>

              {/* Action Required */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">المطلوب من الموظف والمهلة</label>
                <input
                  type="text"
                  value={requiredAction}
                  onChange={(e) => setRequiredAction(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>اعتماد وإصدار المساءلة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Send, 
  CheckCircle2, 
  Clock, 
  Users, 
  Share2, 
  Eye, 
  Printer, 
  Copy, 
  Check, 
  X,
  ExternalLink,
  Calendar,
  AlertCircle,
  Bookmark,
  BookmarkPlus,
  Layers,
  Sparkles,
  Save
} from 'lucide-react';
import { DispatchedDocument, StaffMember, SchoolSettings, CircularDetails, CircularTemplate } from '../types';
import { generateStaffDispatchWhatsApp, getDocumentSigningUrl } from '../utils/whatsapp';
import { CircularProgress } from './CircularProgress';
import { CircularTemplatesModal } from './CircularTemplatesModal';
import { maskNationalId } from '../utils/formatters';
import { 
  loadCircularTemplates, 
  addCircularTemplate, 
  updateCircularTemplate, 
  deleteCircularTemplate, 
  saveCircularTemplates 
} from '../utils/storage';
import { INITIAL_CIRCULAR_TEMPLATES } from '../data/sampleTemplates';

interface CircularsManagerProps {
  documents: DispatchedDocument[];
  staffList: StaffMember[];
  schoolSettings: SchoolSettings;
  onAddCircular: (newDoc: DispatchedDocument) => void;
  onOpenSignPortal: (docId: string, staffId: string) => void;
  onOpenAuditModal: (doc: DispatchedDocument) => void;
}

export const CircularsManager: React.FC<CircularsManagerProps> = ({
  documents,
  staffList,
  schoolSettings,
  onAddCircular,
  onOpenSignPortal,
  onOpenAuditModal,
}) => {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeDispatchDoc, setActiveDispatchDoc] = useState<DispatchedDocument | null>(null);
  const [copiedLinkStaffId, setCopiedLinkStaffId] = useState<string | null>(null);

  // Templates Management State
  const [templates, setTemplates] = useState<CircularTemplate[]>(() => loadCircularTemplates());
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isSaveAsTemplateModalOpen, setIsSaveAsTemplateModalOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [saveTemplateCategory, setSaveTemplateCategory] = useState<CircularTemplate['category']>('انضباط ودوام');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const currentYearDigits = (schoolSettings?.academicYear || '1448').replace(/[^0-9]/g, '') || '1448';

  // Form State for new circular
  const [title, setTitle] = useState('');
  const [circularNumber, setCircularNumber] = useState(`${currentYearDigits}/${Math.floor(100 + Math.random() * 900)}`);
  const [hijriDate, setHijriDate] = useState(`25 ربيع الأول ${schoolSettings.academicYear || '1448هـ'}`);
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'top_urgent'>('urgent');
  const [targetAudience, setTargetAudience] = useState<'all' | 'teachers' | 'admins' | 'elementary' | 'intermediate' | 'secondary' | 'custom'>('all');
  const [customStaffIds, setCustomStaffIds] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('نأمل من جميع الزملاء التكرم بالاطلاع والتوقيع بالعلم عبر الرابط، وإعادة إرساله لجوال إدارة المجمع.');
  const [content, setContent] = useState('');

  // Circulars list
  const circulars = documents.filter(d => d.type === 'circular');

  // Apply Template Handler
  const handleApplyTemplate = (tpl: CircularTemplate) => {
    setTitle(tpl.title);
    setContent(tpl.content);
    if (tpl.defaultAudience) {
      setTargetAudience(tpl.defaultAudience);
    }
    if (tpl.priority) {
      setPriority(tpl.priority);
    }
    if (tpl.instructions) {
      setInstructions(tpl.instructions);
    }
    setIsNewModalOpen(true);
  };

  // Template CRUD Handlers
  const handleSaveTemplate = (tplData: Omit<CircularTemplate, 'id' | 'createdAt'>) => {
    addCircularTemplate(tplData);
    setTemplates(loadCircularTemplates());
  };

  const handleUpdateTemplate = (id: string, updates: Partial<CircularTemplate>) => {
    const updated = updateCircularTemplate(id, updates);
    setTemplates(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = deleteCircularTemplate(id);
    setTemplates(updated);
  };

  const handleResetTemplates = () => {
    saveCircularTemplates(INITIAL_CIRCULAR_TEMPLATES);
    setTemplates(INITIAL_CIRCULAR_TEMPLATES);
  };

  // Save Current Form as Template
  const handleOpenSaveAsTemplate = () => {
    if (!title.trim() || !content.trim()) {
      alert('يرجى كتابة عنوان التعميم ومحتواه أولاً لحفظه كقالب.');
      return;
    }
    setSaveTemplateName((title || '').replace(/^تعميم\s*(بشأن\s*)?/, '').trim() || 'قالب تعميم جديد');
    setIsSaveAsTemplateModalOpen(true);
  };

  const handleConfirmSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTemplateName.trim()) return;

    addCircularTemplate({
      name: saveTemplateName.trim(),
      title: title.trim(),
      content: content.trim(),
      category: saveTemplateCategory,
      defaultAudience: targetAudience,
      priority: priority,
      instructions: instructions.trim(),
      isSystemDefault: false,
    });

    setTemplates(loadCircularTemplates());
    setIsSaveAsTemplateModalOpen(false);
    setSaveSuccessNotice('تم حفظ صيغة التعميم كقالب معتمد بنجاح في مكتبة القوالب!');
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  const handleCreateCircular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('يرجى كتابة عنوان التعميم ومحتواه');
      return;
    }

    // Determine target staff IDs
    let targetIds: string[] = [];
    if (targetAudience === 'all') {
      targetIds = staffList.map(s => s.id);
    } else if (targetAudience === 'teachers') {
      targetIds = staffList.filter(s => s.role === 'teacher').map(s => s.id);
    } else if (targetAudience === 'admins') {
      targetIds = staffList.filter(s => s.role !== 'teacher').map(s => s.id);
    } else if (targetAudience === 'elementary') {
      targetIds = staffList.filter(s => s.stage === 'elementary' || s.stage === 'all').map(s => s.id);
    } else if (targetAudience === 'intermediate') {
      targetIds = staffList.filter(s => s.stage === 'intermediate' || s.stage === 'all').map(s => s.id);
    } else if (targetAudience === 'secondary') {
      targetIds = staffList.filter(s => s.stage === 'secondary' || s.stage === 'all').map(s => s.id);
    } else if (targetAudience === 'custom') {
      targetIds = customStaffIds.length > 0 ? customStaffIds : staffList.map(s => s.id);
    }

    const newCircularDetails: CircularDetails = {
      circularNumber,
      title,
      date: new Date().toISOString().slice(0, 10),
      hijriDate,
      content,
      instructions,
      priority,
      targetAudience,
    };

    const newDoc: DispatchedDocument = {
      id: `doc-cir-${Date.now()}`,
      type: 'circular',
      title,
      referenceNumber: circularNumber,
      date: new Date().toISOString().slice(0, 10),
      hijriDate,
      createdAt: new Date().toISOString(),
      circularData: newCircularDetails,
      targetStaffIds: targetIds,
      signatures: {},
    };

    onAddCircular(newDoc);
    setIsNewModalOpen(false);
    // Reset form
    setTitle('');
    setContent('');
    // Open dispatch drawer
    setActiveDispatchDoc(newDoc);
  };

  const handleCopyLink = (docId: string, staffId: string) => {
    const url = getDocumentSigningUrl(docId, staffId);
    navigator.clipboard.writeText(url);
    setCopiedLinkStaffId(staffId);
    setTimeout(() => setCopiedLinkStaffId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <span>التعاميم الإدارية الرسمية والتوقيع بالعلم</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إصدار التعاميم وإرسالها لجميع المعلمين والإداريين عبر الواتس أب مع رابط مباشر للتوقيع بالعلم
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
          <button
            id="btn-open-templates-library"
            type="button"
            onClick={() => setIsTemplatesModalOpen(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="فتح مكتبة قوالب وصيغ التعاميم الرسمية"
          >
            <Bookmark className="w-4 h-4 text-emerald-700" />
            <span>قوالب التعاميم</span>
            <span className="bg-emerald-100 text-emerald-900 text-[11px] font-black px-2 py-0.5 rounded-md border border-emerald-300">
              {templates.length}
            </span>
          </button>

          <button
            id="btn-create-new-circular"
            onClick={() => {
              setCircularNumber(`${currentYearDigits}/${Math.floor(100 + Math.random() * 900)}`);
              setHijriDate(`25 ربيع الأول ${schoolSettings.academicYear || '1448هـ'}`);
              setIsNewModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إصدار تعميم رسمي جديد</span>
          </button>
        </div>
      </div>

      {/* Circulars List */}
      <div className="grid grid-cols-1 gap-4">
        {circulars.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 border-r-4 border-r-slate-300 text-slate-400">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700 text-base">لا توجد تعاميم إدارية حالياً</h3>
            <p className="text-xs text-slate-400 mt-1">ابدأ بإصدار أول تعميم لمجمع الشريعة وإرساله عبر الواتس أب للموظفين</p>
          </div>
        ) : (
          circulars.map(doc => {
            const totalTarget = doc.targetStaffIds.length;
            const signedCount = Object.keys(doc.signatures).length;
            const percent = totalTarget > 0 ? Math.round((signedCount / totalTarget) * 100) : 0;
            const isCompleted = signedCount === totalTarget && totalTarget > 0;
            const isUrgent = doc.circularData?.priority === 'urgent';

            return (
              <div 
                key={doc.id}
                className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all p-5 border-r-4 ${
                  isUrgent ? 'border-r-amber-500' : 'border-r-emerald-600'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-md border border-emerald-300 font-mono border-r-2 border-r-emerald-600">
                        رقم: {doc.referenceNumber}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {doc.hijriDate}
                      </span>
                      {doc.circularData?.priority === 'urgent' && (
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-amber-300 border-r-2 border-r-amber-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          عاجل وهام
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {doc.circularData?.content}
                    </p>
                  </div>

                  {/* Signing Progress - Circular Ring with percentage inside */}
                  <div className="w-full sm:w-auto lg:w-72 bg-slate-50 border border-slate-200/80 border-r-4 border-r-emerald-600 rounded-2xl p-3 flex items-center gap-3.5 shrink-0 shadow-2xs">
                    <CircularProgress
                      percentage={percent}
                      size={54}
                      strokeWidth={5}
                      textSizeClass="text-xs font-black"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-0.5">
                        {isCompleted ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>اكتمل التوقيع بالعلم</span>
                          </span>
                        ) : (
                          <span className="text-slate-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>نسبة التوقيع بالعلم</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">
                        <span className="font-extrabold text-slate-900">{signedCount}</span> من <span className="font-extrabold text-slate-900">{totalTarget}</span> موظف
                      </div>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100/80 text-amber-900 border border-amber-300/60'
                      }`}>
                        {isCompleted ? 'مكتمل بنسبة 100%' : `المتبقي: ${totalTarget - signedCount} موظف`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>الفئة المستهدفة: </span>
                    <span className="font-semibold text-slate-700">
                      {doc.circularData?.targetAudience === 'all' ? 'جميع المعلمين والإداريين' :
                       doc.circularData?.targetAudience === 'teachers' ? 'جميع المعلمين' :
                       doc.circularData?.targetAudience === 'admins' ? 'الهيئة الإدارية' :
                       doc.circularData?.targetAudience === 'elementary' ? 'المرحلة الابتدائية' :
                       doc.circularData?.targetAudience === 'intermediate' ? 'المرحلة المتوسطة' :
                       doc.circularData?.targetAudience === 'secondary' ? 'المرحلة الثانوية' : 'قائمة مخصصة'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Send via WhatsApp Button */}
                    <button
                      onClick={() => setActiveDispatchDoc(doc)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>إرسال عبر الواتس أب ({totalTarget - signedCount} متبقي)</span>
                    </button>

                    {/* View Signatures Audit */}
                    <button
                      onClick={() => onOpenAuditModal(doc)}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                      <span>كشف التواقيع بالعلم ({signedCount})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* WhatsApp Dispatch Drawer / Modal */}
      {activeDispatchDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 border-r-6 border-r-emerald-600 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  إرسال التعميم عبر الواتس أب للموظفين
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {activeDispatchDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveDispatchDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="bg-emerald-50/70 border-b border-emerald-100 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
              <Send className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">آلية الإرسال والتوقيع بالعلم:</p>
                <p className="text-emerald-800 mt-0.5">
                  انقر على زر <span className="font-bold">"إرسال واتساب"</span> بجانب اسم الموظف لفتح تطبيق الواتساب مباشرة مع رسالة مجهزة تتضمن اسمه وسجله ورابط التعميم. يفتح الموظف الرابط على جواله، ويوقع إلكترونياً، ثم يضغط زر الإرسال ليعود الإشعار والتوقيع فوراً على جوال إدارة المجمع.
                </p>
              </div>
            </div>

            {/* Staff List with Action buttons */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100 text-xs sm:text-sm">
              {activeDispatchDoc.targetStaffIds.map((staffId, idx) => {
                const staff = staffList.find(s => s.id === staffId);
                if (!staff) return null;

                const signature = activeDispatchDoc.signatures[staffId];
                const isSigned = !!signature;
                const { url: waUrl } = generateStaffDispatchWhatsApp(staff, activeDispatchDoc, schoolSettings);

                return (
                  <div key={staff.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400 text-xs w-6">{idx + 1}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{staff.name}</span>
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {staff.roleTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>السجل: <span className="font-mono font-medium text-slate-700" dir="ltr">{maskNationalId(staff.nationalId)}</span></span>
                          <span>الجوال: <span className="font-mono font-medium text-slate-700" dir="ltr">{staff.phone}</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isSigned ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>تم التوقيع بالعلم</span>
                          <span className="text-[10px] text-emerald-600">({signature.formattedDate.split(' ')[0]})</span>
                        </div>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-xs font-semibold">
                          في انتظار التوقيع
                        </span>
                      )}

                      {/* Direct WhatsApp Send */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                          isSigned
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                        title="إرسال رسالة الواتس أب مع رابط التوقيع للموظف"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSigned ? 'إعادة إرسال' : 'إرسال واتساب'}</span>
                      </a>

                      {/* Copy Direct Link */}
                      <button
                        onClick={() => handleCopyLink(activeDispatchDoc.id, staff.id)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        title="نسخ رابط التعميم المخصص للموظف"
                      >
                        {copiedLinkStaffId === staff.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* Test Open Sign Portal for this teacher */}
                      <button
                        onClick={() => onOpenSignPortal(activeDispatchDoc.id, staff.id)}
                        className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors cursor-pointer"
                        title="فتح شاشة التوقيع كأنك الموظف (تجربة وتوقيع)"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 rounded-b-2xl">
              <span className="text-slate-500">
                إجمالي الموظفين المستهدفين: <strong className="text-slate-800">{activeDispatchDoc.targetStaffIds.length}</strong>
              </span>
              <button
                onClick={() => setActiveDispatchDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Circular Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 border-r-6 border-r-emerald-600 animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">إصدار تعميم إداري رسمي جديد</h3>
                <p className="text-xs text-slate-500 mt-0.5">مجمع الشريعة التعليمي للبنين - العام الدراسي {schoolSettings.academicYear}</p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic Templates Selector Bar */}
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 max-w-full sm:max-w-[70%]">
                <span className="font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-emerald-700" />
                  <span>نماذج سريعة:</span>
                </span>
                {templates.slice(0, 4).map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
                    title={`استدعاء قالب: ${tpl.name}`}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsTemplatesModalOpen(true)}
                className="shrink-0 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200/80 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                title="استعراض وتعديل كافة قوالب التعاميم"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>مكتبة القوالب ({templates.length})</span>
              </button>
            </div>

            {/* Success notice after saving a template */}
            {saveSuccessNotice && (
              <div className="mx-5 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{saveSuccessNotice}</span>
              </div>
            )}

            <form onSubmit={handleCreateCircular} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
              {/* Circular Number & Hijri Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم التعميم *</label>
                  <input
                    type="text"
                    value={circularNumber}
                    onChange={(e) => setCircularNumber(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    placeholder={`${currentYearDigits}/105`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التاريخ الهجري *</label>
                  <input
                    type="text"
                    value={hijriDate}
                    onChange={(e) => setHijriDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    placeholder={`25 ربيع الأول ${schoolSettings.academicYear || '1448هـ'}`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">درجة الأهمية</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  >
                    <option value="normal">عادي</option>
                    <option value="urgent">عاجل وهام</option>
                    <option value="top_urgent">سري وعاجل جداً</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">موضوع / عنوان التعميم *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: بشأن الانضباط المدرسي والإشراف اليومي والمناوبة"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-bold"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">المستهدفون بالتوقيع بالعلم *</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                >
                  <option value="all">جميع منسوبي مجمع الشريعة (معلمون وإداريون) - {staffList.length} موظف</option>
                  <option value="teachers">المعلمون فقط ({staffList.filter(s => s.role === 'teacher').length} معلم)</option>
                  <option value="admins">الهيئة الإدارية فقط ({staffList.filter(s => s.role !== 'teacher').length} موظف)</option>
                  <option value="elementary">المرحلة الابتدائية فقط</option>
                  <option value="intermediate">المرحلة المتوسطة فقط</option>
                  <option value="secondary">المرحلة الثانوية فقط</option>
                  <option value="custom">تحديد موظفين معينين</option>
                </select>
              </div>

              {/* If custom staff */}
              {targetAudience === 'custom' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-36 overflow-y-auto space-y-1">
                  <span className="text-xs font-bold text-slate-600 block mb-1">اختر الموظفين المستهدفين:</span>
                  {staffList.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-xs hover:bg-slate-100 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customStaffIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomStaffIds([...customStaffIds, s.id]);
                          } else {
                            setCustomStaffIds(customStaffIds.filter(id => id !== s.id));
                          }
                        }}
                      />
                      <span className="font-semibold text-slate-800">{s.name}</span>
                      <span className="text-slate-400">({s.roleTitle})</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Content with Save-as-Template trigger */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">نص التعميم الرسمي *</label>
                  <button
                    type="button"
                    onClick={handleOpenSaveAsTemplate}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors"
                    title="حفظ الصيغة الحالية كقالب معتمد للرجوع إليه وتعديله مستقبلاً"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>حفظ الصيغة كقالب جديد</span>
                  </button>
                </div>
                <textarea
                  rows={7}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب نص التعميم والتعليمات الصادرة لمنسوبي المجمع..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none leading-relaxed"
                />
              </div>

              {/* Action Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">تعليمات التوقيع بالعلم المطلوبة من الموظف</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>

              {/* Actions */}
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
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>اعتماد وإصدار التعميم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Draft As Template Modal */}
      {isSaveAsTemplateModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 border-r-6 border-r-emerald-600 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-emerald-700" />
                <h4 className="font-bold text-slate-900 text-base">حفظ الصيغة الحالية كقالب معتمد</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveAsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveAsTemplate} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم القالب التعريفي *</label>
                <input
                  type="text"
                  required
                  value={saveTemplateName}
                  onChange={(e) => setSaveTemplateName(e.target.value)}
                  placeholder="مثال: قالب تعميم الانضباط والدوام الصباحي"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">التصنيف الإداري للقالب *</label>
                <select
                  value={saveTemplateCategory}
                  onChange={(e) => setSaveTemplateCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm"
                >
                  <option value="انضباط ودوام">انضباط ودوام</option>
                  <option value="إشراف ومناوبة">إشراف ومناوبة</option>
                  <option value="شؤون تعليمية ونور">شؤون تعليمية ونور</option>
                  <option value="اختبارات وكنترول">اختبارات وكنترول</option>
                  <option value="أمن وسلامة">أمن وسلامة</option>
                  <option value="أنشطة وفعاليات">أنشطة وفعاليات</option>
                  <option value="عام">عام</option>
                </select>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div><strong className="text-slate-800">موضوع التعميم:</strong> {title || '—'}</div>
                <div><strong className="text-slate-800">المستهدفون:</strong> {targetAudience === 'all' ? 'الجميع' : targetAudience}</div>
                <div className="line-clamp-2 text-slate-500 mt-1"><strong className="text-slate-800">النص:</strong> {content}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSaveAsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد وحفظ القالب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Circular Templates Management Modal */}
      <CircularTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        templates={templates}
        onApplyTemplate={handleApplyTemplate}
        onSaveTemplate={handleSaveTemplate}
        onUpdateTemplate={handleUpdateTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onResetTemplates={handleResetTemplates}
      />
    </div>
  );
};

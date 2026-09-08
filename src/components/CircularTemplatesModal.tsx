import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Send, 
  Layers, 
  Bookmark, 
  FileText, 
  Tag, 
  Users, 
  Clock, 
  AlertCircle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { CircularTemplate } from '../types';
import { INITIAL_CIRCULAR_TEMPLATES } from '../data/sampleTemplates';

interface CircularTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: CircularTemplate[];
  onApplyTemplate: (template: CircularTemplate) => void;
  onSaveTemplate: (template: Omit<CircularTemplate, 'id' | 'createdAt'>) => void;
  onUpdateTemplate: (id: string, updates: Partial<CircularTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  onResetTemplates: () => void;
}

export const CircularTemplatesModal: React.FC<CircularTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  onApplyTemplate,
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onResetTemplates,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<CircularTemplate['category']>('انضباط ودوام');
  const [formAudience, setFormAudience] = useState<CircularTemplate['defaultAudience']>('all');
  const [formPriority, setFormPriority] = useState<CircularTemplate['priority']>('urgent');
  const [formInstructions, setFormInstructions] = useState('نأمل من جميع الزملاء التكرم بالاطلاع والتوقيع بالعلم عبر الرابط.');
  const [formContent, setFormContent] = useState('');

  if (!isOpen) return null;

  const categories: Array<{ id: string; label: string }> = [
    { id: 'الكل', label: 'كافة القوالب' },
    { id: 'انضباط ودوام', label: 'انضباط ودوام' },
    { id: 'إشراف ومناوبة', label: 'إشراف ومناوبة' },
    { id: 'شؤون تعليمية ونور', label: 'شؤون تعليمية ونور' },
    { id: 'اختبارات وكنترول', label: 'اختبارات وكنترول' },
    { id: 'أمن وسلامة', label: 'أمن وسلامة' },
    { id: 'أنشطة وفعاليات', label: 'أنشطة وفعاليات' },
    { id: 'عام', label: 'عام' },
  ];

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory === 'الكل' || t.category === selectedCategory;
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleStartCreate = () => {
    setEditingTemplateId(null);
    setFormName('');
    setFormTitle('');
    setFormCategory('انضباط ودوام');
    setFormAudience('all');
    setFormPriority('urgent');
    setFormInstructions('نأمل من جميع الزملاء التكرم بالاطلاع والتوقيع بالعلم عبر الرابط.');
    setFormContent('');
    setIsCreatingOrEditing(true);
  };

  const handleStartEdit = (tpl: CircularTemplate) => {
    setEditingTemplateId(tpl.id);
    setFormName(tpl.name);
    setFormTitle(tpl.title);
    setFormCategory(tpl.category);
    setFormAudience(tpl.defaultAudience || 'all');
    setFormPriority(tpl.priority || 'normal');
    setFormInstructions(tpl.instructions || '');
    setFormContent(tpl.content);
    setIsCreatingOrEditing(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTitle.trim() || !formContent.trim()) {
      alert('يرجى ملء اسم القالب وموضوع التعميم ومحتواه.');
      return;
    }

    if (editingTemplateId) {
      onUpdateTemplate(editingTemplateId, {
        name: formName.trim(),
        title: formTitle.trim(),
        category: formCategory,
        defaultAudience: formAudience,
        priority: formPriority,
        instructions: formInstructions.trim(),
        content: formContent.trim(),
      });
    } else {
      onSaveTemplate({
        name: formName.trim(),
        title: formTitle.trim(),
        category: formCategory,
        defaultAudience: formAudience,
        priority: formPriority,
        instructions: formInstructions.trim(),
        content: formContent.trim(),
        isSystemDefault: false,
      });
    }

    setIsCreatingOrEditing(false);
    setEditingTemplateId(null);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getAudienceLabel = (aud: CircularTemplate['defaultAudience']) => {
    switch (aud) {
      case 'all': return 'جميع المنسوبين';
      case 'teachers': return 'المعلمون فقط';
      case 'admins': return 'الهيئة الإدارية';
      case 'elementary': return 'المرحلة الابتدائية';
      case 'intermediate': return 'المرحلة المتوسطة';
      case 'secondary': return 'المرحلة الثانوية';
      default: return 'مخصص';
    }
  };

  const getCategoryBorderClass = (cat: CircularTemplate['category']) => {
    switch (cat) {
      case 'انضباط ودوام': return 'border-r-emerald-600';
      case 'إشراف ومناوبة': return 'border-r-amber-500';
      case 'اختبارات وكنترول': return 'border-r-rose-600';
      case 'شؤون تعليمية ونور': return 'border-r-indigo-600';
      case 'أمن وسلامة': return 'border-r-orange-500';
      case 'أنشطة وفعاليات': return 'border-r-teal-600';
      default: return 'border-r-slate-500';
    }
  };

  const getCategoryBadgeClass = (cat: CircularTemplate['category']) => {
    switch (cat) {
      case 'انضباط ودوام': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'إشراف ومناوبة': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'اختبارات وكنترول': return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'شؤون تعليمية ونور': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'أمن وسلامة': return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'أنشطة وفعاليات': return 'bg-teal-50 text-teal-800 border-teal-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 border-r-6 border-r-emerald-600 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shadow-xs">
              <Bookmark className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">نظام قوالب وصيغ التعاميم الرسمية</h3>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                  {templates.length} قالب جاهز
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                حفظ واسترجاع الصيغ المدرسية المتكررة وإصدار التعاميم المعتمدة بضغطة زر واحدة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Subheader bar */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {!isCreatingOrEditing ? (
            <>
              {/* Search input */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث في أسماء ونصوص القوالب..."
                  className="w-full pl-3 pr-9 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء قالب جديد</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('هل ترغب في استعادة القوالب النموذجية الأساسية لمجمع الشريعة؟')) {
                      onResetTemplates();
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                  title="استعادة القوالب الافتراضية للمجمع"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-emerald-700" />
                <span>{editingTemplateId ? 'تعديل بيانات القالب المعتمد' : 'إنشاء قالب تعميم جديد في النظام'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingOrEditing(false)}
                className="text-xs text-slate-600 hover:text-slate-800 px-3 py-1 bg-white border border-slate-200 rounded-lg"
              >
                العودة لقائمة القوالب
              </button>
            </div>
          )}
        </div>

        {/* Category Pills (Only when viewing list) */}
        {!isCreatingOrEditing && (
          <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-slate-100 overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isCreatingOrEditing ? (
            /* Create / Edit Form */
            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Template Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم القالب التعريفي *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: قالب تنبيه الانضباط قبل الإجازات المطولة"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-xs sm:text-sm"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التصنيف الإداري *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
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
              </div>

              {/* Circular Title / Subject */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">موضوع / عنوان التعميم الافتراضي *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: تعميم بشأن الالتزام بالدوام الرسمي والحضور الصباحي المبكر"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-bold text-xs sm:text-sm"
                />
              </div>

              {/* Default Audience & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المستهدفون الافتراضيون بالتوقيع</label>
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm"
                  >
                    <option value="all">جميع منسوبي مجمع الشريعة (معلمون وإداريون)</option>
                    <option value="teachers">المعلمون فقط</option>
                    <option value="admins">الهيئة الإدارية فقط</option>
                    <option value="elementary">المرحلة الابتدائية فقط</option>
                    <option value="intermediate">المرحلة المتوسطة فقط</option>
                    <option value="secondary">المرحلة الثانوية فقط</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">درجة الأهمية الافتراضية</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm"
                  >
                    <option value="normal">عادي</option>
                    <option value="urgent">عاجل وهام</option>
                    <option value="top_urgent">سري وعاجل جداً</option>
                  </select>
                </div>
              </div>

              {/* Full Content */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">نص التعميم الرسمي المعتمد في القالب *</label>
                <textarea
                  rows={8}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="اكتب صيغة التعميم والبنود والتعليمات الرسمية..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none leading-relaxed text-xs sm:text-sm"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">تعليمات التوقيع بالعلم الافتراضية</label>
                <input
                  type="text"
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-xs sm:text-sm"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingOrEditing(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTemplateId ? 'حفظ تعديلات القالب' : 'اعتماد وحفظ القالب الجديد'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Templates List */
            <>
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                  <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">لم يتم العثور على قوالب تطابق البحث</p>
                  <p className="text-xs text-slate-400 mt-1">يمكنك إنشاء قالب جديد أو تغيير تصنيف البحث.</p>
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء أول قالب جديد</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredTemplates.map((tpl) => {
                    const isExpanded = expandedTemplateId === tpl.id;
                    const borderClass = getCategoryBorderClass(tpl.category);
                    const badgeClass = getCategoryBadgeClass(tpl.category);

                    return (
                      <div
                        key={tpl.id}
                        className={`bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between border-r-4 ${borderClass}`}
                      >
                        <div>
                          {/* Top row: Badges & Name */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeClass} mb-1.5`}>
                                {tpl.category}
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm leading-snug">
                                {tpl.name}
                              </h4>
                            </div>

                            {/* Audience Chip */}
                            <span className="shrink-0 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                              {getAudienceLabel(tpl.defaultAudience)}
                            </span>
                          </div>

                          {/* Default Subject */}
                          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2.5">
                            <strong className="text-slate-800">الموضوع:</strong> {tpl.title}
                          </div>

                          {/* Content Snippet */}
                          <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/80 mb-3">
                            <p className={isExpanded ? 'whitespace-pre-line' : 'line-clamp-3 whitespace-pre-line'}>
                              {tpl.content}
                            </p>
                            {tpl.content.length > 150 && (
                              <button
                                type="button"
                                onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                                className="text-[11px] text-emerald-700 font-bold hover:underline mt-1 block cursor-pointer"
                              >
                                {isExpanded ? 'عرض أقل ▴' : 'عرض نص القالب كاملاً ▾'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Actions bar */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyText(tpl.id, tpl.content)}
                              className="p-1.5 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                              title="نسخ نص القالب"
                            >
                              {copiedId === tpl.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEdit(tpl)}
                              className="p-1.5 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                              title="تعديل هذا القالب"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف قالب "${tpl.name}"؟`)) {
                                  onDeleteTemplate(tpl.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                              title="حذف القالب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Primary Use Button */}
                          <button
                            type="button"
                            onClick={() => {
                              onApplyTemplate(tpl);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>استخدام في تعميم جديد</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 rounded-b-2xl">
          <div className="flex items-center gap-2 text-slate-500">
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>يتم حفظ وتحديث القوالب محلياً وبشكل دائم لإدارة المجمع التعليمي</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

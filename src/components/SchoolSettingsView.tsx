import React, { useState } from 'react';
import { 
  Building2, 
  Smartphone, 
  User, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  Send,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { SchoolSettings } from '../types';
import { formatSaudiPhone } from '../utils/whatsapp';
import { MoeLogo } from './MoeLogo';

interface SchoolSettingsViewProps {
  settings: SchoolSettings;
  onSaveSettings: (settings: SchoolSettings) => void;
  onResetToDefaults: () => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetToDefaults,
}) => {
  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestWhatsApp = () => {
    const cleanPhone = formatSaudiPhone(formData.adminPhone);
    const text = encodeURIComponent(`تجربة اتصال: مرحباً بكم في منظومة التواصل بمجمع الشريعة التعليمي للبنين.`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 border-r-4 border-r-emerald-600 shadow-xs">
        <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
          <div className="p-1.5 rounded-xl bg-white border border-slate-200/90 border-r-4 border-r-emerald-600 shadow-2xs flex items-center justify-center shrink-0 ring-2 ring-emerald-600/20">
            <MoeLogo size="md" className="h-10 w-auto" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              إعدادات مجمع الشريعة التعليمي للبنين • منظومة التواصل
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              تهيئة البيانات الرسمية للإدارة العامة للتعليم بجازان ورقم جوال الواتساب لاستقبال التواقيع والإفادات
            </p>
          </div>
        </div>

        {/* WhatsApp Receiving Phone Highlight Card */}
        <div className="my-5 p-5 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 border-2 border-emerald-300/90 border-r-6 border-r-emerald-600 rounded-2xl space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-sm">
            <Smartphone className="w-5 h-5 text-emerald-700" />
            <span>رقم جوال إدارة المجمع المستلم للردود والتواقيع (الواتس أب):</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            هذا هو الرقم المعتمد الذي سيعيد المعلمون والموظفون إرسال وثائق التوقيع بالعلم وأوراق المساءلة والإفادات إليه بنقرة واحدة بعد توقيعهم.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1.5">
            <input
              type="text"
              value={formData.adminPhone}
              onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
              placeholder="مثال: 0501234567"
              className="px-4 py-2.5 bg-white border-2 border-emerald-400 rounded-xl font-mono text-base font-black text-emerald-950 focus:ring-2 focus:ring-emerald-500/30 outline-none dir-ltr text-center sm:text-right shadow-2xs"
            />
            <button
              type="button"
              onClick={handleTestWhatsApp}
              className="flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="تجربة فتح محادثة الواتس أب مع هذا الرقم للتأكد من صحته"
            >
              <Send className="w-4 h-4" />
              <span>تجربة إرسال رسالة تجريبية للرقم</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* School Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">اسم المنشأة التعليمية *</label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">الرقم الإحصائي / الوزاري</label>
              <input
                type="text"
                value={formData.schoolCode}
                onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
                className="w-full px-3.5 py-2.5 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-slate-800"
              />
            </div>
          </div>

          {/* Principal & Vice Principal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">اسم مدير المجمع التعليمي *</label>
              <input
                type="text"
                value={formData.principalName}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">اسم وكيل شؤون المعلمين والموظفين *</label>
              <input
                type="text"
                value={formData.vicePrincipalName}
                onChange={(e) => setFormData({ ...formData, vicePrincipalName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Education Department & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">الإدارة العامة للتعليم *</label>
              <input
                type="text"
                value={formData.educationDepartment}
                onChange={(e) => setFormData({ ...formData, educationDepartment: e.target.value })}
                placeholder="الإدارة العامة للتعليم بجازان"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-800">العام الدراسي *</label>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                  العام الحالي المعتمد: 1446هـ
                </span>
              </div>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="1446هـ"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-slate-900"
              />
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">خيارات سريعة:</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, academicYear: '1446هـ' })}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                    formData.academicYear === '1446هـ'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  1446هـ (المعتمد)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, academicYear: '1446 - 1447هـ' })}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                    formData.academicYear === '1446 - 1447هـ'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  1446 - 1447هـ
                </button>
              </div>
            </div>
          </div>

          {/* Optional Office Field (Clean & Empty by default) */}
          {formData.officeName && (
            <div>
              <label className="block font-bold text-slate-800 mb-1">مكتب التعليم (اختياري)</label>
              <input
                type="text"
                value={formData.officeName}
                onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                placeholder="اتركه فارغاً إذا لم ينطبق"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-slate-900"
              />
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (confirm('هل ترغب في إعادة ضبط البيانات إلى الحالة الافتراضية النموذجية لمجمع الشريعة؟')) {
                  onResetToDefaults();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>استعادة البيانات النموذجية الافتراضية</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>حفظ الإعدادات والتحديث</span>
            </button>
          </div>

          {isSaved && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold text-center animate-in fade-in">
              تم حفظ الإعدادات بنجاح!
            </div>
          )}
        </form>
      </div>

      {/* Guide Card */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-3 text-xs text-slate-600 leading-relaxed">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
          <HelpCircle className="w-4 h-4 text-emerald-700" />
          <span>دورة إرسال واستلام التعاميم والمساءلات عبر الواتس أب:</span>
        </h4>
        <ol className="list-decimal list-inside space-y-1.5 pr-1 font-medium">
          <li><strong>إدارة المجمع</strong> تصدر التعميم أو ورقة المساءلة وتحدد الموظفين المستهدفين بسجلاتهم الوطنية وأرقامهم.</li>
          <li>تضغط الإدارة على <strong>"إرسال واتساب"</strong> لتوجيه رسالة رسمية لكل موظف تحوي اسمه ورابط المستند المخصص له.</li>
          <li>الموظف يفتح الرابط على جواله، ويقرأ التعميم، ويكتب إفادته (في حال المساءلة)، ويوقع بيده على الشاشة.</li>
          <li>يضغط الموظف على <strong>"اعتماد وإرسال لجوال إدارة المدرسة عبر الواتس أب"</strong>.</li>
          <li>يتم توجيه رسالة تأكيد رسمية مباشرة إلى جوال إدارة المدرسة بالواتساب تتضمن اسم الموظف وسجله وإفادته ورمز التوثيق ورابط الوثيقة الموقعة.</li>
        </ol>
      </div>
    </div>
  );
};

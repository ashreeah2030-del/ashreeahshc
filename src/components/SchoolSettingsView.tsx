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
  AlertCircle,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  PenTool,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { SchoolSettings } from '../types';
import { formatSaudiPhone } from '../utils/whatsapp';
import { MoeLogo } from './MoeLogo';
import { PrincipalSignature } from './PrincipalSignature';

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
  const [formData, setFormData] = useState<SchoolSettings>({ 
    ...settings,
    adminPassword: settings.adminPassword || 'admin',
    adminUsername: settings.adminUsername || 'admin'
  });
  const [isSaved, setIsSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const handleUpdatePassword = () => {
    setPassError('');
    const cleanNew = newPassInput.trim();
    if (!cleanNew || cleanNew.length < 4) {
      setPassError('فضلاً أدخل رمز دخول لا يقل عن 4 خانات');
      return;
    }
    if (cleanNew !== confirmPassInput.trim()) {
      setPassError('الرمز الجديد غير متطابق مع حقل التأكيد');
      return;
    }

    const updated = { ...formData, adminPassword: cleanNew };
    setFormData(updated);
    onSaveSettings(updated);
    setPassSuccess(true);
    setNewPassInput('');
    setConfirmPassInput('');
    setTimeout(() => setPassSuccess(false), 3000);
  };

  const handleResetPasswordDefault = () => {
    if (confirm('هل ترغب في إعادة ضبط رمز الدخول للإدارة؟')) {
      const updated = { ...formData, adminPassword: 'admin' };
      setFormData(updated);
      onSaveSettings(updated);
      setPassSuccess(true);
      setTimeout(() => setPassSuccess(false), 3000);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Auto color-keying to remove white / light backgrounds
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luminance = (r * 0.299 + g * 0.587 + b * 0.114);
          if (luminance > 220) {
            data[i + 3] = 0; // Transparent
          } else if (luminance > 195) {
            const factor = (220 - luminance) / 25;
            data[i + 3] = Math.round(data[i + 3] * factor);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentDataUrl = canvas.toDataURL('image/png');
        const updated = { ...formData, principalSignatureUrl: transparentDataUrl };
        setFormData(updated);
        onSaveSettings(updated);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetOfficialSignature = () => {
    const updated = { ...formData, principalSignatureUrl: '/principal_signature.svg' };
    setFormData(updated);
    onSaveSettings(updated);
  };

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
              placeholder="مثال: 0509205097"
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

          {/* Official Principal Signature Card (Transparent background) */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    توقيع مدير المجمع التعليمي المعتمد (بدون خلفية)
                  </h4>
                  <p className="text-xs text-slate-500">
                    التوقيع الرسمي لمدير المجمع مفرّغ بدون خلفية للاستخدام الإداري، يظهر تلقائياً في كشوفات التوثيق وشهادات الشكر
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300/80 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  بدون خلفية (شفاف 100%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200">
              {/* Signature Preview against a subtle checkerboard pattern representing transparency */}
              <div className="sm:col-span-6 flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]">
                <PrincipalSignature 
                  customUrl={formData.principalSignatureUrl} 
                  className="w-48 h-20 object-contain drop-shadow-xs" 
                />
                <span className="text-[10px] text-slate-500 font-semibold mt-1">
                  المعاينة الحية: التوقيع شفاف تماماً فوق أي مستند أو خلفية
                </span>
              </div>

              {/* Signature Control Actions */}
              <div className="sm:col-span-6 space-y-2.5 text-xs">
                <div className="text-slate-700">
                  <p className="font-bold text-slate-800">المدير المعتمد:</p>
                  <p className="text-emerald-950 font-black text-sm">{formData.principalName}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer transition-all shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>تغيير / رفع توقيع مفرغ</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetOfficialSignature}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all border border-slate-200 cursor-pointer"
                    title="استعادة التوقيع الرسمي الافتراضي"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الرسمي</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  ⚡ نظام إزالة الخلفية التلقائي: عند رفع أي صورة توقيع، يتم تفريغ خلفيتها البيضاء وجعلها شفافة بالكامل تلقائياً.
                </p>
              </div>
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
                  العام الحالي المعتمد: 1448هـ
                </span>
              </div>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="1448هـ"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-slate-900"
              />
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">خيارات سريعة:</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, academicYear: '1448هـ' })}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                    formData.academicYear === '1448هـ'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  1448هـ (المعتمد)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, academicYear: '1448 - 1449هـ' })}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                    formData.academicYear === '1448 - 1449هـ'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  1448 - 1449هـ
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

          {/* System Security & Access Passcode Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                      <span>رمز الدخول وكلمة مرور إدارة المنظومة</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">
                        حماية لوحة التحكم
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      تخصيص الرمز السري المستخدم في تسجيل دخول إدارة المجمع (المدير والوكلاء) لإصدار التعاميم ومتابعة التواقيع
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  <span className="text-xs text-slate-300">الرمز المعتمد حالياً:</span>
                  <span className="font-mono font-black text-amber-300 tracking-wider text-xs">
                    {showPass ? (formData.adminPassword || 'admin') : '••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-slate-400 hover:text-white mr-1 cursor-pointer"
                    title={showPass ? 'إخفاء الرمز' : 'إظهار الرمز الحالي'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passSuccess && (
                <div className="p-3 bg-emerald-900/80 border border-emerald-500 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تم تحديث وحفظ رمز الدخول للمنظومة بنجاح! يمكنك استخدامه الآن في تسجيل الدخول.</span>
                </div>
              )}

              {passError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500 text-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    رمز الدخول الجديد (PIN أو كلمة مرور):
                  </label>
                  <input
                    type="password"
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="أدخل الرمز أو كلمة المرور الجديدة"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none text-xs sm:text-sm font-mono font-bold text-white dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    تأكيد رمز الدخول الجديد:
                  </label>
                  <input
                    type="password"
                    value={confirmPassInput}
                    onChange={(e) => setConfirmPassInput(e.target.value)}
                    placeholder="أعد كتابة الرمز للتأكيد"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none text-xs sm:text-sm font-mono font-bold text-white dir-ltr text-right"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetPasswordDefault}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs transition-colors cursor-pointer flex items-center gap-1.5 w-fit"
                  title="إعادة ضبط الرمز"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>إعادة ضبط الرمز</span>
                </button>

                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-5 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>تحديث رمز الدخول</span>
                </button>
              </div>
            </div>
          </div>

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

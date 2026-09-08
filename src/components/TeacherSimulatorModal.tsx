import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Smartphone, 
  User, 
  FileText, 
  AlertTriangle,
  Send
} from 'lucide-react';
import { DispatchedDocument, StaffMember } from '../types';

interface TeacherSimulatorModalProps {
  staffList: StaffMember[];
  documents: DispatchedDocument[];
  onOpenDocForStaff: (docId: string, staffId: string) => void;
  onClose: () => void;
}

export const TeacherSimulatorModal: React.FC<TeacherSimulatorModalProps> = ({
  staffList,
  documents,
  onOpenDocForStaff,
  onClose,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || '');
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || '');

  const handleStartSimulating = () => {
    if (!selectedDocId || !selectedStaffId) return;
    onOpenDocForStaff(selectedDocId, selectedStaffId);
    onClose();
  };

  const selectedStaff = staffList.find(s => s.id === selectedStaffId);
  const selectedDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 border-r-6 border-r-amber-500 animate-in fade-in zoom-in duration-150 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                تجربة بوابة الموظف (استلام وتوقيع بالعلم)
              </h3>
              <p className="text-xs text-slate-500">
                شاهد كيف تظهر الوثيقة على جوال المعلم وجرب التوقيع بيدك
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          {/* Pick Staff Member */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              اختر الموظف (المعلم / الإداري):
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-slate-800"
            >
              {staffList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.roleTitle} (سجل: {s.nationalId})
                </option>
              ))}
            </select>
          </div>

          {/* Pick Document */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              اختر التعميم أو ورقة المساءلة:
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-semibold text-slate-800"
            >
              {documents.map(d => (
                <option key={d.id} value={d.id}>
                  [{d.type === 'circular' ? 'تعميم' : 'مساءلة'}] {d.title} (رقم: {d.referenceNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Preview Info */}
          {selectedStaff && selectedDoc && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 border-r-4 border-r-amber-500 rounded-xl text-xs space-y-1.5 text-slate-700">
              <p>👤 <strong>الموظف:</strong> {selectedStaff.name} ({selectedStaff.roleTitle})</p>
              <p>🆔 <strong>السجل المدني:</strong> {selectedStaff.nationalId}</p>
              <p>📱 <strong>رقم الجوال:</strong> <span dir="ltr">{selectedStaff.phone}</span></p>
              <p>📄 <strong>نوع المستند:</strong> {selectedDoc.type === 'circular' ? 'تعميم رسمي' : 'ورقة مساءلة'}</p>
              <p>
                ✍️ <strong>حالة التوقيع:</strong>{' '}
                {selectedDoc.signatures[selectedStaff.id] ? (
                  <span className="text-emerald-700 font-bold">تم التوقيع بالعلم مسبقاً</span>
                ) : (
                  <span className="text-amber-700 font-bold">لم يوقع بعد (جاهز للتوقيع)</span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleStartSimulating}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>فتح واجهة توقيع المعلم الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
};

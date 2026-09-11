import React, { useState } from 'react';
import { 
  FileCheck, 
  Printer, 
  Search, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Users, 
  Send,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
  BarChart3
} from 'lucide-react';
import { DispatchedDocument, StaffMember, SchoolSettings } from '../types';
import { generateStaffDispatchWhatsApp } from '../utils/whatsapp';
import { CircularProgress } from './CircularProgress';
import { maskNationalId } from '../utils/formatters';

interface AuditsManagerProps {
  documents: DispatchedDocument[];
  staffList: StaffMember[];
  schoolSettings: SchoolSettings;
  onOpenAuditModal: (doc: DispatchedDocument) => void;
  onOpenSignPortal: (docId: string, staffId: string) => void;
  onNavigateToReports?: () => void;
}

export const AuditsManager: React.FC<AuditsManagerProps> = ({
  documents,
  staffList,
  schoolSettings,
  onOpenAuditModal,
  onOpenSignPortal,
  onNavigateToReports,
}) => {
  const [docFilter, setDocFilter] = useState<'all' | 'circular' | 'inquiry'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter(doc => {
    const matchesFilter = docFilter === 'all' ? true : doc.type === docFilter;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate pending staff across all docs
  const pendingItems: { doc: DispatchedDocument; staff: StaffMember }[] = [];
  documents.forEach(doc => {
    doc.targetStaffIds.forEach(staffId => {
      if (!doc.signatures[staffId]) {
        const staff = staffList.find(s => s.id === staffId);
        if (staff) {
          pendingItems.push({ doc, staff });
        }
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-700" />
            <span>كشوفات التوقيع بالعلم وأرشيف التوثيق</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            متابعة توثيق التواقيع بالعلم، طباعة الكشوفات الرسمية، وتتبع التزام منسوبي المجمع
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToReports && (
            <button
              id="btn-nav-to-reports"
              onClick={onNavigateToReports}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="الانتقال إلى شاشة التقارير والرسوم البيانية لمعدلات الاستجابة وتصنيف الموظفين"
            >
              <BarChart3 className="w-4 h-4" />
              <span>الرسوم البيانية والتقارير</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة تقرير عام</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setDocFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              docFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            جميع الوثائق ({documents.length})
          </button>
          <button
            onClick={() => setDocFilter('circular')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              docFilter === 'circular' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            التعاميم ({documents.filter(d => d.type === 'circular').length})
          </button>
          <button
            onClick={() => setDocFilter('inquiry')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              docFilter === 'inquiry' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المساءلات ({documents.filter(d => d.type === 'inquiry').length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الوثيقة أو العنوان..."
            className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3.5 px-4">نوع الوثيقة</th>
                <th className="py-3.5 px-4">رقم الوثيقة</th>
                <th className="py-3.5 px-4">الموضوع / العنوان</th>
                <th className="py-3.5 px-4">التاريخ</th>
                <th className="py-3.5 px-4">المستهدفون</th>
                <th className="py-3.5 px-4">نسبة التوقيع بالعلم</th>
                <th className="py-3.5 px-4 text-center">الكشف والطباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map(doc => {
                const totalTarget = doc.targetStaffIds.length;
                const signedCount = Object.keys(doc.signatures).length;
                const percent = totalTarget > 0 ? Math.round((signedCount / totalTarget) * 100) : 0;
                const isCompleted = signedCount === totalTarget && totalTarget > 0;

                return (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      {doc.type === 'circular' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
                          <FileText className="w-3.5 h-3.5" />
                          <span>تعميم رسمي</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>ورقة مساءلة</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {doc.referenceNumber}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {doc.title}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                      {doc.hijriDate}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {totalTarget} موظف
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <CircularProgress
                          percentage={percent}
                          size={44}
                          strokeWidth={4.5}
                          textSizeClass="text-[10px] font-black"
                        />
                        <div className="text-right">
                          <span className="font-bold text-xs text-slate-800 block">
                            {signedCount} من {totalTarget}
                          </span>
                          <span className={`text-[10px] font-semibold block ${isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {isCompleted ? 'اكتمل التوقيع' : `متبقي ${totalTarget - signedCount}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onOpenAuditModal(doc)}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>عرض كشف التواقيع</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Signatures Watchlist */}
      {pendingItems.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-amber-200 border-r-4 border-r-amber-500 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>قائمة الموظفين المطلوب منهم التوقيع بالعلم حالياً ({pendingItems.length})</span>
            </h3>
            <span className="text-xs text-slate-400">يمكن إرسال تذكير فوري عبر الواتس أب</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {pendingItems.map(({ doc, staff }, idx) => {
              const { url: waUrl } = generateStaffDispatchWhatsApp(staff, doc, schoolSettings);
              return (
                <div key={`${doc.id}-${staff.id}`} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{staff.name}</span>
                    <span className="text-slate-400 mr-2">({staff.roleTitle})</span>
                    <span className="text-slate-500 mr-2 font-mono" dir="ltr">سجل: {maskNationalId(staff.nationalId)}</span>
                    <span className="block text-[11px] text-emerald-800 mt-0.5">
                      مطلوب توقيعه على: <strong>{doc.title}</strong> (رقم: {doc.referenceNumber})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>تذكير بالواتساب</span>
                    </a>

                    <button
                      onClick={() => onOpenSignPortal(doc.id, staff.id)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title="فتح شاشة التوقيع"
                    >
                      توقيع
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

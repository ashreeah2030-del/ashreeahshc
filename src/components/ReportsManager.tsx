import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  FileCheck,
  Search,
  Printer,
  Calendar,
  Send,
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
  Filter
} from 'lucide-react';
import { DispatchedDocument, StaffMember, SchoolSettings, StaffRole } from '../types';
import { formatSaudiPhone } from '../utils/whatsapp';
import { CircularProgress } from './CircularProgress';
import { MoeLogo } from './MoeLogo';

interface ReportsManagerProps {
  documents: DispatchedDocument[];
  staffList: StaffMember[];
  schoolSettings: SchoolSettings;
  onOpenAuditModal?: (doc: DispatchedDocument) => void;
  onOpenSignPortal?: (docId: string, staffId: string) => void;
}

type ComplianceTier = 'all' | 'high' | 'good' | 'medium' | 'low';

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  documents,
  staffList,
  schoolSettings,
  onOpenAuditModal,
  onOpenSignPortal,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '30days' | 'currentTerm'>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<'all' | 'circular' | 'inquiry'>('all');
  const [selectedTier, setSelectedTier] = useState<ComplianceTier>('all');
  const [staffSearch, setStaffSearch] = useState('');

  // 1. Filtered Documents according to top controls
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      if (docTypeFilter !== 'all' && doc.type !== docTypeFilter) return false;
      return true;
    });
  }, [documents, docTypeFilter]);

  // 2. Compute Staff Compliance Metrics
  const staffComplianceData = useMemo(() => {
    return staffList.map(staff => {
      // Find all docs targeting this staff
      const targetedDocs = filteredDocs.filter(d => d.targetStaffIds.includes(staff.id));
      const totalTargeted = targetedDocs.length;
      const signedDocs = targetedDocs.filter(d => !!d.signatures[staff.id]);
      const signedCount = signedDocs.length;
      const pendingCount = totalTargeted - signedCount;

      const rate = totalTargeted > 0 ? Math.round((signedCount / totalTargeted) * 100) : 100;

      let tier: 'high' | 'good' | 'medium' | 'low' = 'high';
      let tierLabel = 'متميز وملتزم جداً';
      let tierColor = '#059669'; // emerald-600
      let tierBadgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';

      if (totalTargeted === 0) {
        tier = 'high';
        tierLabel = 'لا توجد وثائق معلقة';
        tierColor = '#059669';
        tierBadgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      } else if (rate >= 90) {
        tier = 'high';
        tierLabel = 'متميز وملتزم (90%-100%)';
        tierColor = '#059669';
        tierBadgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      } else if (rate >= 75) {
        tier = 'good';
        tierLabel = 'التزام جيد (75%-89%)';
        tierColor = '#0284c7';
        tierBadgeBg = 'bg-sky-50 text-sky-800 border-sky-300';
      } else if (rate >= 50) {
        tier = 'medium';
        tierLabel = 'يحتاج متابعة (50%-74%)';
        tierColor = '#d97706';
        tierBadgeBg = 'bg-amber-50 text-amber-800 border-amber-300';
      } else {
        tier = 'low';
        tierLabel = 'منخفض الالتزام (<50%)';
        tierColor = '#e11d48';
        tierBadgeBg = 'bg-rose-50 text-rose-800 border-rose-300';
      }

      return {
        staff,
        totalTargeted,
        signedCount,
        pendingCount,
        rate,
        tier,
        tierLabel,
        tierColor,
        tierBadgeBg,
        pendingDocIds: targetedDocs.filter(d => !d.signatures[staff.id]).map(d => d.id)
      };
    });
  }, [staffList, filteredDocs]);

  // 3. Categorization Distribution for Pie Chart
  const tierDistribution = useMemo(() => {
    let high = 0;
    let good = 0;
    let medium = 0;
    let low = 0;

    staffComplianceData.forEach(item => {
      if (item.tier === 'high') high++;
      else if (item.tier === 'good') good++;
      else if (item.tier === 'medium') medium++;
      else if (item.tier === 'low') low++;
    });

    const total = staffList.length || 1;

    return [
      {
        name: 'متميز وملتزم جداً (90-100%)',
        count: high,
        percentage: Math.round((high / total) * 100),
        color: '#059669',
        tierKey: 'high' as const
      },
      {
        name: 'التزام جيد (75-89%)',
        count: good,
        percentage: Math.round((good / total) * 100),
        color: '#0284c7',
        tierKey: 'good' as const
      },
      {
        name: 'يحتاج متابعة (50-74%)',
        count: medium,
        percentage: Math.round((medium / total) * 100),
        color: '#d97706',
        tierKey: 'medium' as const
      },
      {
        name: 'منخفض الالتزام (<50%)',
        count: low,
        percentage: Math.round((low / total) * 100),
        color: '#e11d48',
        tierKey: 'low' as const
      },
    ];
  }, [staffComplianceData, staffList.length]);

  // 4. Time-series Response Rates (Timeline Chart)
  const timelineData = useMemo(() => {
    // Sort documents chronologically by date or createdAt
    const sortedDocs = [...documents].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date).getTime();
      const dateB = new Date(b.createdAt || b.date).getTime();
      return dateA - dateB;
    });

    return sortedDocs.map((doc, index) => {
      const total = doc.targetStaffIds.length;
      const signed = Object.keys(doc.signatures).length;
      const rate = total > 0 ? Math.round((signed / total) * 100) : 100;
      
      const shortRef = doc.referenceNumber ? doc.referenceNumber.replace(/^1446\//, '#') : `وثيقة ${index + 1}`;
      const shortTitle = doc.title.length > 25 ? doc.title.slice(0, 25) + '...' : doc.title;

      return {
        id: doc.id,
        name: shortRef,
        fullTitle: doc.title,
        date: doc.hijriDate || doc.date,
        type: doc.type === 'circular' ? 'تعميم' : 'مساءلة',
        circularRate: doc.type === 'circular' ? rate : null,
        inquiryRate: doc.type === 'inquiry' ? rate : null,
        overallRate: rate,
        signed,
        total,
        pending: total - signed
      };
    });
  }, [documents]);

  // 5. Compliance by Role / Department Bar Chart
  const roleComplianceData = useMemo(() => {
    const roleMap: Record<string, { totalReq: number; totalSign: number; count: number }> = {
      'teacher': { totalReq: 0, totalSign: 0, count: 0 },
      'admin': { totalReq: 0, totalSign: 0, count: 0 },
      'vice_principal': { totalReq: 0, totalSign: 0, count: 0 },
      'counselor': { totalReq: 0, totalSign: 0, count: 0 },
      'other': { totalReq: 0, totalSign: 0, count: 0 }
    };

    staffComplianceData.forEach(item => {
      let key = 'other';
      if (item.staff.role === 'teacher') key = 'teacher';
      else if (item.staff.role === 'admin') key = 'admin';
      else if (item.staff.role === 'vice_principal') key = 'vice_principal';
      else if (item.staff.role === 'counselor') key = 'counselor';

      roleMap[key].count += 1;
      roleMap[key].totalReq += item.totalTargeted;
      roleMap[key].totalSign += item.signedCount;
    });

    const labels: Record<string, string> = {
      'teacher': 'المعلمون',
      'admin': 'الإدارة المدرسية',
      'vice_principal': 'وكلاء المجمع',
      'counselor': 'التوجيه الطلابي',
      'other': 'باقي المنسوبين'
    };

    return Object.entries(roleMap)
      .filter(([_, data]) => data.count > 0)
      .map(([key, data]) => {
        const rate = data.totalReq > 0 ? Math.round((data.totalSign / data.totalReq) * 100) : 100;
        return {
          roleName: labels[key] || key,
          rate,
          totalStaff: data.count,
          signedSignatures: data.totalSign,
          pendingSignatures: data.totalReq - data.totalSign
        };
      });
  }, [staffComplianceData]);

  // 6. Filtered Staff Table List
  const filteredStaffList = useMemo(() => {
    return staffComplianceData.filter(item => {
      if (selectedTier !== 'all' && item.tier !== selectedTier) return false;
      if (staffSearch.trim()) {
        const query = staffSearch.toLowerCase();
        const matchesName = item.staff.name.toLowerCase().includes(query);
        const matchesId = item.staff.nationalId.includes(query);
        const matchesRole = item.staff.roleTitle.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesRole) return false;
      }
      return true;
    });
  }, [staffComplianceData, selectedTier, staffSearch]);

  // Summary Metrics
  const totalRequiredSignatures = useMemo(() => {
    return filteredDocs.reduce((acc, doc) => acc + doc.targetStaffIds.length, 0);
  }, [filteredDocs]);

  const totalCompletedSignatures = useMemo(() => {
    return filteredDocs.reduce((acc, doc) => acc + Object.keys(doc.signatures).length, 0);
  }, [filteredDocs]);

  const overallComplianceRate = totalRequiredSignatures > 0
    ? Math.round((totalCompletedSignatures / totalRequiredSignatures) * 100)
    : 100;

  const circularsCount = filteredDocs.filter(d => d.type === 'circular').length;
  const inquiriesCount = filteredDocs.filter(d => d.type === 'inquiry').length;

  const highCount = tierDistribution.find(t => t.tierKey === 'high')?.count || 0;

  // Custom Recharts Tooltip for Arabic styling
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[210px] dir-rtl text-right">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-bold text-amber-400">{data.name}</span>
            <span className="text-[10px] text-slate-300 font-mono">{data.date}</span>
          </div>
          <p className="text-[11px] font-medium text-slate-200">{data.fullTitle}</p>
          <div className="pt-1 text-[11px] space-y-1 font-mono">
            <div className="flex justify-between items-center text-emerald-400">
              <span>نسبة التوقيع:</span>
              <strong>{data.overallRate}%</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>الموقعون:</span>
              <span>{data.signed} من {data.total}</span>
            </div>
            {data.pending > 0 && (
              <div className="flex justify-between items-center text-amber-400">
                <span>المتبقي:</span>
                <span>{data.pending} موظف</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 dir-rtl text-right">
          <p className="font-bold text-slate-200">{data.name}</p>
          <div className="flex items-center justify-between gap-3 text-emerald-400 font-mono">
            <span>عدد المنسوبين:</span>
            <strong>{data.value} موظف ({data.payload.percentage}%)</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  // Generate general WhatsApp reminder for a staff member who has pending signatures
  const getStaffPendingReminderWhatsApp = (staff: StaffMember, pendingDocIds: string[]) => {
    const cleanPhone = formatSaudiPhone(staff.phone);
    const pendingDocs = documents.filter(d => pendingDocIds.includes(d.id));
    const docsSummary = pendingDocs.map(d => `• ${d.title} (رقم: ${d.referenceNumber})`).join('\n');

    const text = `السلام عليكم ورحمة الله وبركاته
المكرم الزميل/ ${staff.name} المحترم
${staff.roleTitle} - ${schoolSettings.schoolName}

نحيطكم علماً بوجود وثائق رسمية بانتظار توقيعكم بالعلم عبر منظومة التواصل المدرسية:
${docsSummary}

نأمل التكرم بالدخول للمنظومة والتوقيع بالعلم لإكمال مسوغات الأرشفة والاعتماد.
شاكرين ومقدرين حسن تعاونكم،،
إدارة ${schoolSettings.schoolName}`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Printable Ministerial Header for PDF/Print */}
      <div className="hidden print:block border-b-2 border-slate-400 pb-4 mb-4">
        <div className="flex items-center justify-between text-xs">
          <div className="text-right leading-relaxed">
            <p className="font-bold text-slate-900">المملكة العربية السعودية</p>
            <p className="text-slate-700">وزارة التعليم</p>
            <p className="font-bold text-emerald-950">{schoolSettings.educationDepartment}</p>
            <p className="font-black text-slate-900 text-sm mt-0.5">{schoolSettings.schoolName}</p>
          </div>
          <div className="text-center">
            <MoeLogo size="md" className="h-12 w-auto mx-auto mb-1" />
            <h3 className="font-black text-base text-slate-900">التقرير البياني لمعدلات الاستجابة والالتزام بالتوقيع</h3>
            <p className="text-xs text-slate-600">العام الدراسي: {schoolSettings.academicYear}</p>
          </div>
          <div className="text-left font-mono text-xs">
            <p>تاريخ استخراج التقرير: <strong>{new Date().toLocaleDateString('ar-SA')}</strong></p>
            <p>إجمالي المنسوبين: <strong>{staffList.length} موظف</strong></p>
            <p>معدل الالتزام العام: <strong>{overallComplianceRate}%</strong></p>
          </div>
        </div>
      </div>

      {/* Main Top Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              مركز التقارير والتحليلات البيانية
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {schoolSettings.schoolName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            رسوم بيانية تفاعلية توضح معدلات استجابة الموظفين للتعاميم والمساءلات عبر الزمن، وتصنيف المنسوبين حسب نسبة التزامهم بالتوقيع بالعلم.
          </p>
        </div>

        {/* Global Controls & Print */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
          {/* Doc Type Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <button
              onClick={() => setDocTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                docTypeFilter === 'all'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({documents.length})
            </button>
            <button
              onClick={() => setDocTypeFilter('circular')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                docTypeFilter === 'circular'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              التعاميم ({documents.filter(d => d.type === 'circular').length})
            </button>
            <button
              onClick={() => setDocTypeFilter('inquiry')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                docTypeFilter === 'inquiry'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المساءلات ({documents.filter(d => d.type === 'inquiry').length})
            </button>
          </div>

          {/* Print Report */}
          <button
            id="btn-print-reports"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
            title="طباعة التقرير البياني الرسمي"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Compliance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">معدل الاستجابة والالتزام العام</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-950">{overallComplianceRate}%</span>
              <span className="text-[11px] text-slate-500 font-medium">من التواقيع المطلوبة</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold block mt-1">
              {totalCompletedSignatures} توقيع مكتمل من أصل {totalRequiredSignatures}
            </span>
          </div>
          <div className="shrink-0">
            <CircularProgress
              percentage={overallComplianceRate}
              size={54}
              strokeWidth={5}
              textSizeClass="text-xs font-black"
            />
          </div>
        </div>

        {/* High Compliance Staff Count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">منسوبون متميزون بالالتزام (90-100%)</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900">{highCount}</span>
            <span className="text-xs text-slate-500 font-medium">من أصل {staffList.length} موظف</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all"
              style={{ width: `${staffList.length > 0 ? (highCount / staffList.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Circulars Compliance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">التعاميم المدرسية الرسمية</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900">{circularsCount}</span>
            <span className="text-xs text-emerald-700 font-bold">تعاميم معتمدة</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2 font-medium">
            تصل بروابط توقيع مباشر عبر الواتساب للمنسوبين
          </span>
        </div>

        {/* Inquiries Compliance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 border-r-4 border-r-amber-500 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">أوراق المساءلة والإفادة</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900">{inquiriesCount}</span>
            <span className="text-xs text-amber-700 font-bold">مساءلات صادرة</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2 font-medium">
            تتطلب إفادة وتوقيع معتمد خلال المهلة النظامية
          </span>
        </div>
      </div>

      {/* Main Charts Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Staff Response Rates Over Time (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
                <span>معدلات استجابة الموظفين للتعاميم والمساءلات عبر الزمن</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تطور نسبة التوقيع بالعلم عبر الوثائق والتواريخ الصادرة
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                <span>نسبة التوقيع بالتعاميم (%)</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-amber-700">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span>نسبة التوقيع بالمساءلات (%)</span>
              </div>
            </div>
          </div>

          {timelineData.length > 0 ? (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorInquiry" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    stroke="#cbd5e1"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    stroke="#cbd5e1"
                    unit="%"
                  />
                  <Tooltip content={<CustomTimelineTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="overallRate"
                    name="معدل التوقيع الإجمالي"
                    stroke="#059669"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorOverall)"
                    dot={{ r: 4, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#047857' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs">
              <FileText className="w-10 h-10 text-slate-300 mb-2" />
              <span>لا توجد وثائق كافية لعرض الرسم البياني الزمني حالياً.</span>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
            <span className="font-medium">
              💡 <strong>قراءة المؤشر:</strong> تُقاس الاستجابة بنسبة الموظفين الذين أتموا التوقيع الرقمي بالعلم على كل وثيقة صادرة فور إشعارهم.
            </span>
            <span className="font-mono text-emerald-800 font-bold">
              متوسط التوقيع: {overallComplianceRate}%
            </span>
          </div>
        </div>

        {/* Chart 2: Staff Compliance Categorization (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-700" />
              <span>تصنيف الموظفين حسب نسبة التزامهم</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              توزيع منسوبي المجمع التعليمي وفق مستويات التوقيع بالعلم
            </p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary Counter */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xl font-black text-slate-900">{staffList.length}</span>
              <span className="text-[10px] text-slate-500 font-bold">إجمالي المنسوبين</span>
            </div>
          </div>

          {/* Interactive Legend / Tier Breakdown Badges */}
          <div className="space-y-2 pt-1">
            {tierDistribution.map(tier => (
              <button
                key={tier.tierKey}
                onClick={() => setSelectedTier(selectedTier === tier.tierKey ? 'all' : tier.tierKey)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                  selectedTier === tier.tierKey
                    ? 'bg-slate-100 border-slate-400 font-bold shadow-2xs'
                    : 'hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className="font-semibold text-right">{tier.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-slate-900">{tier.count} موظف</span>
                  <span className="text-[10px] text-slate-500">({tier.percentage}%)</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Compliance by Department / Job Role */}
      {roleComplianceData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <span>معدل الالتزام والتوقيع حسب الفئات الوظيفية</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                مقارنة نسبة إنجاز التوقيع بالعلم بين الكادر التعليمي والإداري
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">مقياس النسبة المئوية (%)</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={roleComplianceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="roleName"
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                  stroke="#cbd5e1"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  stroke="#cbd5e1"
                  unit="%"
                />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'معدل التوقيع بالعلم']}
                  labelFormatter={(label) => `الفئة: ${label}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    direction: 'rtl',
                    textAlign: 'right'
                  }}
                />
                <Bar
                  dataKey="rate"
                  name="نسبة الالتزام"
                  fill="#059669"
                  radius={[8, 8, 0, 0]}
                >
                  {roleComplianceData.map((entry, index) => (
                    <Cell
                      key={`role-cell-${index}`}
                      fill={entry.rate >= 90 ? '#059669' : entry.rate >= 70 ? '#0284c7' : '#d97706'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Categorized Staff Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 border-r-4 border-r-emerald-600 shadow-xs space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-700" />
              <span>سجل تفصيلي لالتزام الموظفين بالتوقيع بالعلم ({filteredStaffList.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة التزام كل موظف، الوثائق المنجزة والمعلقة، مع إمكانية التذكير الفوري بالواتساب
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72 print:hidden">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              placeholder="ابحث بالاسم، السجل المدني، المسمى..."
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Tier Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs print:hidden">
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>تصفية الفئات:</span>
          </span>
          <button
            onClick={() => setSelectedTier('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedTier === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            جميع المنسوبين ({staffList.length})
          </button>
          <button
            onClick={() => setSelectedTier('high')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedTier === 'high'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            متميز وملتزم (90%-100%) ({tierDistribution.find(t => t.tierKey === 'high')?.count || 0})
          </button>
          <button
            onClick={() => setSelectedTier('good')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedTier === 'good'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            التزام جيد (75%-89%) ({tierDistribution.find(t => t.tierKey === 'good')?.count || 0})
          </button>
          <button
            onClick={() => setSelectedTier('medium')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedTier === 'medium'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            يحتاج متابعة (50%-74%) ({tierDistribution.find(t => t.tierKey === 'medium')?.count || 0})
          </button>
          <button
            onClick={() => setSelectedTier('low')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedTier === 'low'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            منخفض الالتزام (&lt;50%) ({tierDistribution.find(t => t.tierKey === 'low')?.count || 0})
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-3.5 w-10 text-center">م</th>
                <th className="py-3 px-3.5">اسم الموظف</th>
                <th className="py-3 px-3.5">السجل المدني</th>
                <th className="py-3 px-3.5">المسمى الوظيفي</th>
                <th className="py-3 px-3.5 text-center">الوثائق المطلوبة</th>
                <th className="py-3 px-3.5 text-center">تم التوقيع بالعلم</th>
                <th className="py-3 px-3.5 text-center">قيد الانتظار</th>
                <th className="py-3 px-3.5">نسبة الالتزام</th>
                <th className="py-3 px-3.5 text-center">تصنيف الالتزام</th>
                <th className="py-3 px-3.5 text-center print:hidden">إجراء المتابعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaffList.map((item, idx) => {
                const waUrl = getStaffPendingReminderWhatsApp(item.staff, item.pendingDocIds);
                const hasPending = item.pendingCount > 0;

                return (
                  <tr key={item.staff.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-slate-400 text-center">{idx + 1}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {item.staff.name}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-600">{item.staff.nationalId}</td>
                    <td className="py-3 px-3.5 text-slate-600">{item.staff.roleTitle}</td>
                    <td className="py-3 px-3.5 font-mono font-bold text-center text-slate-800">
                      {item.totalTargeted}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-center text-emerald-800">
                      {item.signedCount}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-center">
                      {item.pendingCount > 0 ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {item.pendingCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden shrink-0">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${item.rate}%`,
                              backgroundColor: item.tierColor
                            }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-900">{item.rate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${item.tierBadgeBg}`}>
                        {item.tierLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center print:hidden">
                      {hasPending ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] shadow-2xs"
                          title="إرسال تذكير بالوثائق المعلقة عبر الواتساب"
                        >
                          <Send className="w-3 h-3" />
                          <span>تذكير بالواتساب</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">مكتمل بالكامل</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

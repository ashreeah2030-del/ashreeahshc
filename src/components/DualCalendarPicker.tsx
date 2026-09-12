import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Clock,
  CalendarDays
} from 'lucide-react';
import { formatToIsoDate, parseDateString, getFormattedHijriDate } from '../utils/formatters';

interface DualCalendarPickerProps {
  selectedDate: string; // ISO format: YYYY-MM-DD
  hijriDate: string;
  onSelectDate: (isoDate: string, hijriDate: string) => void;
  onHijriChange?: (customHijri: string) => void;
  className?: string;
}

interface CalendarDayCell {
  date: Date;
  isoDate: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean; // Friday or Saturday
  dayOfWeekArabic: string;
  gregorianDay: number;
  gregorianMonthName: string;
  hijriDay: string;
  hijriDayNumber: number;
  hijriMonthName: string;
  hijriYear: string;
  isFirstOfHijriMonth: boolean;
  fullHijri: string;
}

const WEEKDAYS = [
  { name: 'الأحد', short: 'أحد', isWeekend: false },
  { name: 'الإثنين', short: 'إثنين', isWeekend: false },
  { name: 'الثلاثاء', short: 'ثلاثاء', isWeekend: false },
  { name: 'الأربعاء', short: 'أربعاء', isWeekend: false },
  { name: 'الخميس', short: 'خميس', isWeekend: false },
  { name: 'الجمعة', short: 'جمعة', isWeekend: true },
  { name: 'السبت', short: 'سبت', isWeekend: true },
];

export const DualCalendarPicker: React.FC<DualCalendarPickerProps> = ({
  selectedDate,
  hijriDate,
  onSelectDate,
  onHijriChange,
  className = '',
}) => {
  // Current view month & year (Gregorian base for grid)
  const initialDate = useMemo(() => parseDateString(selectedDate || formatToIsoDate(new Date())), [selectedDate]);
  
  const [viewYear, setViewYear] = useState<number>(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => initialDate.getMonth());
  const [isEditingHijri, setIsEditingHijri] = useState(false);

  // Quick navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const iso = formatToIsoDate(today);
    const hijri = getFormattedHijriDate(today);
    onSelectDate(iso, hijri);
  };

  const handleQuickOffset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysOffset);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    const iso = formatToIsoDate(d);
    const hijri = getFormattedHijriDate(d);
    onSelectDate(iso, hijri);
  };

  const handleQuickStartOfWeek = () => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday
    d.setDate(d.getDate() - day);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    const iso = formatToIsoDate(d);
    const hijri = getFormattedHijriDate(d);
    onSelectDate(iso, hijri);
  };

  const handleQuickThursday = () => {
    const d = new Date();
    const day = d.getDay(); // 4 is Thursday
    const diff = (day >= 4 ? day - 4 : day + 3);
    d.setDate(d.getDate() - diff);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    const iso = formatToIsoDate(d);
    const hijri = getFormattedHijriDate(d);
    onSelectDate(iso, hijri);
  };

  // Build grid of days for the viewMonth
  const calendarDays = useMemo<CalendarDayCell[]>(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1, 12, 0, 0);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0, 12, 0, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    const todayIso = formatToIsoDate(new Date());
    const targetSelectedIso = selectedDate || todayIso;

    const days: CalendarDayCell[] = [];

    // Helper to format a cell
    const createCell = (d: Date, isCurrent: boolean): CalendarDayCell => {
      const iso = formatToIsoDate(d);
      const isToday = iso === todayIso;
      const isSelected = iso === targetSelectedIso;
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri or Sat

      let hijriDay = '';
      let hijriDayNumber = 1;
      let hijriMonthName = '';
      let hijriYear = '';
      let fullHijri = '';

      try {
        const hParts = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).formatToParts(d);

        for (const p of hParts) {
          if (p.type === 'day') hijriDay = p.value;
          if (p.type === 'month') hijriMonthName = p.value;
          if (p.type === 'year') hijriYear = p.value;
        }

        const latParts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
          day: 'numeric'
        }).formatToParts(d);
        const latDay = latParts.find(p => p.type === 'day')?.value;
        if (latDay) hijriDayNumber = parseInt(latDay, 10);

        fullHijri = getFormattedHijriDate(d);
      } catch {
        hijriDay = String(d.getDate());
        hijriMonthName = 'ربيع الأول';
        hijriYear = '1448';
        fullHijri = `${d.getDate()} ربيع الأول 1448هـ`;
      }

      return {
        date: d,
        isoDate: iso,
        isCurrentMonth: isCurrent,
        isToday,
        isSelected,
        isWeekend,
        dayOfWeekArabic: WEEKDAYS[dayOfWeek]?.name || '',
        gregorianDay: d.getDate(),
        gregorianMonthName: new Intl.DateTimeFormat('ar-SA', { month: 'short' }).format(d),
        hijriDay,
        hijriDayNumber,
        hijriMonthName,
        hijriYear,
        isFirstOfHijriMonth: hijriDayNumber === 1,
        fullHijri,
      };
    };

    // Pad previous month days to start on Sunday
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0, 12, 0, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i, 12, 0, 0);
      days.push(createCell(d, false));
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day, 12, 0, 0);
      days.push(createCell(d, true));
    }

    // Pad remaining days to complete standard grid (35 or 42 cells)
    const totalRemaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= totalRemaining; day++) {
      const d = new Date(viewYear, viewMonth + 1, day, 12, 0, 0);
      days.push(createCell(d, false));
    }

    return days;
  }, [viewYear, viewMonth, selectedDate]);

  // Derive month headers (both Gregorian and dominant Hijri month)
  const headerInfo = useMemo(() => {
    const midMonthDate = new Date(viewYear, viewMonth, 15, 12, 0, 0);
    const gregMonthYear = new Intl.DateTimeFormat('ar-SA', {
      month: 'long',
      year: 'numeric'
    }).format(midMonthDate);

    let hijriMonthYear = '';
    try {
      hijriMonthYear = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        month: 'long',
        year: 'numeric'
      }).format(midMonthDate);
    } catch {
      hijriMonthYear = 'ربيع الأول 1448 هـ';
    }

    return { gregMonthYear, hijriMonthYear };
  }, [viewYear, viewMonth]);

  // Selected date details
  const selectedInfo = useMemo(() => {
    const d = parseDateString(selectedDate);
    const weekday = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(d);
    const gregFull = new Intl.DateTimeFormat('ar-SA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
    return {
      weekday,
      gregFull,
      hijri: hijriDate || getFormattedHijriDate(d)
    };
  }, [selectedDate, hijriDate]);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      {/* Top Header: Dual Hijri & Gregorian Overview */}
      <div className="bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>التقويم الهجري والميلادي المزدوج</span>
              </span>
              <span className="text-emerald-200 text-xs font-semibold">تقويم أم القرى المعتمد</span>
            </div>

            <div className="mt-2 flex flex-wrap items-baseline gap-2 sm:gap-3">
              <h3 className="text-lg sm:text-xl font-black text-amber-300 font-sans tracking-wide">
                {headerInfo.hijriMonthYear}
              </h3>
              <span className="text-emerald-300 font-bold text-xs sm:text-sm">
                الموافق: {headerInfo.gregMonthYear}
              </span>
            </div>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="الشهر السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
              title="الرجوع لليوم الحالي"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>اليوم</span>
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Shortcut Pills */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] text-emerald-200 font-bold ml-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>اختصارات سريعة:</span>
          </span>
          <button
            type="button"
            onClick={() => handleQuickOffset(0)}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-all cursor-pointer"
          >
            اليوم
          </button>
          <button
            type="button"
            onClick={() => handleQuickOffset(1)}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-all cursor-pointer"
          >
            أمس
          </button>
          <button
            type="button"
            onClick={handleQuickStartOfWeek}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-all cursor-pointer"
          >
            بداية الأسبوع (الأحد)
          </button>
          <button
            type="button"
            onClick={handleQuickThursday}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-all cursor-pointer"
          >
            يوم الخميس
          </button>
          <button
            type="button"
            onClick={() => handleQuickOffset(7)}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-all cursor-pointer"
          >
            قبل أسبوع
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center py-2 text-xs font-bold text-slate-700">
        {WEEKDAYS.map((wd, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col items-center justify-center ${wd.isWeekend ? 'text-amber-800' : 'text-slate-700'}`}
          >
            <span className="hidden sm:inline">{wd.name}</span>
            <span className="sm:hidden">{wd.short}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid (Days) */}
      <div className="grid grid-cols-7 gap-1 p-2 sm:p-3 bg-slate-50/50">
        {calendarDays.map((cell, idx) => {
          const isSelected = cell.isSelected;
          const isToday = cell.isToday;
          const isCurrent = cell.isCurrentMonth;

          return (
            <button
              key={`${cell.isoDate}-${idx}`}
              type="button"
              onClick={() => onSelectDate(cell.isoDate, cell.fullHijri)}
              className={`relative min-h-[58px] sm:min-h-[66px] p-1 sm:p-1.5 rounded-2xl flex flex-col justify-between items-center transition-all cursor-pointer border text-right group ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/30 scale-[1.02] z-10'
                  : isToday
                  ? 'bg-amber-50/90 hover:bg-amber-100/80 border-amber-300 text-slate-900 shadow-2xs'
                  : isCurrent
                  ? 'bg-white hover:bg-emerald-50/70 border-slate-200/90 text-slate-800 hover:border-emerald-300'
                  : 'bg-slate-100/50 hover:bg-slate-100 border-transparent text-slate-400 opacity-60'
              }`}
            >
              {/* Cell Top: Hijri Day Number (Prominent) */}
              <div className="w-full flex items-center justify-between px-1">
                <span 
                  className={`text-xs sm:text-sm font-black font-mono leading-none ${
                    isSelected 
                      ? 'text-amber-300' 
                      : isToday 
                      ? 'text-amber-900 font-extrabold' 
                      : isCurrent 
                      ? 'text-slate-900' 
                      : 'text-slate-400'
                  }`}
                >
                  {cell.hijriDay}
                </span>

                {/* Hijri Month label on the 1st day of month */}
                {cell.isFirstOfHijriMonth && (
                  <span className={`text-[8px] font-bold px-1 rounded ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    ١ {cell.hijriMonthName.slice(0, 5)}
                  </span>
                )}

                {/* Today Indicator */}
                {isToday && !isSelected && (
                  <span className="text-[9px] font-bold bg-amber-400 text-slate-950 px-1 rounded-full leading-tight">
                    اليوم
                  </span>
                )}
              </div>

              {/* Cell Middle/Bottom: Gregorian Day & Month */}
              <div className="w-full flex items-center justify-center gap-0.5 mt-1">
                <span className={`text-[10px] sm:text-[11px] font-semibold leading-none ${
                  isSelected ? 'text-emerald-100' : 'text-slate-500'
                }`}>
                  {cell.gregorianDay} {cell.gregorianMonthName}
                </span>
              </div>

              {/* Day of Week tiny badge for selected day */}
              {isSelected && (
                <span className="text-[9px] font-bold text-emerald-200 mt-0.5 bg-emerald-900/50 px-1.5 py-0.2 rounded-md">
                  {cell.dayOfWeekArabic}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Confirmation Banner */}
      <div className="p-4 bg-emerald-50/70 border-t border-emerald-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-600 text-white">
              <Check className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-emerald-950">
              تاريخ إصدار الشهادة المعتمد:
            </span>
            <span className="text-xs font-black text-emerald-800 font-sans">
              يوم {selectedInfo.weekday}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 pr-6">
            <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-950 shadow-2xs font-extrabold">
              {selectedInfo.hijri}
            </span>
            <span className="text-slate-400">الموافق</span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-mono text-xs">
              {selectedInfo.gregFull} ({selectedDate})
            </span>
          </div>
        </div>

        {/* Action / Manual Hijri Adjustment */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            type="button"
            onClick={() => setIsEditingHijri(!isEditingHijri)}
            className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
          >
            {isEditingHijri ? 'إخفاء تعديل النص' : 'تعديل صياغة التاريخ الهجري يدوياً'}
          </button>
        </div>
      </div>

      {/* Manual Hijri Date Edit Field (Optional) */}
      {isEditingHijri && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 animate-in fade-in space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            صياغة التاريخ الهجري المطبوعة على الشهادة ورسالة الواتساب:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={hijriDate}
              onChange={(e) => onHijriChange?.(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="مثال: 15 ربيع الأول 1448هـ"
            />
            <button
              type="button"
              onClick={() => {
                const parsed = parseDateString(selectedDate);
                onHijriChange?.(getFormattedHijriDate(parsed));
              }}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="إعادة ضبط التاريخ الهجري التلقائي"
            >
              استعادة التلقائي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

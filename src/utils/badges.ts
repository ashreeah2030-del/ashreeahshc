import React from 'react';

export type TeacherBadgeType = 'star' | 'advanced' | 'ideal' | 'none';

export interface TeacherBadge {
  type: TeacherBadgeType;
  name: string;
  tierLabel: string;
  minPoints: number;
  nextPoints: number | null;
  color: 'amber' | 'sky' | 'emerald' | 'slate';
  bgColor: string;
  borderColor: string;
  textColor: string;
  gradientClass: string;
  pillClass: string;
  icon: string;
  description: string;
  remainingToNext: number;
  progressToNext: number; // 0 - 100%
}

/**
 * Calculates teacher badge tier based on cumulative points:
 * - 100 points: الشارة المثالية
 * - 200 points: الشارة المتقدم
 * - 300 points: شارة النجم
 */
export function getTeacherBadge(points: number = 0): TeacherBadge {
  const p = Math.max(0, points || 0);

  if (p >= 300) {
    return {
      type: 'star',
      name: 'شارة النجم',
      tierLabel: 'المستوى البلاتيني (300+ نقطة)',
      minPoints: 300,
      nextPoints: null,
      color: 'amber',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-400',
      textColor: 'text-amber-950',
      gradientClass: 'from-amber-400 via-yellow-400 to-amber-500',
      pillClass: 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 border border-amber-300 font-black shadow-xs',
      icon: '⭐',
      description: 'حقق شارة النجم (المستوى الأعلى للتميز والريادة في المجمع)',
      remainingToNext: 0,
      progressToNext: 100,
    };
  }

  if (p >= 200) {
    const progress = Math.min(100, Math.round(((p - 200) / 100) * 100));
    return {
      type: 'advanced',
      name: 'الشارة المتقدم',
      tierLabel: 'المستوى المتقدم (200+ نقطة)',
      minPoints: 200,
      nextPoints: 300,
      color: 'sky',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-400',
      textColor: 'text-sky-950',
      gradientClass: 'from-sky-500 to-blue-600',
      pillClass: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border border-sky-400 font-black shadow-xs',
      icon: '💎',
      description: 'حقق الشارة المتقدم (أداء متقدم ومبادرات نوعية في الميدان)',
      remainingToNext: 300 - p,
      progressToNext: progress,
    };
  }

  if (p >= 100) {
    const progress = Math.min(100, Math.round(((p - 100) / 100) * 100));
    return {
      type: 'ideal',
      name: 'الشارة المثالية',
      tierLabel: 'المستوى المثالي (100+ نقطة)',
      minPoints: 100,
      nextPoints: 200,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-400',
      textColor: 'text-emerald-950',
      gradientClass: 'from-emerald-600 to-teal-600',
      pillClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400 font-black shadow-xs',
      icon: '🏅',
      description: 'حقق الشارة المثالية (انضباط ونموذجية في الأداء التعليمي)',
      remainingToNext: 200 - p,
      progressToNext: progress,
    };
  }

  // Below 100 points
  const progress = Math.min(100, Math.round((p / 100) * 100));
  return {
    type: 'none',
    name: 'مسار التميز',
    tierLabel: 'في طور التحصيل والتنافس',
    minPoints: 0,
    nextPoints: 100,
    color: 'slate',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-600',
    gradientClass: 'from-slate-100 to-slate-200',
    pillClass: 'bg-slate-100 text-slate-700 border border-slate-300 font-bold',
    icon: '🌱',
    description: `متبقي ${100 - p} نقطة لنيل الشارة المثالية`,
    remainingToNext: 100 - p,
    progressToNext: progress,
  };
}

export const BADGE_TIERS_GUIDE = [
  {
    tier: 'ideal',
    name: 'الشارة المثالية',
    threshold: 100,
    icon: '🏅',
    color: 'from-emerald-600 to-teal-600 text-white',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'تُمنح عند بلوغ 100 نقطة تميز',
  },
  {
    tier: 'advanced',
    name: 'الشارة المتقدم',
    threshold: 200,
    icon: '💎',
    color: 'from-sky-500 to-blue-600 text-white',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'تُمنح عند بلوغ 200 نقطة تميز',
  },
  {
    tier: 'star',
    name: 'شارة النجم',
    threshold: 300,
    icon: '⭐',
    color: 'from-amber-400 to-yellow-400 text-slate-950',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-300 font-black',
    description: 'تُمنح عند بلوغ 300 نقطة تميز (أعلى وسام)',
  },
];

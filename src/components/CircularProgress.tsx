import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  showText?: boolean;
  textSizeClass?: string;
  textColorClass?: string;
  subText?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 56,
  strokeWidth = 5,
  color,
  trackColor = '#e2e8f0', // slate-200
  className = '',
  showText = true,
  textSizeClass,
  textColorClass,
  subText,
}) => {
  const cleanPercent = Math.max(0, Math.min(100, isNaN(percentage) ? 0 : Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanPercent / 100) * circumference;

  const isCompleted = cleanPercent === 100;
  
  // Choose stroke color if not overridden
  const activeStrokeColor = color || (
    isCompleted 
      ? '#059669' // emerald-600
      : cleanPercent >= 50 
        ? '#10b981' // emerald-500
        : cleanPercent > 0 
          ? '#f59e0b' // amber-500
          : '#94a3b8' // slate-400
  );

  const activeTextColor = textColorClass || (
    isCompleted 
      ? 'text-emerald-950 font-black' 
      : cleanPercent >= 50 
        ? 'text-slate-900 font-black' 
        : 'text-amber-950 font-black'
  );

  const defaultTextSize = size >= 64 ? 'text-sm' : size >= 50 ? 'text-xs' : 'text-[10px]';

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={cleanPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`نسبة التوقيع: ${cleanPercent}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeStrokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Percentage inside circle */}
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span 
            className={`${activeTextColor} ${textSizeClass || defaultTextSize} leading-none tracking-tight font-mono font-bold`}
            dir="ltr"
          >
            {cleanPercent}%
          </span>
          {subText && (
            <span className="text-[8px] text-slate-500 font-medium leading-none mt-0.5">
              {subText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

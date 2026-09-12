import React from 'react';

interface PrincipalSignatureProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  color?: string;
  customUrl?: string;
  title?: string;
}

/**
 * Official School Principal Signature Component
 * Renders the authentic signature of the Principal (الأستاذ حمود بن علي محمد نهاري)
 * with a 100% transparent background, scalable vector definition, and royal blue ink styling.
 */
export const PrincipalSignature: React.FC<PrincipalSignatureProps> = ({
  className = 'w-36 h-20',
  width,
  height,
  color = '#184de6',
  customUrl,
  title = 'توقيع مدير المجمع المعتمد',
}) => {
  // If custom URL is provided and not default SVG, render as transparent image
  if (customUrl && !customUrl.endsWith('principal_signature.svg')) {
    return (
      <img
        src={customUrl}
        alt={title}
        className={`object-contain mix-blend-multiply select-none pointer-events-none ${className}`}
        style={{ width, height }}
        loading="eager"
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 380"
      className={`select-none pointer-events-none drop-shadow-2xs ${className}`}
      style={{ width, height }}
      fill="none"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <g
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Dot above diagonal stroke */}
        <circle cx="188" cy="172" r="7.5" fill={color} stroke="none" />

        {/* Accent dash below diagonal stroke */}
        <path
          d="M 245 272 C 254 266, 264 258, 272 250"
          strokeWidth="11"
        />

        {/* Main continuous flourish:
            1) Bottom-left loop
            2) Long ascending diagonal stroke
            3) Top-right acute ribbon fold & descending hook
        */}
        <path
          d="M 142 245
             C 122 265, 95 305, 88 332
             C 80 358, 98 368, 114 358
             C 134 344, 150 298, 142 260
             C 138 244, 148 240, 160 244
             L 415 80
             C 424 74, 432 78, 424 88
             C 402 115, 328 136, 298 143
             C 284 146, 282 158, 296 166
             C 314 176, 344 168, 358 186
             C 368 200, 362 225, 374 235
             C 384 242, 402 238, 412 222"
        />
      </g>
    </svg>
  );
};

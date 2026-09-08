import React from 'react';

interface MoeLogoProps {
  className?: string;
  variant?: 'color' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  alt?: string;
}

export const MoeLogo: React.FC<MoeLogoProps> = ({
  className = '',
  variant = 'color',
  size = 'md',
  alt = 'شعار وزارة التعليم - المملكة العربية السعودية',
}) => {
  const sizeClasses = {
    sm: 'h-9 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-20 w-auto',
    custom: '',
  }[size];

  const src = variant === 'white' ? '/moe_logo_white.svg' : '/moe_logo.svg';

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={`object-contain select-none inline-block drop-shadow-2xs ${sizeClasses} ${className}`}
      loading="eager"
    />
  );
};

export default MoeLogo;

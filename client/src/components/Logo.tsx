import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  showText = true, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Simple SVG Logo */}
      <svg
        className={`${sizeClasses[size]} text-mystical-600 dark:text-mystical-400 flex-shrink-0`}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        
        {/* Main circle */}
        <circle cx="20" cy="20" r="18" fill="url(#logoGradient)" />
        
        {/* Laser beam effect */}
        <path
          d="M12 20 L28 20"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />
        
        {/* Sparkle effects */}
        <circle cx="15" cy="15" r="1.5" fill="white" opacity="0.9" />
        <circle cx="25" cy="25" r="1" fill="white" opacity="0.7" />
        <circle cx="30" cy="12" r="0.8" fill="white" opacity="0.6" />
        <circle cx="10" cy="28" r="0.8" fill="white" opacity="0.6" />
        
        {/* Touch/hand symbol */}
        <path
          d="M18 26 Q20 24 22 26 Q24 28 22 30 Q20 32 18 30 Q16 28 18 26"
          fill="white"
          opacity="0.9"
        />
      </svg>
      
      {/* Text */}
      {showText && (
        <span className={`${textSizes[size]} font-playfair font-bold text-mystical-700 dark:text-mystical-400 ml-2`}>
          LaserTouch
        </span>
      )}
    </div>
  );
};

export default Logo; 
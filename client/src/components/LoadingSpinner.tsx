import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  horizontal?: boolean;
}

export function LoadingSpinner({ size = "md", text, fullScreen = false, horizontal = false }: LoadingSpinnerProps) {
  const { t } = useLanguage();
  
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };
  
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  const spinner = (
    <div className={`flex ${horizontal ? 'flex-row items-center space-x-2' : 'flex-col items-center justify-center space-y-4'}`}>
      {/* Spinning arc */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg viewBox="0 0 50 50" className="w-full h-full animate-spin text-current">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="90 125.6"
          />
        </svg>
      </div>
      
      {/* Loading text */}
      {text && (
        <div className={`${textSizeClasses[size]} text-sage-700 font-medium ${horizontal ? '' : 'animate-pulse'}`}>
          {text}
        </div>
      )}
      
      {/* Animated dots - only show when not horizontal */}
      {!horizontal && (
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
          <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-cream-50/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 mx-4 max-w-sm w-full">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

// Modern 2025 Preloader Component
export const ModernPreloader: React.FC<{ isVisible: boolean; onComplete?: () => void }> = ({ isVisible, onComplete }) => {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const steps = [
    { name: "Инициализация", duration: 800 },
    { name: "Загрузка ресурсов", duration: 1200 },
    { name: "Подготовка интерфейса", duration: 1000 },
    { name: "Завершение", duration: 600 }
  ];

  useEffect(() => {
    if (!isVisible) return;

    setShowContent(true);
    let currentProgress = 0;
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        const stepProgress = step.duration / 100;
        
        currentProgress += stepProgress;
        setProgress(Math.min(currentProgress, 100));
        
        if (currentProgress >= (stepIndex + 1) * 25) {
          setCurrentStep(stepIndex + 1);
          stepIndex++;
        }
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-mystical-900 via-deep-900 to-accent-900">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-mystical-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Laser grid effect */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="url(#laserGradient)" strokeWidth="0.1" opacity="0.3"/>
              </pattern>
              <linearGradient id="laserGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-8 max-w-md mx-auto px-6">
          {/* Logo with laser effect */}
          <div className="relative">
            <div className="text-6xl font-playfair font-bold text-white mb-2 relative">
              <span className="bg-gradient-to-r from-mystical-400 via-accent-400 to-mystical-400 bg-clip-text text-mystical-400">
                Psycho Therapy
              </span>
              {/* Laser scan effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 laser-scan-animation" />
            </div>
            <div className="text-xl text-mystical-300 font-inter tracking-wide">
              Beauty Studio
            </div>
          </div>

          {/* Laser animation */}
          <div className="relative w-32 h-32 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Laser path */}
              <path
                d="M 20 50 Q 50 20 80 50 Q 50 80 20 50"
                fill="none"
                stroke="url(#laserPathGradient)"
                strokeWidth="2"
                className="laser-path-animation"
              />
              <defs>
                <linearGradient id="laserPathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              
              {/* Laser dot */}
              <circle
                cx="20"
                cy="50"
                r="3"
                fill="#ec4899"
                className="laser-dot-animation"
              />
            </svg>
          </div>

          {/* Progress bar */}
          <div className="space-y-4">
            <div className="relative h-2 bg-mystical-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-mystical-500 via-accent-500 to-mystical-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
              {/* Glow effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-mystical-400 via-accent-400 to-mystical-400 rounded-full blur-sm opacity-50"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Progress text */}
            <div className="text-mystical-300 font-medium">
              {progress.toFixed(0)}%
            </div>
            
            {/* Current step */}
            {currentStep < steps.length && (
              <div className="text-mystical-400 text-sm animate-pulse">
                {steps[currentStep].name}...
              </div>
            )}
          </div>

          {/* Decorative elements */}
          <div className="flex justify-center space-x-3">
            <div className="w-2 h-2 bg-mystical-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 bg-mystical-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-16 h-16 border border-mystical-500 rounded-lg opacity-30 animate-pulse" />
      <div className="absolute top-8 right-8 w-16 h-16 border border-accent-500 rounded-lg opacity-30 animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-8 left-8 w-16 h-16 border border-mystical-500 rounded-lg opacity-30 animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-8 right-8 w-16 h-16 border border-accent-500 rounded-lg opacity-30 animate-pulse" style={{ animationDelay: "3s" }} />
    </div>
  );
};

// Simple logo preloader
export const SimpleLogoPreloader: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900", className)}>
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="space-y-4">
          <div className="text-4xl font-playfair font-bold text-sage-800 dark:text-sage-200">
            Psycho Therapy
          </div>
          <div className="text-sage-600 dark:text-sage-400 text-lg font-inter">
            Beauty Studio
          </div>
        </div>
        
        {/* Simple spinner */}
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <div className="text-sage-600 dark:text-sage-400 font-light">
          Loading...
        </div>
      </div>
    </div>
  );
};

// Main app preloader
// Calm therapy hourglass preloader (sand to petals)
export const TherapyHourglassPreloader: React.FC<{ isVisible: boolean; progress?: number }> = ({ isVisible, progress }) => {
  if (!isVisible) return null;

  const safeProgress = Math.max(0, Math.min(100, progress ?? 0));
  const upperFill = 1 - safeProgress / 100; // 1->0
  const lowerFill = safeProgress / 100; // 0->1

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const particleCount = isMobile ? 16 : 36;
  const petalCount = isMobile ? 8 : 16;
  const particles = Array.from({ length: particleCount });
  const petals = Array.from({ length: petalCount });

  const upperRectHeight = 70 * upperFill; // px in SVG coords
  const lowerRectHeight = 70 * lowerFill;

  return (
    <div className="thera-preloader fixed inset-0 z-[9999] overflow-hidden">
      {/* Ambient background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-white to-cream-100 dark:from-deep-900 dark:via-deep-800 dark:to-deep-900" />

      {/* Ambient clouds with subtle blur and reduced motion support */}
      <svg className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <defs>
          <filter id="cloudBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
          </filter>
          <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c7d2fe" />
            <stop offset="50%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.05"/>
            </feComponentTransfer>
            <feBlend mode="soft-light" in2="SourceGraphic"/>
          </filter>
        </defs>
        <g filter="url(#cloudBlur)">
          <path className="animate-cloud-slow animate-heavy" d="M-200 200 Q 200 100 600 200 T 1400 200" stroke="url(#cloudGrad)" strokeWidth="90" strokeLinecap="round" fill="none" />
          <path className="animate-cloud-fast animate-heavy" d="M-300 420 Q 150 360 600 420 T 1500 420" stroke="url(#cloudGrad)" strokeWidth="110" strokeLinecap="round" fill="none" opacity="0.55" />
          <path className="animate-cloud-slow animate-heavy" d="M-260 640 Q 200 560 640 640 T 1520 640" stroke="url(#cloudGrad)" strokeWidth="100" strokeLinecap="round" fill="none" opacity="0.4" />
        </g>
        <rect x="0" y="0" width="1440" height="900" fill="transparent" filter="url(#grain)" />
      </svg>

      {/* Centerpiece */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="text-center space-y-8">
          {/* Hourglass with dynamic sand levels */}
          <div className="relative w-44 h-64 mx-auto">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 180">
              <defs>
                {/* Bulb shapes for clipping */}
                <clipPath id="upperBulb"><path d="M20,10 L100,10 C100,50 70,80 60,90 C50,80 20,50 20,10 Z" /></clipPath>
                <clipPath id="lowerBulb"><path d="M20,170 L100,170 C100,130 70,100 60,90 C50,100 20,130 20,170 Z" /></clipPath>
                <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fde68a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.15" />
                </linearGradient>
              </defs>

              {/* Glass outline */}
              <g>
                <path d="M20,10 L100,10 C100,50 70,80 60,90 C50,80 20,50 20,10 Z" fill="none" stroke="url(#glassGrad)" strokeWidth="3" />
                <path d="M20,170 L100,170 C100,130 70,100 60,90 C50,100 20,130 20,170 Z" fill="none" stroke="url(#glassGrad)" strokeWidth="3" />
                <rect x="56" y="83.5" width="8" height="13" rx="3" fill="#94a3b8" opacity="0.35" className="motion-blur" />
              </g>

              {/* Upper sand fill (tied to progress) */}
              <g clipPath="url(#upperBulb)">
                <rect x="20" y={90 - upperRectHeight} width="80" height={upperRectHeight} fill="url(#sandGrad)" opacity="0.9" />
                {/* falling grains */}
                {particles.map((_, i) => (
                  <circle key={`u-${i}`} cx={60 + Math.sin(i) * 18} cy={34 + (i % 7) * 6} r={1.9} fill="url(#sandGrad)" className="hourglass-sand animate-heavy" style={{ animationDelay: `${(i % 7) * 0.22}s`, opacity: Math.max(0, upperFill - 0.1) }} />
                ))}
              </g>

              {/* Lower sand fill (tied to progress) */}
              <g clipPath="url(#lowerBulb)">
                <rect x="20" y={170 - lowerRectHeight} width="80" height={lowerRectHeight} fill="url(#sandGrad)" opacity="0.95" />
                {particles.map((_, i) => (
                  <circle key={`l-${i}`} cx={60 + Math.cos(i) * 16} cy={150 - (i % 9) * 4} r={2.1} fill="url(#sandGrad)" className="hourglass-sand-delay animate-heavy" style={{ animationDelay: `${(i % 9) * 0.28}s`, opacity: Math.min(1, 0.3 + lowerFill) }} />
                ))}
              </g>

              {/* Petals rising from the lower bulb – more visible as progress increases */}
              {petals.map((_, i) => (
                <g key={`p-${i}`} className="petal-rise animate-heavy" style={{ transformOrigin: '60px 120px', animationDelay: `${i * 0.18}s`, opacity: Math.min(1, 0.2 + lowerFill) }}>
                  <path d="M60,120 c-6,-8 -6,-16 0,-22 c6,6 6,14 0,22 z" fill="#93c5fd" opacity="0.7" />
                  <path d="M60,120 c6,-8 6,-16 0,-22 c-6,6 -6,14 0,22 z" fill="#a7f3d0" opacity="0.7" />
                </g>
              ))}
            </svg>

            {/* Progress ring with gradient stroke and smooth easing */}
            <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)]" viewBox="0 0 220 320">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a7f3d0" />
                  <stop offset="50%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#ddd6fe" />
                </linearGradient>
              </defs>
              <circle cx="110" cy="160" r="140" fill="none" stroke="#e5e7eb" strokeWidth="8" opacity="0.35" />
              <circle cx="110" cy="160" r="140" fill="none" stroke="url(#ringGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray="879" strokeDashoffset={879 - (879 * safeProgress) / 100} className="transition-all duration-500 ease-out" />
            </svg>
          </div>

          {/* Calming copy */}
          <div className="space-y-1">
            <div className="text-deep-500 dark:text-mystical-100 font-medium">Мягкая пауза</div>
            <div className="text-deep-400 dark:text-mystical-300 text-sm">Песок превращается в спокойствие</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Video-based preloader with graceful fallbacks
export const VideoPreloader: React.FC<{ isVisible: boolean; progress?: number; src: string; className?: string }> = ({ isVisible, progress, src, className }) => {
  if (!isVisible) return null;

  const [canPlay, setCanPlay] = React.useState(true);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <div className={cn("fixed inset-0 z-[9999] overflow-hidden bg-black/90", className)}>
      {!reducedMotion && canPlay ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={src}
          autoPlay
          muted
          playsInline
          loop
          onError={() => setCanPlay(false)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-white to-cream-100 dark:from-deep-900 dark:via-deep-800 dark:to-deep-900" />
      )}

      {/* Optional progress ring overlay (subtle) */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        {typeof progress === 'number' && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/80 text-sm tracking-wide">
            {Math.round(Math.max(0, Math.min(100, progress)))}%
          </div>
        )}
      </div>
    </div>
  );
};

// Main app preloader
export const AppPreloader: React.FC<{ isVisible: boolean; progress?: number }> = ({ isVisible, progress }) => {
  const [show, setShow] = React.useState(isVisible);
  const [fadingOut, setFadingOut] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      setShow(true);
      setFadingOut(false);
      return;
    }
    if (show) {
      setFadingOut(true);
      const t = setTimeout(() => {
        setShow(false);
        setFadingOut(false);
      }, 450);
      return () => clearTimeout(t);
    }
  }, [isVisible, show]);

  if (!show) return null;

  return (
    <VideoPreloader
      isVisible={true}
      progress={progress}
      src="/video/preloader.mp4"
      className={cn("transition-opacity duration-500", fadingOut ? "opacity-0" : "opacity-100")}
    />
  );
};

// Page loading component
export function PageLoader() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-white flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo area */}
        <div className="space-y-4">
          <div className="text-4xl font-playfair font-bold text-sage-800">
            Psycho Therapy
          </div>
          <div className="text-sage-600 text-lg font-inter">
            {t.common?.beautyStudio || "Beauty Studio"}
          </div>
        </div>
        
        {/* Main spinner */}
        <LoadingSpinner size="lg" text={t.common?.loading || "Loading..."} />
        
        {/* Decorative elements */}
        <div className="flex justify-center space-x-4">
          <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-sage-400 to-transparent"></div>
          <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse"></div>
          <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-sage-400 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}

// Button loading state
export function ButtonLoader() {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 relative">
        <div className="absolute inset-0 animate-spin">
          <svg viewBox="0 0 20 20" className="w-full h-full">
            <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="37.7" strokeDashoffset="37.7" className="animate-spin" />
          </svg>
        </div>
      </div>
      <span>Processing...</span>
    </div>
  );
}

// Global transition loader
export const TransitionLoader = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-sage-200 dark:border-sage-700 border-t-sage-600 dark:border-t-sage-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-sage-600 dark:bg-sage-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="mt-4 text-sage-600 dark:text-sage-400 font-medium">
          Переходим...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
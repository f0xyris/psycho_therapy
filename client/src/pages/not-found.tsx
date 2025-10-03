import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  const width = 800;
  const height = 360;
  return (
    <div className="relative w-full min-h-[calc(100vh-64px)]">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-20 md:py-28 min-h-[calc(100vh-64px)]">
        <div className="relative mb-8 w-full select-none">
          <div className="relative mx-auto max-w-[900px]">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto"
              aria-hidden
              
            >
              <defs>
                <linearGradient id="digits-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="60%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
                <filter id="soft-glow" x="-20%" y="-40%" width="140%" height="180%">
                  <feGaussianBlur stdDeviation="24" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g filter="url(#soft-glow)">
                <text
                  x="50%"
                  y="57%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={height * 0.95}
                  fontWeight={800}
                  fontFamily="Inter, system-ui, Arial, sans-serif"
                  fill="url(#digits-gradient)"
                  letterSpacing="6"
                >
                  404
                </text>
              </g>

              
            </svg>
          </div>
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            Спокійно, цю сторінку не знайдено
          </h1>
          <p className="mt-3 text-pretty text-sm text-gray-600 dark:text-gray-300 sm:text-base">
            Зробімо вдих і повернімось до того, що допомагає. Почнемо з головної.
          </p>
        </div>

        <div className="mt-10">
          <Button
            asChild
            className="group relative overflow-hidden rounded-full px-6 py-6 text-base shadow-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          >
            <Link href="/">
              <span className="relative z-[1] items-center gap-2 flex">
                На головну
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>

              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 opacity-90" />
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120px_60px_at_0%_50%,rgba(255,255,255,0.35),transparent)] blur-md transition-transform group-hover:translate-x-[40%]" />
            </Link>
          </Button>
        </div>
      </div>

      
    </div>
  );
}

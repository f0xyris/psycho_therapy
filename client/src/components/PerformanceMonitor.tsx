import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    // Мониторинг метрик веб-виталов
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        setMetrics(prev => prev ? { ...prev, lcp: lastEntry.startTime } : null);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as any;
        if (firstEntry && firstEntry.processingStart) {
          setMetrics(prev => prev ? { ...prev, fid: firstEntry.processingStart - firstEntry.startTime } : null);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value || 0;
          }
        }
        setMetrics(prev => prev ? { ...prev, cls: clsValue } : null);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as PerformanceEntry;
        setMetrics(prev => prev ? { ...prev, fcp: firstEntry.startTime } : null);
      });
      fcpObserver.observe({ entryTypes: ['first-contentful-paint'] });

      // Time to First Byte
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        setMetrics(prev => prev ? { ...prev, ttfb: navigationEntry.responseStart - navigationEntry.requestStart } : null);
      }

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        fcpObserver.disconnect();
      };
    }
  }, []);

  // В продакшене этот компонент не должен рендериться
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!metrics) {
    return null;
  }

  const getMetricColor = (metric: keyof PerformanceMetrics, value: number) => {
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric];
    if (value <= threshold.good) return 'text-green-500';
    if (value <= threshold.poor) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 text-xs">
      <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Performance Metrics</h3>
      <div className="space-y-1">
        <div className={`${getMetricColor('fcp', metrics.fcp)}`}>
          FCP: {metrics.fcp.toFixed(0)}ms
        </div>
        <div className={`${getMetricColor('lcp', metrics.lcp)}`}>
          LCP: {metrics.lcp.toFixed(0)}ms
        </div>
        <div className={`${getMetricColor('fid', metrics.fid)}`}>
          FID: {metrics.fid.toFixed(0)}ms
        </div>
        <div className={`${getMetricColor('cls', metrics.cls)}`}>
          CLS: {metrics.cls.toFixed(3)}
        </div>
        <div className={`${getMetricColor('ttfb', metrics.ttfb)}`}>
          TTFB: {metrics.ttfb.toFixed(0)}ms
        </div>
      </div>
    </div>
  );
}; 
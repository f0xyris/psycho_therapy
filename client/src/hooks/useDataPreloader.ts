import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useDataPreloader = () => {
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [startTime] = useState(Date.now());
  const queryClient = useQueryClient();

  // Минимальное время показа прелоадера (3 секунды)
  const MIN_PRELOADER_TIME = 3000;

  useEffect(() => {
    const preloadCriticalData = async () => {
      try {
        setPreloadProgress(10);
        
        // Preload services data
        await queryClient.prefetchQuery({
          queryKey: ['/api/services'],
          queryFn: async () => {
            const response = await fetch('/api/services');
            if (!response.ok) throw new Error('Failed to fetch services');
            return response.json();
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
        setPreloadProgress(40);

        // Preload reviews data
        await queryClient.prefetchQuery({
          queryKey: ['/api/reviews/all'],
          queryFn: async () => {
            const response = await fetch('/api/reviews/all');
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data) ? data : [];
          },
          staleTime: 10 * 60 * 1000, // 10 minutes
        });
        setPreloadProgress(70);

        // Preload courses data
        await queryClient.prefetchQuery({
          queryKey: ['/api/courses'],
          queryFn: async () => {
            const response = await fetch('/api/courses');
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data) ? data : [];
          },
          staleTime: 10 * 60 * 1000, // 10 minutes
        });
        setPreloadProgress(90);

        // Calculate remaining time to ensure minimum preloader display
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_PRELOADER_TIME - elapsedTime);
        
        // Small delay for smooth transition
        setTimeout(() => {
          setPreloadProgress(100);
          setTimeout(() => {
            setIsPreloading(false);
          }, Math.max(500, remainingTime));
        }, 200);
        
      } catch (error) {
        console.error('Error preloading data:', error);
        // Continue even if preloading fails
        setPreloadProgress(100);
        
        // Calculate remaining time to ensure minimum preloader display
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_PRELOADER_TIME - elapsedTime);
        
        setTimeout(() => {
          setIsPreloading(false);
        }, Math.max(500, remainingTime));
      }
    };

    preloadCriticalData();
  }, [queryClient, startTime]);

  return {
    isPreloading,
    preloadProgress,
  };
}; 
import { useRef, useCallback } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live в миллисекундах
  maxSize?: number; // Максимальное количество записей в кэше
}

export const useCache = <T>(options: CacheOptions = {}) => {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options; // По умолчанию 5 минут, 100 записей
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());

  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cache.current.delete(key);
      return null;
    }

    return entry.data;
  }, []);

  const set = useCallback((key: string, data: T, customTtl?: number): void => {
    // Очистка старых записей если достигнут лимит
    if (cache.current.size >= maxSize) {
      const oldestKey = cache.current.keys().next().value;
      if (oldestKey) {
        cache.current.delete(oldestKey);
      }
    }

    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTtl || ttl
    });
  }, [ttl, maxSize]);

  const has = useCallback((key: string): boolean => {
    return cache.current.has(key) && get(key) !== null;
  }, [get]);

  const clear = useCallback((): void => {
    cache.current.clear();
  }, []);

  const remove = useCallback((key: string): boolean => {
    return cache.current.delete(key);
  }, []);

  const size = useCallback((): number => {
    return cache.current.size;
  }, []);

  return {
    get,
    set,
    has,
    clear,
    remove,
    size
  };
};

// Хук для кэширования изображений
export const useImageCache = () => {
  const imageCache = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (imageCache.current.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        imageCache.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const isCached = useCallback((src: string): boolean => {
    return imageCache.current.has(src);
  }, []);

  return {
    preloadImage,
    isCached
  };
};

export function useCacheRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    
    // Временно отключаем все автоматические обновления
    /*
    // Function to refresh cache on page focus
    const handleFocus = () => {
      // Invalidate and refetch critical queries
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
    };

    // Function to refresh cache on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    // Function to refresh cache on page load
    const handleLoad = () => {
      handleFocus();
    };

    // Add event listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('load', handleLoad);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial refresh
    handleFocus();

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('load', handleLoad);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    */
  }, [queryClient]);

  // Function to manually refresh all cache
  const refreshAllCache = () => {
    queryClient.invalidateQueries();
  };

  // Function to refresh specific cache
  const refreshCache = (queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    refreshAllCache,
    refreshCache,
  };
} 
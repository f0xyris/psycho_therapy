import { useEffect } from "react";

interface ResourcePreloaderProps {
  images?: string[];
  fonts?: string[];
}

export const ResourcePreloader = ({ images = [], fonts = [] }: ResourcePreloaderProps) => {
  useEffect(() => {
    // Предзагрузка изображений
    images.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    // Предзагрузка шрифтов
    fonts.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Очистка при размонтировании
    return () => {
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');
      preloadLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [images, fonts]);

  return null;
}; 
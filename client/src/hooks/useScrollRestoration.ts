import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook to save and restore scroll position when navigating between pages
 * @param key - Unique key for this page's scroll position (e.g., 'dashboard', 'protocols')
 */
export function useScrollRestoration(key: string) {
  const [location] = useLocation();

  useEffect(() => {
    const scrollableElement = document.querySelector('main.overflow-y-auto');
    
    if (!scrollableElement) return;

    // Restore scroll position when component mounts
    const savedPosition = sessionStorage.getItem(`scroll-${key}`);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        scrollableElement.scrollTop = position;
      });
    }

    // Save scroll position before unmounting
    const handleScroll = () => {
      sessionStorage.setItem(`scroll-${key}`, scrollableElement.scrollTop.toString());
    };

    scrollableElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
    };
  }, [key, location]);

  // Clear scroll position when navigating away permanently
  useEffect(() => {
    return () => {
      const scrollableElement = document.querySelector('main.overflow-y-auto');
      if (scrollableElement) {
        sessionStorage.setItem(`scroll-${key}`, scrollableElement.scrollTop.toString());
      }
    };
  }, [key]);
}

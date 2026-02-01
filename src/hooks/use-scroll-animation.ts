import { useEffect, useState, useRef } from 'react';

export interface UseScrollAnimationOptions {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const {
    threshold = 0.1,
    triggerOnce = true,
    rootMargin = '0px',
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, triggerOnce, rootMargin]);

  return { elementRef, isVisible };
};

// Hook for stagger animations (useful for lists)
export const useStaggerAnimation = (itemCount: number, options: UseScrollAnimationOptions = {}) => {
  const { elementRef, isVisible } = useScrollAnimation(options);
  const [visibleItems, setVisibleItems] = useState<number>(0);

  useEffect(() => {
    if (!isVisible) {
      setVisibleItems(0);
      return;
    }

    // Stagger appearance of items
    const interval = setInterval(() => {
      setVisibleItems((prev) => {
        if (prev >= itemCount) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 100); // 100ms delay between items

    return () => clearInterval(interval);
  }, [isVisible, itemCount]);

  return { elementRef, visibleItems, isVisible };
};

// Pre-built animation classes
export const scrollAnimationClasses = {
  fadeIn: 'opacity-0 transition-opacity duration-700 ease-out',
  fadeInVisible: 'opacity-100',
  slideUp: 'opacity-0 translate-y-8 transition-all duration-700 ease-out',
  slideUpVisible: 'opacity-100 translate-y-0',
  slideDown: 'opacity-0 -translate-y-8 transition-all duration-700 ease-out',
  slideDownVisible: 'opacity-100 translate-y-0',
  slideLeft: 'opacity-0 translate-x-8 transition-all duration-700 ease-out',
  slideLeftVisible: 'opacity-100 translate-x-0',
  slideRight: 'opacity-0 -translate-x-8 transition-all duration-700 ease-out',
  slideRightVisible: 'opacity-100 translate-x-0',
  scaleIn: 'opacity-0 scale-95 transition-all duration-700 ease-out',
  scaleInVisible: 'opacity-100 scale-100',
};

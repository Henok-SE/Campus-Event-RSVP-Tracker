import { useEffect } from 'react';

const DEFAULT_SELECTOR = '[data-scroll-reveal]';

export default function useScrollReveal({
  selector = DEFAULT_SELECTOR,
  threshold = 0.14,
  rootMargin = '0px 0px -12% 0px'
} = {}) {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const targets = Array.from(document.querySelectorAll(selector));
    if (targets.length === 0) {
      return;
    }

    const reveal = (element) => {
      element.classList.add('is-visible');
    };

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (
      prefersReducedMotion ||
      typeof window === 'undefined' ||
      typeof window.IntersectionObserver !== 'function'
    ) {
      targets.forEach(reveal);
      return;
    }

    const observer = new window.IntersectionObserver(
      (entries, activeObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          reveal(entry.target);
          activeObserver.unobserve(entry.target);
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    targets.forEach((target) => {
      observer.observe(target);
    });

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, selector, threshold]);
}

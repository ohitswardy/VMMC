import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Returns true if the user prefers reduced motion.
 * Uses `matchMedia('(prefers-reduced-motion: reduce)')`.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/**
 * Fires `onEnter` when the element enters the viewport.
 * Returns a ref to attach to the target element.
 * Uses IntersectionObserver for performance.
 */
export function useViewportEntry(
  options: {
    threshold?: number;
    rootMargin?: string;
    once?: boolean;
  } = {}
): { ref: React.RefCallback<Element>; inView: boolean } {
  const { threshold = 0.15, rootMargin = '0px', once = true } = options;
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const frozenRef = useRef(false);

  const ref = useCallback(
    (node: Element | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node || frozenRef.current) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) {
              frozenRef.current = true;
              observerRef.current?.disconnect();
            }
          } else if (!once) {
            setInView(false);
          }
        },
        { threshold, rootMargin }
      );

      observerRef.current.observe(node);
    },
    [threshold, rootMargin, once]
  );

  return { ref, inView };
}

/**
 * Animates box-shadow depth by toggling opacity on a pseudo-element layer.
 * Returns style + eventHandlers to spread onto the element.
 *
 * Performance: animates opacity on a pseudo-element, never `box-shadow` directly.
 * The component must render a `::after` pseudo with the deep shadow, and this
 * hook controls its opacity via a CSS variable.
 */
export function useShadowDepth() {
  const [depth, setDepth] = useState(0); // 0 = resting, 1 = hover, -1 = pressed
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handlers = {
    onMouseEnter: () => {
      clearTimeout(timeoutRef.current);
      setDepth(1);
    },
    onMouseLeave: () => {
      clearTimeout(timeoutRef.current);
      // Settle back with a slight delay for rubber-band feel
      timeoutRef.current = setTimeout(() => setDepth(0), 30);
    },
    onMouseDown: () => setDepth(-1),
    onMouseUp: () => setDepth(1),
    onTouchStart: () => setDepth(-1),
    onTouchEnd: () => setDepth(0),
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // CSS variable that the pseudo-element opacity binds to
  const style = {
    '--shadow-depth': depth === 1 ? '1' : depth === -1 ? '0' : '0.5',
    '--shadow-y': depth === 1 ? '-4px' : depth === -1 ? '2px' : '0px',
  } as React.CSSProperties;

  return { depth, style, handlers };
}

/**
 * Animated counter that counts from 0 to `value` over `durationMs`.
 * Triggers on viewport entry. Respects reduced motion.
 */
export function useAnimatedCounter(target: number, durationMs = 800) {
  const [count, setCount] = useState(0);
  const reduced = useReducedMotion();
  const hasRun = useRef(false);

  const start = useCallback(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (reduced) {
      setCount(target);
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, durationMs, reduced]);

  return { count, start };
}

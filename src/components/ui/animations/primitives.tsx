import { motion } from 'framer-motion';
import { Children, type ReactNode } from 'react';
import { useReducedMotion, useViewportEntry } from './hooks';
import { ease, STAGGER_STEP, dur } from './motion-constants';

/**
 * <FadeUp> — staggered children fade + translateY on viewport entry.
 * Each child animates in sequence with `index * 60ms` stagger.
 * Intersection Observer triggered (default: once).
 */
interface FadeUpProps {
  children: ReactNode;
  /** Override stagger delay between children (seconds) */
  stagger?: number;
  /** px to translate from */
  distance?: number;
  /** Animation duration in ms */
  duration?: number;
  className?: string;
  as?: keyof HTMLElementTagNameMap;
}

export function FadeUp({
  children,
  stagger = STAGGER_STEP,
  distance = 16,
  duration = dur.entrance,
  className,
}: FadeUpProps) {
  const reduced = useReducedMotion();
  const { ref, inView } = useViewportEntry({ threshold: 0.1 });

  const items = Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={reduced ? false : { opacity: 0, y: distance }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{
            duration: duration / 1000,
            ease: ease.float,
            delay: reduced ? 0 : i * stagger,
          }}
          style={{ willChange: inView ? undefined : 'transform, opacity' }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * <ScaleIn> — scale from 0.92 → 1 with spring easing.
 * Perfect for modals, cards, popovers appearing.
 */
interface ScaleInProps {
  children: ReactNode;
  /** If false, animates on viewport entry. If true, always visible. */
  show?: boolean;
  className?: string;
}

export function ScaleIn({ children, show = true, className }: ScaleInProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, scale: 0.92 }}
      animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.92 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        mass: 0.8,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * <PressEffect> — wraps any element, applies scale(0.96) + shadow
 * inversion on mousedown/touchstart. Purely visual feedback.
 */
interface PressEffectProps {
  children: ReactNode;
  /** Scale factor on press. Default 0.96 */
  scale?: number;
  className?: string;
  disabled?: boolean;
}

export function PressEffect({
  children,
  scale = 0.96,
  className,
  disabled,
}: PressEffectProps) {
  const reduced = useReducedMotion();

  if (disabled || reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileTap={{ scale }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 0.5,
      }}
    >
      {children}
    </motion.div>
  );
}

import {
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useReducedMotion } from './hooks';

/**
 * <MagneticHover> — element subtly follows cursor within a radius.
 * Tilt max ±8deg. Spring physics snap-back on leave.
 *
 * Performance: uses framer-motion springs, only transforms (GPU).
 */
interface MagneticHoverProps {
  children: ReactNode;
  /** Max tilt in degrees. Default 8 */
  maxTilt?: number;
  /** Max translate in px. Default 6 */
  maxTranslate?: number;
  className?: string;
  disabled?: boolean;
}

export function MagneticHover({
  children,
  maxTilt = 8,
  maxTranslate = 6,
  className,
  disabled,
}: MagneticHoverProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 20, mass: 0.6 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, [-1, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [-1, 1], [-maxTilt, maxTilt]);
  const translateX = useTransform(springX, [-1, 1], [-maxTranslate, maxTranslate]);
  const translateY = useTransform(springY, [-1, 1], [-maxTranslate, maxTranslate]);

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      if (!ref.current || disabled || reduced) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalize to -1..1
      x.set((e.clientX - cx) / (rect.width / 2));
      y.set((e.clientY - cy) / (rect.height / 2));
    },
    [disabled, reduced, x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  if (disabled || reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        perspective: 800,
        transformStyle: 'preserve-3d',
        x: translateX,
        y: translateY,
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}

/**
 * <RippleButton> — physical ripple wave from click origin point.
 * Ripple stays within border-radius. Uses CSS-only animation for performance.
 */
interface RippleButtonProps {
  children: ReactNode;
  onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  /** Ripple color. Default: oklch(0.55 0.24 270 / 0.12) */
  rippleColor?: string;
}

interface RippleState {
  x: number;
  y: number;
  size: number;
  id: number;
}

let rippleCounter = 0;

export function RippleButton({
  children,
  onClick,
  className = '',
  disabled,
  type = 'button',
  rippleColor = 'oklch(0.55 0.24 270 / 0.12)',
}: RippleButtonProps) {
  const reduced = useReducedMotion();
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (!reduced && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const id = ++rippleCounter;
        setRipples((prev) => [...prev, { x, y, size, id }]);

        // Clean up after animation
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
      }

      onClick?.(e);
    },
    [disabled, onClick, reduced]
  );

  return (
    <button
      ref={buttonRef}
      type={type}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
      {/* Ripple layer */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            animation: 'neo-ripple 0.6s ease-out forwards',
          }}
        />
      ))}
    </button>
  );
}

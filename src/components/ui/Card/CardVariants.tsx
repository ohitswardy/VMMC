import {
  forwardRef,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { useReducedMotion, useShadowDepth } from '../animations/hooks';
import { ease } from '../animations/motion-constants';

/* ═══════════════════════════════════════════════════════
   Neo-Skeuomorphic Card System
   Multi-layer shadows, texture grain, directional light,
   gradient border, physics-based interactions.
   ═══════════════════════════════════════════════════════ */

/* ── Shadow stacks for card depth levels ── */
const SHADOW_REST = [
  '0 1px 0 oklch(1 0 0 / 0.12) inset',
  '0 -1px 0 oklch(0.15 0.01 75 / 0.06) inset',
  '0 2px 4px oklch(0.15 0.01 75 / 0.08)',
  '0 4px 12px oklch(0.15 0.01 75 / 0.06)',
  '0 1px 2px oklch(0.15 0.01 75 / 0.05)',
].join(', ');

const SHADOW_HOVER = [
  '0 1px 0 oklch(1 0 0 / 0.15) inset',
  '0 -1px 0 oklch(0.15 0.01 75 / 0.06) inset',
  '0 4px 8px oklch(0.15 0.01 75 / 0.10)',
  '0 12px 32px oklch(0.15 0.01 75 / 0.08)',
  '0 2px 4px oklch(0.15 0.01 75 / 0.06)',
].join(', ');

const SHADOW_PRESSED = [
  '0 1px 0 oklch(1 0 0 / 0.06) inset',
  '0 2px 6px oklch(0.15 0.01 75 / 0.12) inset',
  '0 1px 2px oklch(0.15 0.01 75 / 0.04)',
].join(', ');

/* ── CVA variant classes ── */
const cardVariants = cva(
  [
    'relative rounded-xl overflow-hidden',
    'neo-texture', // noise grain overlay via ::after
    'transition-all',
  ],
  {
    variants: {
      variant: {
        flat: 'bg-surface border border-gray-200',
        glass: [
          'bg-white/65 backdrop-blur-[20px] backdrop-saturate-[180%]',
          'border border-white/20',
        ].join(' '),
        tilt: 'bg-surface border border-gray-200',
        magnetic: 'bg-surface border border-gray-200',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-5 md:p-6',
        lg: 'p-6 md:p-8',
      },
    },
    defaultVariants: {
      variant: 'flat',
      padding: 'none',
    },
  }
);

/* ── Shared props ── */
interface CardBaseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'>,
    VariantProps<typeof cardVariants> {
  children: ReactNode;
  onClick?: (e: ReactMouseEvent<HTMLDivElement>) => void;
  /** Show shimmer skeleton loading. */
  loading?: boolean;
  /** Show dashed empty state. */
  empty?: boolean;
  className?: string;
}

/* ═══════════ Card.Flat ═══════════
   Default elevated card.
   Hover: lift -4px, expand shadow.
   Active: push down +2px, compress shadow.
   ═══════════════════════════════════ */
export const CardFlat = forwardRef<HTMLDivElement, CardBaseProps>(
  function CardFlat({ children, onClick, loading, empty, className = '', padding, ...props }, ref) {
    const reduced = useReducedMotion();
    const interactive = !!onClick;

    if (loading) {
      return (
        <div
          ref={ref}
          className={`${cardVariants({ variant: 'flat', padding })} neo-shimmer min-h-[120px] ${className}`}
          style={{ boxShadow: SHADOW_REST }}
          {...props}
        />
      );
    }

    if (empty) {
      return (
        <div
          ref={ref}
          className={`${cardVariants({ variant: 'flat', padding })} neo-empty min-h-[120px] flex items-center justify-center text-gray-400 text-sm ${className}`}
          style={{ boxShadow: 'none', background: 'transparent' }}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={`${cardVariants({ variant: 'flat', padding })} ${interactive ? 'cursor-pointer' : ''} ${className}`}
        style={{ boxShadow: SHADOW_REST }}
        onClick={onClick}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        whileHover={
          interactive && !reduced
            ? { y: -4, boxShadow: SHADOW_HOVER }
            : undefined
        }
        whileTap={
          interactive && !reduced
            ? { y: 2, boxShadow: SHADOW_PRESSED, scale: 0.99 }
            : undefined
        }
        transition={{ duration: 0.2, ease: ease.float }}
        {...props}
      >
        {/* Ambient top highlight */}
        <div
          className="absolute top-0 left-3 right-3 h-px pointer-events-none z-10"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.45), transparent)' }}
        />
        {children}
      </motion.div>
    );
  }
);

/* ═══════════ Card.Glass ═══════════
   Frosted glass card.
   Hover: increase blur + brightness.
   ═══════════════════════════════════ */
export const CardGlass = forwardRef<HTMLDivElement, CardBaseProps>(
  function CardGlass({ children, onClick, loading, empty, className = '', padding, ...props }, ref) {
    const reduced = useReducedMotion();
    const interactive = !!onClick;

    const glassShadow = [
      'inset 0 1px 0 oklch(1 0 0 / 0.30)',
      '0 4px 12px oklch(0.15 0.01 75 / 0.08)',
      '0 8px 32px oklch(0.15 0.01 75 / 0.06)',
    ].join(', ');

    if (loading) {
      return (
        <div
          ref={ref}
          className={`${cardVariants({ variant: 'glass', padding })} neo-shimmer min-h-[120px] ${className}`}
          style={{ boxShadow: glassShadow }}
          {...props}
        />
      );
    }

    if (empty) {
      return (
        <div
          ref={ref}
          className={`${cardVariants({ variant: 'glass', padding })} neo-empty min-h-[120px] flex items-center justify-center text-gray-400 text-sm ${className}`}
          style={{ boxShadow: 'none', background: 'transparent' }}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={`${cardVariants({ variant: 'glass', padding })} ${interactive ? 'cursor-pointer' : ''} ${className}`}
        style={{ boxShadow: glassShadow }}
        onClick={onClick}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        whileHover={
          interactive && !reduced
            ? {
                backdropFilter: 'blur(28px) saturate(200%)',
                WebkitBackdropFilter: 'blur(28px) saturate(200%)',
                backgroundColor: 'oklch(1 0 0 / 0.72)',
              }
            : undefined
        }
        whileTap={
          interactive && !reduced ? { scale: 0.98 } : undefined
        }
        transition={{ duration: 0.2, ease: ease.float }}
        {...props}
      >
        <div
          className="absolute top-0 left-3 right-3 h-px pointer-events-none z-10"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.50), transparent)' }}
        />
        {children}
      </motion.div>
    );
  }
);

/* ═══════════ Card.Tilt ═══════════
   3D perspective tilt on hover.
   Specular highlight moves opposite to tilt.
   ═══════════════════════════════════ */
export const CardTilt = forwardRef<HTMLDivElement, CardBaseProps>(
  function CardTilt({ children, onClick, loading, empty, className = '', padding, ...props }, ref) {
    const reduced = useReducedMotion();
    const interactive = !!onClick;
    const innerRef = useRef<HTMLDivElement>(null);
    const [specular, setSpecular] = useState({ x: 50, y: 50 });

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springConfig = { stiffness: 300, damping: 20, mass: 0.6 };
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), springConfig);
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), springConfig);

    const handleMouseMove = useCallback(
      (e: ReactMouseEvent) => {
        if (reduced) return;
        const el = innerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(nx);
        y.set(ny);
        // Specular highlight opposite to cursor
        setSpecular({ x: (1 - (nx + 0.5)) * 100, y: (1 - (ny + 0.5)) * 100 });
      },
      [reduced, x, y]
    );

    const handleMouseLeave = useCallback(() => {
      x.set(0);
      y.set(0);
      setSpecular({ x: 50, y: 50 });
    }, [x, y]);

    if (loading) {
      return (
        <div
          ref={ref}
          className={`${cardVariants({ variant: 'tilt', padding })} neo-shimmer min-h-[120px] ${className}`}
          style={{ boxShadow: SHADOW_REST }}
          {...props}
        />
      );
    }

    if (empty) {
      return (
        <div
          ref={ref}
          className={`${cardVariants({ variant: 'tilt', padding })} neo-empty min-h-[120px] flex items-center justify-center text-gray-400 text-sm ${className}`}
          style={{ boxShadow: 'none', background: 'transparent' }}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div ref={ref} style={{ perspective: 800 }} className="w-full">
        <motion.div
          ref={innerRef}
          className={`${cardVariants({ variant: 'tilt', padding })} ${interactive ? 'cursor-pointer' : ''} ${className}`}
          style={{
            boxShadow: SHADOW_REST,
            transformStyle: 'preserve-3d',
            rotateX,
            rotateY,
          }}
          onClick={onClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          tabIndex={interactive ? 0 : undefined}
          role={interactive ? 'button' : undefined}
          {...props}
        >
          {/* Specular highlight */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none z-10 transition-opacity duration-200"
            style={{
              background: `radial-gradient(ellipse at ${specular.x}% ${specular.y}%, oklch(1 0 0 / 0.12) 0%, transparent 60%)`,
              opacity: reduced ? 0 : 1,
            }}
          />
          <div
            className="absolute top-0 left-3 right-3 h-px pointer-events-none z-10"
            style={{ background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.45), transparent)' }}
          />
          {children}
        </motion.div>
      </div>
    );
  }
);

/* ═══════════ Card.Magnetic ═══════════
   Entire card follows cursor with spring.
   Shadow shifts direction with movement.
   ═══════════════════════════════════════ */
export const CardMagnetic = forwardRef<HTMLDivElement, CardBaseProps>(
  function CardMagnetic({ children, onClick, loading, empty, className = '', padding, ...props }, ref) {
    const reduced = useReducedMotion();
    const interactive = !!onClick;
    const innerRef = useRef<HTMLDivElement>(null);
    const { style: shadowStyle, handlers: shadowHandlers } = useShadowDepth();

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springConfig = { stiffness: 400, damping: 15, mass: 0.5 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = useCallback(
      (e: ReactMouseEvent) => {
        if (reduced) return;
        const el = innerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(nx * 16); // max 8px displacement
        y.set(ny * 12); // max 6px displacement
      },
      [reduced, x, y]
    );

    const handleMouseLeave = useCallback(() => {
      x.set(0);
      y.set(0);
      shadowHandlers.onMouseLeave();
    }, [x, y, shadowHandlers]);

    if (loading) {
      return (
        <div
          ref={ref}
          className={`${cardVariants({ variant: 'magnetic', padding })} neo-shimmer min-h-[120px] ${className}`}
          style={{ boxShadow: SHADOW_REST }}
          {...props}
        />
      );
    }

    if (empty) {
      return (
        <div
          ref={ref}
          className={`${cardVariants({ variant: 'magnetic', padding })} neo-empty min-h-[120px] flex items-center justify-center text-gray-400 text-sm ${className}`}
          style={{ boxShadow: 'none', background: 'transparent' }}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={(node) => {
          (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={`${cardVariants({ variant: 'magnetic', padding })} ${interactive ? 'cursor-pointer' : ''} ${className}`}
        style={{
          boxShadow: SHADOW_REST,
          x: reduced ? 0 : springX,
          y: reduced ? 0 : springY,
          ...shadowStyle,
        }}
        onClick={onClick}
        onMouseMove={(e) => {
          handleMouseMove(e);
          shadowHandlers.onMouseEnter();
        }}
        onMouseLeave={handleMouseLeave}
        onMouseDown={shadowHandlers.onMouseDown}
        onMouseUp={shadowHandlers.onMouseUp}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        {...props}
      >
        <div
          className="absolute top-0 left-3 right-3 h-px pointer-events-none z-10"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.45), transparent)' }}
        />
        {children}
      </motion.div>
    );
  }
);

/* ═══════════ Card.Expandable ═══════════
   Click to expand with layout animation.
   CSS grid-template-rows 0fr → 1fr.
   ═════════════════════════════════════════ */
interface CardExpandableProps extends CardBaseProps {
  /** Summary content shown in collapsed state. */
  summary: ReactNode;
  /** Whether to start expanded. */
  defaultExpanded?: boolean;
}

export const CardExpandable = forwardRef<HTMLDivElement, CardExpandableProps>(
  function CardExpandable({ summary, children, className = '', padding, loading, empty, ...props }, ref) {
    const [expanded, setExpanded] = useState(props.defaultExpanded ?? false);
    const reduced = useReducedMotion();

    if (loading) {
      return (
        <div
          ref={ref}
          className={`${cardVariants({ variant: 'flat', padding })} neo-shimmer min-h-[80px] ${className}`}
          style={{ boxShadow: SHADOW_REST }}
        />
      );
    }

    if (empty) {
      return (
        <div
          ref={ref}
          className={`${cardVariants({ variant: 'flat', padding })} neo-empty min-h-[80px] flex items-center justify-center text-gray-400 text-sm ${className}`}
          style={{ boxShadow: 'none', background: 'transparent' }}
        >
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={`${cardVariants({ variant: 'flat', padding: 'none' })} ${className}`}
        style={{ boxShadow: SHADOW_REST }}
        layout={!reduced}
        transition={{ duration: 0.25, ease: ease.float }}
      >
        <div
          className="absolute top-0 left-3 right-3 h-px pointer-events-none z-10"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.45), transparent)' }}
        />

        {/* Summary — always visible, clickable */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left p-5 md:p-6 cursor-pointer flex items-center justify-between gap-3"
        >
          <div className="flex-1 min-w-0">{summary}</div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2, ease: ease.snap }}
            className="shrink-0 w-5 h-5 text-gray-400"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </motion.div>
        </button>

        {/* Expandable detail content */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduced ? undefined : { height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.25, ease: ease.float },
                opacity: { duration: 0.15, delay: 0.08, ease: 'easeOut' },
              }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 md:px-6 md:pb-6 border-t border-gray-200/60 pt-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

/* ═══════════ Card.Stat ═══════════
   Data/metric card with animated counter,
   trend indicator, and sparkline.
   ═════════════════════════════════════ */
interface CardStatProps extends Omit<CardBaseProps, 'children'> {
  /** The metric label */
  label: string;
  /** The numeric value to animate to */
  value: number;
  /** Unit suffix (e.g. "%", "hrs") */
  suffix?: string;
  /** Prefix (e.g. "$", "#") */
  prefix?: string;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend label (e.g. "+12%") */
  trendLabel?: string;
  /** Sparkline data points (y-values) */
  sparkline?: number[];
  /** Icon to show */
  icon?: ReactNode;
}

export const CardStat = forwardRef<HTMLDivElement, CardStatProps>(
  function CardStat({
    label,
    value,
    suffix = '',
    prefix = '',
    trend,
    trendLabel,
    sparkline,
    icon,
    onClick,
    loading,
    className = '',
    ...props
  }, ref) {
    const reduced = useReducedMotion();
    const interactive = !!onClick;
    const { ref: viewRef, inView } = useViewportEntryForStat();
    const { count, start } = useAnimatedCounterForStat(value);

    // Start counter when in view
    if (inView) start();

    const trendColor = trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
      ? 'text-red-500'
      : 'text-gray-400';

    if (loading) {
      return (
        <div
          ref={ref}
          className={`${cardVariants({ variant: 'flat', padding: 'md' })} neo-shimmer min-h-[140px] ${className}`}
          style={{ boxShadow: SHADOW_REST }}
          {...props}
        />
      );
    }

    return (
      <motion.div
        ref={(node) => {
          viewRef(node);
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={`${cardVariants({ variant: 'flat', padding: 'md' })} ${interactive ? 'cursor-pointer' : ''} ${className}`}
        style={{ boxShadow: SHADOW_REST }}
        onClick={onClick}
        whileHover={
          interactive && !reduced
            ? { y: -4, boxShadow: SHADOW_HOVER }
            : undefined
        }
        whileTap={
          interactive && !reduced
            ? { y: 2, boxShadow: SHADOW_PRESSED, scale: 0.99 }
            : undefined
        }
        transition={{ duration: 0.2, ease: ease.float }}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        {...props}
      >
        <div
          className="absolute top-0 left-3 right-3 h-px pointer-events-none z-10"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.45), transparent)' }}
        />

        <div className="relative z-[1] flex flex-col gap-2">
          {/* Label row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-bold text-gray-900 tabular-nums tracking-tight">
              {prefix}{count}{suffix}
            </span>
            {trend && trendLabel && (
              <span className={`text-xs font-bold ${trendColor} flex items-center gap-0.5`}>
                {trend === 'up' && (
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 2l4 5H2l4-5z" />
                  </svg>
                )}
                {trend === 'down' && (
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 10L2 5h8l-4 5z" />
                  </svg>
                )}
                {trendLabel}
              </span>
            )}
          </div>

          {/* Sparkline */}
          {sparkline && sparkline.length > 1 && (
            <div className="mt-1 h-8 w-full">
              <SparklineSVG data={sparkline} inView={inView} reduced={reduced} />
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

/* ── Sparkline SVG ── */
function SparklineSVG({
  data,
  inView,
  reduced,
}: {
  data: number[];
  inView: boolean;
  reduced: boolean;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 200;
  const h = 32;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - pad * 2) + pad;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const pathD = `M${points.join(' L')}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.55 0.24 270)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="oklch(0.55 0.24 270)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <path
        d={`${pathD} L${w - pad},${h - pad} L${pad},${h - pad} Z`}
        fill="url(#sparkGrad)"
        opacity={inView ? 1 : 0}
        style={{
          transition: 'opacity 0.3s ease',
        }}
      />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="oklch(0.55 0.24 270)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: inView ? 0 : 1,
          pathLength: 1,
          transition: reduced ? 'none' : 'stroke-dashoffset 0.8s ease-out',
        }}
      />
    </svg>
  );
}

/* ── Re-wrap hooks to avoid circular imports. Simple wrappers. ── */
import { useViewportEntry, useAnimatedCounter } from '../animations/hooks';

function useViewportEntryForStat() {
  return useViewportEntry({ threshold: 0.2, once: true });
}

function useAnimatedCounterForStat(target: number) {
  return useAnimatedCounter(target, 800);
}

import { useRef, useCallback, useState, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { useMotionValue, useSpring, useTransform, type MotionStyle } from 'framer-motion';
import { useReducedMotion } from './hooks';

/**
 * useCardPhysics() — Unified tilt + magnetic + press physics hook.
 *
 * Composable: enable any combination of behaviors.
 * Returns a ref, motion style, and event handlers to spread onto a <motion.div>.
 *
 * @example
 * ```tsx
 * const physics = useCardPhysics({ tilt: true, magnetic: true, press: true });
 *
 * <motion.div
 *   ref={physics.ref}
 *   style={physics.style}
 *   {...physics.handlers}
 *   {...physics.motionProps}
 * >
 *   ...
 * </motion.div>
 * ```
 *
 * Or spread everything at once:
 * ```tsx
 * <motion.div {...physics.bind()}>...</motion.div>
 * ```
 */

export interface CardPhysicsConfig {
  /** 3D perspective tilt following cursor. Default: false */
  tilt?: boolean | {
    /** Max rotation degrees. Default: 12 */
    maxDeg?: number;
    /** Perspective distance in px. Default: 800 */
    perspective?: number;
    /** Show specular highlight. Default: true */
    specular?: boolean;
  };

  /** Entire element follows cursor with spring displacement. Default: false */
  magnetic?: boolean | {
    /** Max X displacement in px. Default: 8 */
    maxX?: number;
    /** Max Y displacement in px. Default: 6 */
    maxY?: number;
  };

  /** Scale down on press/tap. Default: false */
  press?: boolean | {
    /** Scale factor on press. Default: 0.97 */
    scale?: number;
  };

  /** Spring physics config override. */
  spring?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };

  /** Disable all physics (e.g. when loading). */
  disabled?: boolean;
}

export interface CardPhysicsReturn {
  /** Attach to the element you want physics on. */
  ref: React.RefObject<HTMLDivElement | null>;

  /** Framer Motion style object — spread onto a <motion.div style={...}>. */
  style: MotionStyle;

  /** Event handlers — spread onto the element. */
  handlers: {
    onMouseMove: (e: ReactMouseEvent) => void;
    onMouseLeave: () => void;
    onMouseDown: () => void;
    onMouseUp: () => void;
    onTouchStart: () => void;
    onTouchEnd: () => void;
  };

  /** Framer Motion whileTap prop for press effect. */
  motionProps: {
    whileTap?: { scale: number };
  };

  /** Current state for rendering specular highlight, etc. */
  state: {
    /** Is the element currently being pressed? */
    isPressed: boolean;
    /** Is the element currently being hovered? */
    isHovered: boolean;
    /** Specular highlight position (0-100 %). Only meaningful when tilt is on. */
    specularX: number;
    specularY: number;
    /** Normalized cursor position -1..1 */
    normalX: number;
    normalY: number;
  };

  /**
   * Convenience: returns all props to spread onto a <motion.div>.
   *
   * `<motion.div {...physics.bind()} />`
   */
  bind: () => {
    ref: React.RefObject<HTMLDivElement | null>;
    style: MotionStyle;
    onMouseMove: (e: ReactMouseEvent) => void;
    onMouseLeave: () => void;
    onMouseDown: () => void;
    onMouseUp: () => void;
    onTouchStart: () => void;
    onTouchEnd: () => void;
    whileTap?: { scale: number };
  };
}

export function useCardPhysics(config: CardPhysicsConfig = {}): CardPhysicsReturn {
  const {
    tilt: tiltConfig = false,
    magnetic: magneticConfig = false,
    press: pressConfig = false,
    spring: springOverride,
    disabled = false,
  } = config;

  const reduced = useReducedMotion();
  const isOff = disabled || reduced;

  // ── Resolve config booleans into numbers ──
  const tiltEnabled = !!tiltConfig;
  const tiltMaxDeg = typeof tiltConfig === 'object' ? (tiltConfig.maxDeg ?? 12) : 12;
  const tiltPerspective = typeof tiltConfig === 'object' ? (tiltConfig.perspective ?? 800) : 800;
  const tiltSpecular = typeof tiltConfig === 'object' ? (tiltConfig.specular ?? true) : true;

  const magneticEnabled = !!magneticConfig;
  const magneticMaxX = typeof magneticConfig === 'object' ? (magneticConfig.maxX ?? 8) : 8;
  const magneticMaxY = typeof magneticConfig === 'object' ? (magneticConfig.maxY ?? 6) : 6;

  const pressEnabled = !!pressConfig;
  const pressScale = typeof pressConfig === 'object' ? (pressConfig.scale ?? 0.97) : 0.97;

  // ── State ──
  const ref = useRef<HTMLDivElement | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [specularX, setSpecularX] = useState(50);
  const [specularY, setSpecularY] = useState(50);
  const [normalX, setNormalX] = useState(0);
  const [normalY, setNormalY] = useState(0);

  // ── Motion values — raw cursor-normalized -1..1 ──
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springConfig = {
    stiffness: springOverride?.stiffness ?? 300,
    damping: springOverride?.damping ?? 20,
    mass: springOverride?.mass ?? 0.6,
  };
  const sx = useSpring(rawX, springConfig);
  const sy = useSpring(rawY, springConfig);

  // ── Derived transforms — computed from springs ──

  // Tilt: rotateX tied to Y cursor, rotateY tied to X cursor
  const rotateX = useTransform(sy, [-1, 1], [tiltMaxDeg, -tiltMaxDeg]);
  const rotateY = useTransform(sx, [-1, 1], [-tiltMaxDeg, tiltMaxDeg]);

  // Magnetic: translate proportional to cursor offset
  const translateX = useTransform(sx, [-1, 1], [-magneticMaxX, magneticMaxX]);
  const translateY = useTransform(sy, [-1, 1], [-magneticMaxY, magneticMaxY]);

  // ── Event handlers ──

  const onMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      if (isOff || (!tiltEnabled && !magneticEnabled)) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;   // -1..1
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;   // -1..1
      rawX.set(nx);
      rawY.set(ny);
      setNormalX(nx);
      setNormalY(ny);
      setIsHovered(true);

      // Specular: reflected position (opposite to cursor)
      if (tiltEnabled && tiltSpecular) {
        setSpecularX((1 - (nx / 2 + 0.5)) * 100);
        setSpecularY((1 - (ny / 2 + 0.5)) * 100);
      }
    },
    [isOff, tiltEnabled, magneticEnabled, tiltSpecular, rawX, rawY]
  );

  const onMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    setIsHovered(false);
    setNormalX(0);
    setNormalY(0);
    if (tiltEnabled && tiltSpecular) {
      setSpecularX(50);
      setSpecularY(50);
    }
  }, [rawX, rawY, tiltEnabled, tiltSpecular]);

  const onMouseDown = useCallback(() => setIsPressed(true), []);
  const onMouseUp = useCallback(() => setIsPressed(false), []);
  const onTouchStart = useCallback(() => setIsPressed(true), []);
  const onTouchEnd = useCallback(() => setIsPressed(false), []);

  // Reset pressed on global mouseup (in case cursor leaves while pressed)
  useEffect(() => {
    if (!isPressed) return;
    const up = () => setIsPressed(false);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, [isPressed]);

  // ── Build motion style ──
  const style: MotionStyle = {};

  if (!isOff) {
    if (tiltEnabled) {
      style.perspective = tiltPerspective;
      style.transformStyle = 'preserve-3d';
      style.rotateX = rotateX;
      style.rotateY = rotateY;
    }
    if (magneticEnabled) {
      style.x = translateX;
      style.y = translateY;
    }
  }

  // ── whileTap for press ──
  const motionProps: CardPhysicsReturn['motionProps'] = {};
  if (pressEnabled && !isOff) {
    motionProps.whileTap = { scale: pressScale };
  }

  // ── handlers object ──
  const handlers = {
    onMouseMove,
    onMouseLeave,
    onMouseDown,
    onMouseUp,
    onTouchStart,
    onTouchEnd,
  };

  // ── bind() convenience ──
  const bind = useCallback(
    () => ({
      ref,
      style,
      ...handlers,
      ...motionProps,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOff, tiltEnabled, magneticEnabled, pressEnabled, pressScale]
  );

  return {
    ref,
    style,
    handlers,
    motionProps,
    state: { isPressed, isHovered, specularX, specularY, normalX, normalY },
    bind,
  };
}

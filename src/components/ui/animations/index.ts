/**
 * VMMC Neo-Skeuomorphism — Animation System
 * Barrel export for all animation primitives, hooks, and constants.
 */

// Motion constants & easing presets
export { ease, spring, dur, STAGGER_STEP, transition } from './motion-constants';

// Hooks
export {
  useReducedMotion,
  useViewportEntry,
  useShadowDepth,
  useAnimatedCounter,
} from './hooks';

// Unified physics hook
export { useCardPhysics } from './useCardPhysics';
export type { CardPhysicsConfig, CardPhysicsReturn } from './useCardPhysics';

// Primitive components
export { FadeUp, ScaleIn, PressEffect } from './primitives';

// Interactive components
export { MagneticHover, RippleButton } from './interactive';

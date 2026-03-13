/**
 * VMMC Neo-Skeuomorphism — Motion constants
 * Framer Motion variants matching our CSS custom properties.
 * Single source of truth for easing and durations in TS land.
 */

/* ── Easing Curves ── */
export const ease = {
  spring: [0.34, 1.56, 0.64, 1] as const,
  snap:   [0.87, 0, 0.13, 1]    as const,
  float:  [0.23, 1, 0.32, 1]    as const,
  settle: [0.55, 0, 0.1, 1]     as const,
  rubber: [0.68, -0.55, 0.265, 1.55] as const,
};

/* ── Spring Configs (for Framer Motion `type: "spring"`) ── */
export const spring = {
  bouncy:  { type: 'spring' as const, stiffness: 300, damping: 20, mass: 0.8 },
  snappy:  { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.6 },
  gentle:  { type: 'spring' as const, stiffness: 200, damping: 26, mass: 1.0 },
  rubber:  { type: 'spring' as const, stiffness: 400, damping: 15, mass: 0.5 },
  settle:  { type: 'spring' as const, stiffness: 260, damping: 32, mass: 1.2 },
};

/* ── Durations (ms) ── */
export const dur = {
  instant:  80,
  fast:     120,
  normal:   200,
  slow:     350,
  entrance: 450,
};

/* ── Stagger ── */
export const STAGGER_STEP = 0.06; // 60ms in seconds

/* ── Framer Motion Transition Presets ── */
export const transition = {
  press:    { duration: dur.fast / 1000, ease: ease.snap },
  hover:    { duration: dur.normal / 1000, ease: ease.float },
  entrance: { duration: dur.entrance / 1000, ease: ease.float },
  exit:     { duration: dur.normal / 1000, ease: ease.snap },
};

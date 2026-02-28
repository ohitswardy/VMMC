import { useEffect, useRef, useCallback } from 'react';

/**
 * Idle-timeout hook.
 *
 * Monitors user activity (mouse, keyboard, scroll, touch, focus) and fires
 * the `onIdle` callback after `timeoutMs` of inactivity. A warning callback
 * fires `warningMs` before the timeout so the UI can show a countdown.
 *
 * Activity resets the timer. The hook only runs when `enabled` is true,
 * making it safe to mount unconditionally and toggle with auth state.
 */

const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'pointerdown',
  'wheel',
];

interface UseIdleTimeoutOptions {
  /** Total idle time before `onIdle` fires (ms). Default: 30 min */
  timeoutMs?: number;
  /** How long before timeout to fire `onWarning` (ms). Default: 5 min */
  warningMs?: number;
  /** Enable / disable the watcher */
  enabled: boolean;
  /** Called when the idle time has elapsed */
  onIdle: () => void;
  /** Called when the user is about to time out (optional) */
  onWarning?: () => void;
  /** Called when user becomes active again after a warning was fired (optional) */
  onWarningDismiss?: () => void;
}

export default function useIdleTimeout({
  timeoutMs = 30 * 60 * 1000,  // 30 minutes
  warningMs = 5 * 60 * 1000,   // 5-minute warning
  enabled,
  onIdle,
  onWarning,
  onWarningDismiss,
}: UseIdleTimeoutOptions) {
  // Persist callbacks in refs so the effect doesn't re-run when they change
  const onIdleRef = useRef(onIdle);
  const onWarningRef = useRef(onWarning);
  const onWarningDismissRef = useRef(onWarningDismiss);
  onIdleRef.current = onIdle;
  onWarningRef.current = onWarning;
  onWarningDismissRef.current = onWarningDismiss;

  // Timer IDs
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningFiredRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();

    // If user moves while a warning is showing, dismiss the warning
    if (warningFiredRef.current) {
      warningFiredRef.current = false;
      onWarningDismissRef.current?.();
    }

    // Set the warning timer (fires warningMs before timeout)
    const warningDelay = Math.max(timeoutMs - warningMs, 0);
    if (warningDelay > 0 && onWarningRef.current) {
      warningTimerRef.current = setTimeout(() => {
        warningFiredRef.current = true;
        onWarningRef.current?.();
      }, warningDelay);
    }

    // Set the main idle timer
    idleTimerRef.current = setTimeout(() => {
      onIdleRef.current();
    }, timeoutMs);
  }, [timeoutMs, warningMs, clearTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      warningFiredRef.current = false;
      return;
    }

    // Start fresh
    resetTimers();

    const handleActivity = () => resetTimers();

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, handleActivity, { passive: true });
    }
    // Also listen on window focus (user returning from another tab)
    window.addEventListener('focus', handleActivity);
    // Storage event: detect activity from other tabs
    window.addEventListener('storage', handleActivity);

    return () => {
      clearTimers();
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, handleActivity);
      }
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('storage', handleActivity);
    };
  }, [enabled, resetTimers, clearTimers]);
}

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, useCallback, type ReactNode } from 'react';

/**
 * Neo-Skeuomorphism Modal / Dialog
 * - Frosted backdrop with blur
 * - Panel: raised surface with layered shadows + inner highlight
 * - Close button: tactile raised surface
 * - Bottom sheet on mobile with swipe indicator
 */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleExtra?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'md:max-w-md',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  xl: 'md:max-w-4xl',
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ isOpen, onClose, title, titleExtra, children, size = 'lg' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);
  const didAutoFocusRef = useRef(false);
  const wasOpenRef = useRef(false);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;

  // Keep onClose in a ref so handleKeyDown never needs to change identity
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Stable focus-trap handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCloseRef.current();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;

    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  // Track whether this modal instance locked scroll
  const didLockScrollRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      previousActiveRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      didLockScrollRef.current = true;

      // Auto-focus the first input once when modal opens
      if (!didAutoFocusRef.current) {
        didAutoFocusRef.current = true;
        requestAnimationFrame(() => {
          if (panelRef.current) {
            const firstInput = panelRef.current.querySelector<HTMLElement>(
              'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
            );
            firstInput?.focus();
          }
        });
      }
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      if (didLockScrollRef.current) {
        document.body.style.overflow = 'unset';
        didLockScrollRef.current = false;
      }
      didAutoFocusRef.current = false;

      // Only restore focus when the modal actually closes (not on mount)
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        if (previousActiveRef.current && typeof previousActiveRef.current.focus === 'function') {
          previousActiveRef.current.focus();
        }
      }
    }

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (didLockScrollRef.current) {
        document.body.style.overflow = 'unset';
        didLockScrollRef.current = false;
      }
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
          {/* Frosted Backdrop */}
          <div
            className="absolute inset-0 bg-gray-950/35 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel — raised neo-skeu surface */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`relative w-full ${sizeClasses[size]}
              bg-white/95 backdrop-blur-md
              rounded-t-[18px] md:rounded-[14px] overflow-hidden
              max-h-[92vh] md:max-h-[85vh] flex flex-col
              border border-white/60`}
            style={{
              boxShadow: [
                '0 24px 64px -12px oklch(0.15 0.01 75 / 0.20)',
                '0 8px 24px oklch(0.15 0.01 75 / 0.10)',
                'inset 0 1px 0 oklch(1 0 0 / 0.60)',
              ].join(', '),
            }}
            initial={{ y: '100%', opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 1 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Ambient top highlight */}
            <div
              className="absolute top-0 left-4 right-4 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.60), transparent)' }}
            />

            {/* Swipe handle (mobile) */}
            <div className="md:hidden swipe-indicator" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 md:px-6 md:py-4 border-b border-gray-200/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <h2 id={titleId} className="text-[15px] md:text-base font-bold text-gray-900 shrink-0">{title}</h2>
                {titleExtra && <span className="text-[11px] text-gray-500 truncate">{titleExtra}</span>}
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-1 rounded-[10px] touch-target
                  bg-gray-100 border border-gray-200
                  shadow-[0_1px_2px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.50)]
                  hover:bg-gray-150 hover:shadow-[0_2px_4px_oklch(0.15_0.01_75/0.10),inset_0_1px_0_oklch(1_0_0/0.60)]
                  active:shadow-[inset_0_1px_3px_oklch(0.15_0.01_75/0.15)] active:scale-[0.95]
                  transition-all duration-[120ms]"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 md:px-6 md:py-6 overflow-y-auto flex-1 min-h-0">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

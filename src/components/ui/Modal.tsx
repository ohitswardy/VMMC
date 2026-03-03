import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, useCallback, type ReactNode } from 'react';

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
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;

  // Focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      // Auto-focus the first focusable element inside the panel
      requestAnimationFrame(() => {
        if (panelRef.current) {
          const first = panelRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
          first?.focus();
        }
      });
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';

      // Restore focus to the element that triggered the modal
      if (previousActiveRef.current && typeof previousActiveRef.current.focus === 'function') {
        previousActiveRef.current.focus();
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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-950/40" aria-hidden="true" />

          {/* Panel — bottom sheet on mobile, centered on desktop */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`relative w-full ${sizeClasses[size]} bg-white rounded-t-[16px] md:rounded-[12px] overflow-hidden max-h-[92vh] md:max-h-[85vh] flex flex-col`}
            style={{ boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.15)' }}
            initial={{ y: '100%', opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 1 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Swipe handle (mobile) */}
            <div className="md:hidden swipe-indicator" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 md:px-6 md:py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <h2 id={titleId} className="text-[15px] md:text-base font-semibold text-gray-900 shrink-0">{title}</h2>
                {titleExtra && <span className="text-[11px] text-gray-500 truncate">{titleExtra}</span>}
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-1 rounded-[8px] hover:bg-gray-100 active:bg-gray-150 transition-colors touch-target"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 text-gray-400" />
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

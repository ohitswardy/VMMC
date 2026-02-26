import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

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

export default function Modal({ isOpen, onClose, title, titleExtra, children, size = 'lg' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
          <div className="absolute inset-0 bg-gray-950/40" />

          {/* Panel — bottom sheet on mobile, centered on desktop */}
          <motion.div
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
                <h2 className="text-[15px] md:text-base font-semibold text-gray-900 shrink-0">{title}</h2>
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

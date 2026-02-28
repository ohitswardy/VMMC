import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_VERSION,
  PRIVACY_POLICY_EFFECTIVE_DATE,
  acknowledgePolicy,
} from '../../lib/privacyPolicy';

interface DataPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function DataPrivacyModal({ isOpen, onClose, userId }: DataPrivacyModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Scroll content to top when modal opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const handleClose = () => {
    // Closing the modal = acknowledging the policy
    acknowledgePolicy(userId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-[60] flex items-end md:items-center md:justify-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
        >
          {/* Backdrop — slightly darker for emphasis */}
          <motion.div
            className="absolute inset-0 bg-gray-950/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full md:max-w-2xl bg-white rounded-t-[16px] md:rounded-[12px] overflow-hidden max-h-[92vh] md:max-h-[85vh] flex flex-col"
            style={{ boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)' }}
            initial={{ y: '100%', opacity: 0.5, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.97 }}
            transition={{
              type: 'spring',
              damping: 32,
              stiffness: 280,
              mass: 0.9,
            }}
          >
            {/* Swipe handle (mobile) */}
            <div className="md:hidden swipe-indicator" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 md:px-6 md:py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-[8px] bg-accent-50">
                  <Shield className="w-4 h-4 text-accent-600" />
                </div>
                <div>
                  <h2 className="text-[15px] md:text-base font-semibold text-gray-900">
                    Data Privacy Policy & User Agreement
                  </h2>
                  <span className="text-[11px] text-gray-400">
                    Version {PRIVACY_POLICY_VERSION} · Effective {PRIVACY_POLICY_EFFECTIVE_DATE}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 -mr-1 rounded-[8px] hover:bg-gray-100 active:bg-gray-150 transition-colors touch-target"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div
              ref={contentRef}
              className="px-5 py-5 md:px-6 md:py-6 overflow-y-auto flex-1 min-h-0"
            >
              {/* Intro banner */}
              <motion.div
                className="flex items-start gap-3 p-4 rounded-[10px] bg-accent-50/60 border border-accent-100 mb-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <FileText className="w-5 h-5 text-accent-500 mt-0.5 shrink-0" />
                <div className="text-[13px] text-gray-600 leading-relaxed">
                  <p>
                    Please read the following Data Privacy Policy and User Agreement carefully.
                    This document explains how the VMMC OR Booking System collects, uses, and
                    protects your personal information.
                  </p>
                </div>
              </motion.div>

              {/* Policy sections */}
              <div className="space-y-5">
                {PRIVACY_POLICY_SECTIONS.map((section, idx) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.03, duration: 0.3 }}
                  >
                    <h3 className="text-[13px] font-semibold text-gray-800 mb-1.5">
                      {section.title}
                    </h3>
                    <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Acknowledgment notice */}
              <motion.div
                className="mt-8 pt-5 border-t border-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <div className="flex items-start gap-3 p-4 rounded-[10px] bg-gray-50 border border-gray-200">
                  <div className="w-2 h-2 rounded-full bg-accent-500 mt-1.5 shrink-0" />
                  <p className="text-[12.5px] text-gray-500 leading-relaxed">
                    By closing this window, you acknowledge that you have read, understood, and
                    agree to be bound by this Data Privacy Policy and User Agreement. Continued
                    use of the VMMC OR Booking System constitutes your acceptance of these terms.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 md:px-6 md:py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Republic Act No. 10173 — Data Privacy Act of 2012
                </span>
                <button
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-[8px] hover:bg-gray-800 active:bg-black transition-colors"
                >
                  I Understand, Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

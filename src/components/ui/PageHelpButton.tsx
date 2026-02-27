import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ChevronRight, Lightbulb } from 'lucide-react';

export interface HelpStep {
  icon?: string;   // emoji or short symbol
  title: string;
  body: string;
}

interface PageHelpButtonProps {
  title: string;
  intro: string;
  steps: HelpStep[];
}

/**
 * Seamless, page-level contextual help.
 * Renders a small pill button that opens a slide-over drawer with
 * step-by-step guidance written in plain language.
 */
export default function PageHelpButton({ title, intro, steps }: PageHelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Trigger pill ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
          text-[12px] font-semibold text-accent-600
          bg-accent-50 border border-accent-100
          hover:bg-accent-100 hover:border-accent-200
          active:bg-accent-150 transition-all duration-150
          shrink-0 cursor-pointer select-none"
        aria-label={`Help: ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Help</span>
      </button>

      {/* ── Drawer overlay ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-950/30" onClick={() => setOpen(false)} />

            {/* Panel */}
            <motion.aside
              className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col
                rounded-l-2xl overflow-hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4 text-accent-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-bold text-gray-900 truncate">{title}</h2>
                  <p className="text-[11px] text-gray-400">Page Guide</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Close help"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Intro blurb */}
                <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-accent-50/60 border border-accent-100">
                  <Lightbulb className="w-4 h-4 text-accent-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] leading-relaxed text-accent-800">{intro}</p>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      {/* Step number / icon */}
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5
                        text-[13px] font-bold text-gray-500 group-hover:bg-accent-50 group-hover:text-accent-600 transition-colors">
                        {step.icon || i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800">{step.title}</p>
                        <p className="text-[12px] text-gray-500 leading-relaxed mt-0.5">{step.body}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-1 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full py-2 rounded-lg text-[13px] font-semibold
                    text-white bg-accent-600 hover:bg-accent-700
                    active:bg-accent-800 transition-colors cursor-pointer"
                >
                  Got it!
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

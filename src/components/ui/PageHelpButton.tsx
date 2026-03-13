import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ChevronRight, Lightbulb } from 'lucide-react';

/**
 * Neo-Skeuomorphism Page Help Button & Drawer
 * - Trigger: raised tactile pill button with glow
 * - Drawer: frosted glass slide-over with layered depth
 * - Steps: embossed number badges
 * - Footer CTA: raised primary button
 */

export interface HelpStep {
  icon?: string;
  title: string;
  body: string;
}

interface PageHelpButtonProps {
  title: string;
  intro: string;
  steps: HelpStep[];
}

export default function PageHelpButton({ title, intro, steps }: PageHelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Trigger pill — raised tactile ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
          text-[12px] font-bold text-accent-600
          bg-accent-50 border border-accent-100
          shadow-[0_1px_3px_oklch(0.3_0.15_270/0.10),inset_0_1px_0_oklch(1_0_0/0.40)]
          hover:bg-accent-100 hover:border-accent-200
          hover:shadow-[0_2px_6px_oklch(0.3_0.15_270/0.15),inset_0_1px_0_oklch(1_0_0/0.50)]
          active:shadow-[inset_0_1px_3px_oklch(0.3_0.15_270/0.12)] active:scale-[0.97]
          transition-all duration-[120ms]
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
            {/* Frosted Backdrop */}
            <div className="absolute inset-0 bg-gray-950/30 backdrop-blur-sm" onClick={() => setOpen(false)} />

            {/* Panel — frosted glass drawer */}
            <motion.aside
              className="relative w-full max-w-sm flex flex-col
                bg-white/92 backdrop-blur-xl backdrop-saturate-150
                rounded-l-2xl overflow-hidden
                border-l border-white/50"
              style={{
                boxShadow: [
                  '-12px 0 48px oklch(0.15 0.01 75 / 0.15)',
                  '-4px 0 16px oklch(0.15 0.01 75 / 0.08)',
                  'inset 1px 0 0 oklch(1 0 0 / 0.40)',
                ].join(', '),
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-200/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  bg-accent-50 border border-accent-100
                  shadow-[0_1px_2px_oklch(0.3_0.15_270/0.08),inset_0_1px_0_oklch(1_0_0/0.40)]">
                  <HelpCircle className="w-4 h-4 text-accent-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-bold text-gray-900 truncate">{title}</h2>
                  <p className="text-[11px] text-gray-400 font-medium">Page Guide</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg cursor-pointer
                    bg-gray-100 border border-gray-200
                    shadow-[0_1px_2px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.40)]
                    hover:bg-gray-150 active:shadow-[inset_0_1px_3px_oklch(0.15_0.01_75/0.12)] active:scale-[0.95]
                    transition-all duration-[120ms]"
                  aria-label="Close help"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Intro blurb — embossed info card */}
                <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl
                  bg-accent-50/60 border border-accent-100
                  shadow-[inset_0_1px_3px_oklch(0.3_0.15_270/0.06),0_1px_0_oklch(1_0_0/0.40)]">
                  <Lightbulb className="w-4 h-4 text-accent-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] leading-relaxed text-accent-800">{intro}</p>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      {/* Step number / icon — embossed badge */}
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5
                        bg-gray-100 border border-gray-200
                        shadow-[0_1px_2px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.40)]
                        text-[13px] font-bold text-gray-500
                        group-hover:bg-accent-50 group-hover:border-accent-100 group-hover:text-accent-600
                        transition-all duration-[120ms]">
                        {step.icon || i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-gray-800">{step.title}</p>
                        <p className="text-[12px] text-gray-500 leading-relaxed mt-0.5">{step.body}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-1 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer — raised CTA */}
              <div className="px-5 py-3.5 border-t border-gray-200/60 bg-gray-50/80">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full py-2.5 rounded-lg text-[13px] font-bold cursor-pointer
                    text-white bg-accent-600 border border-accent-700
                    shadow-[0_2px_6px_oklch(0.3_0.15_270/0.25),inset_0_1px_0_oklch(1_0_0/0.12)]
                    hover:bg-accent-700 hover:shadow-[0_4px_12px_oklch(0.3_0.15_270/0.30),inset_0_1px_0_oklch(1_0_0/0.14)]
                    active:bg-accent-800 active:shadow-[inset_0_2px_6px_oklch(0.2_0.10_270/0.30)] active:scale-[0.98]
                    transition-all duration-[120ms]"
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

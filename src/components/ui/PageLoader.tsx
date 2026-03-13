import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Neo-Skeuomorphism Page Loader
 * - Centered on raised frosted glass surface
 * - Spinner with accent glow halo
 * - Embossed text label
 */

interface PageLoaderProps {
  label?: string;
}

export default function PageLoader({ label = 'Loading…' }: PageLoaderProps) {
  return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center gap-4 px-8 py-6 rounded-2xl
          bg-white/80 backdrop-blur-lg border border-white/50
          shadow-[0_8px_32px_oklch(0.15_0.01_75/0.10),0_2px_8px_oklch(0.15_0.01_75/0.06),inset_0_1px_0_oklch(1_0_0/0.50)]"
      >
        <div className="relative">
          <Loader2 className="w-7 h-7 animate-spin text-accent-500" />
          <div className="absolute inset-0 w-7 h-7 rounded-full blur-md bg-accent-400/20" />
        </div>
        <span className="text-sm font-semibold text-gray-500">{label}</span>
      </motion.div>
    </div>
  );
}

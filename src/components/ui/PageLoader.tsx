import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  /** Optional label, e.g. "Loading bookings…" */
  label?: string;
}

/**
 * Full-page centered spinner shown while initial data is being fetched.
 * Prevents the flash-of-empty-content on first paint.
 */
export default function PageLoader({ label = 'Loading…' }: PageLoaderProps) {
  return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center gap-3 text-gray-400"
      >
        <Loader2 className="w-7 h-7 animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </motion.div>
    </div>
  );
}

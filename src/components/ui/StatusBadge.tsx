import { getStatusColor } from '../../lib/utils';

/**
 * Neo-Skeuomorphism Status Badge
 * - Embossed pill with layered shadows
 * - Subtle inner light rim
 * - Pulsing dot for ongoing status
 */

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

/** Format raw status string for display: replace underscores with spaces, capitalise */
function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = getStatusColor(status);
  const label = formatStatus(status);
  return (
    <span
      role="status"
      aria-label={`Status: ${label}`}
      className={`
        inline-flex items-center gap-1.5 rounded-[8px] font-bold whitespace-nowrap
        ${colors.bg} ${colors.text} border ${colors.border || 'border-transparent'}
        shadow-[0_1px_2px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.20)]
        ${size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${status === 'ongoing' ? 'animate-pulse' : ''}`} aria-hidden="true" />
      {label}
    </span>
  );
}

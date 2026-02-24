import { getStatusColor } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = getStatusColor(status);
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-[6px] font-semibold capitalize whitespace-nowrap
        ${colors.bg} ${colors.text} border ${colors.border || 'border-transparent'}
        ${size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${status === 'ongoing' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
}

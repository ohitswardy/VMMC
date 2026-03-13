import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

/**
 * Neo-Skeuomorphism Button
 * - Raised default: layered outer shadow + inner light rim
 * - Hover: accent glow halo
 * - Active/pressed: inverted inset shadow, scale(0.97)
 * - 120ms ease transitions
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-semibold',
    'rounded-[10px] transition-all duration-[120ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-500',
    'focus-visible:shadow-[0_0_8px_oklch(0.55_0.24_270/0.20)]',
    'disabled:opacity-40 disabled:pointer-events-none select-none',
    'active:scale-[0.97] cursor-pointer',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-gray-900 text-white border border-gray-800',
          'shadow-[0_2px_4px_oklch(0.15_0.01_75/0.30),0_1px_2px_oklch(0.15_0.01_75/0.20),inset_0_1px_0_oklch(1_0_0/0.10)]',
          'hover:bg-gray-800 hover:shadow-[0_4px_12px_oklch(0.15_0.01_75/0.35),0_2px_4px_oklch(0.15_0.01_75/0.20),inset_0_1px_0_oklch(1_0_0/0.12)]',
          'active:bg-gray-950 active:shadow-[inset_0_2px_6px_oklch(0.05_0.01_75/0.40),inset_0_1px_2px_oklch(0.05_0.01_75/0.25)]',
        ].join(' '),
        secondary: [
          'bg-white text-gray-700 border border-gray-200',
          'shadow-[0_2px_4px_oklch(0.15_0.01_75/0.12),0_1px_2px_oklch(0.15_0.01_75/0.06),inset_0_1px_0_oklch(1_0_0/0.60)]',
          'hover:bg-gray-50 hover:border-gray-300 hover:shadow-[0_4px_12px_oklch(0.15_0.01_75/0.15),0_2px_4px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.70)]',
          'active:bg-gray-100 active:shadow-[inset_0_2px_6px_oklch(0.15_0.01_75/0.15),inset_0_1px_2px_oklch(0.15_0.01_75/0.10)]',
        ].join(' '),
        danger: [
          'bg-red-600 text-white border border-red-700',
          'shadow-[0_2px_4px_oklch(0.3_0.15_25/0.30),0_1px_2px_oklch(0.3_0.15_25/0.20),inset_0_1px_0_oklch(1_0_0/0.12)]',
          'hover:bg-red-700 hover:shadow-[0_4px_12px_oklch(0.3_0.15_25/0.35),0_0_12px_oklch(0.58_0.22_25/0.20),inset_0_1px_0_oklch(1_0_0/0.14)]',
          'active:bg-red-800 active:shadow-[inset_0_2px_6px_oklch(0.2_0.10_25/0.40),inset_0_1px_2px_oklch(0.2_0.10_25/0.25)]',
        ].join(' '),
        ghost: [
          'bg-transparent text-gray-500 border border-transparent',
          'shadow-none',
          'hover:text-gray-800 hover:bg-gray-100 hover:shadow-[0_1px_3px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.40)]',
          'active:bg-gray-150 active:shadow-[inset_0_1px_3px_oklch(0.15_0.01_75/0.12)]',
        ].join(' '),
        accent: [
          'bg-accent-600 text-white border border-accent-700',
          'shadow-[0_2px_4px_oklch(0.3_0.15_270/0.30),0_1px_2px_oklch(0.3_0.15_270/0.18),inset_0_1px_0_oklch(1_0_0/0.12)]',
          'hover:bg-accent-700 hover:shadow-[0_4px_12px_oklch(0.3_0.15_270/0.35),0_0_12px_oklch(0.55_0.24_270/0.20),inset_0_1px_0_oklch(1_0_0/0.14)]',
          'active:bg-accent-800 active:shadow-[inset_0_2px_6px_oklch(0.2_0.10_270/0.40),inset_0_1px_2px_oklch(0.2_0.10_270/0.25)]',
        ].join(' '),
        outline: [
          'bg-transparent text-gray-700 border border-gray-200',
          'shadow-[0_1px_2px_oklch(0.15_0.01_75/0.06),inset_0_1px_0_oklch(1_0_0/0.30)]',
          'hover:border-gray-300 hover:bg-gray-50 hover:shadow-[0_2px_6px_oklch(0.15_0.01_75/0.10),inset_0_1px_0_oklch(1_0_0/0.50)]',
          'active:bg-gray-100 active:shadow-[inset_0_2px_4px_oklch(0.15_0.01_75/0.12)]',
        ].join(' '),
      },
      size: {
        sm:   'px-3 py-1.5 text-xs min-h-[32px]',
        md:   'px-4 py-2 text-sm min-h-[38px]',
        lg:   'px-5 py-2.5 text-sm min-h-[44px]',
        icon: 'p-2 min-h-[38px] min-w-[38px]',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: ReactNode;
  loading?: boolean;
}

export default function Button({
  variant,
  size,
  fullWidth,
  icon,
  loading,
  children,
  className = '',
  disabled,
  onDrag: _onDrag,
  onDragStart: _onDragStart,
  onDragEnd: _onDragEnd,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...(props as Record<string, unknown>)}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

export { buttonVariants };

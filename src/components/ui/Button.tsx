import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-semibold',
    'rounded-[8px] transition-all duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-500',
    'disabled:opacity-40 disabled:pointer-events-none select-none',
    'active:scale-[0.97]',
    'cursor-pointer',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950 shadow-xs',
        secondary:
          'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 shadow-xs',
        danger:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-xs',
        ghost:
          'bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-150',
        accent:
          'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 shadow-xs',
        outline:
          'bg-transparent text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50',
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

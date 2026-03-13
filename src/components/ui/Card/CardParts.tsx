import type { ReactNode } from 'react';

/**
 * Card compound sub-components.
 * Used inside any Card variant for consistent anatomy.
 *
 * <Card.Header icon={...} badge="New" />
 * <Card.Body>...</Card.Body>
 * <Card.Footer actions={[...]} />
 */

/* ── Card.Header ── */
interface CardHeaderProps {
  children?: ReactNode;
  icon?: ReactNode;
  badge?: string;
  /** Right-aligned extra content */
  extra?: ReactNode;
  className?: string;
}

export function CardHeader({ children, icon, badge, extra, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-center gap-3 px-5 pt-5 md:px-6 md:pt-6 ${className}`}>
      {icon && (
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0
          bg-accent-50 border border-accent-100 text-accent-600
          shadow-[0_1px_2px_oklch(0.3_0.15_270/0.08),inset_0_1px_0_oklch(1_0_0/0.40)]">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {children}
      </div>
      {badge && (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
          text-accent-600 bg-accent-50 border border-accent-100
          shadow-[0_1px_2px_oklch(0.3_0.15_270/0.06),inset_0_1px_0_oklch(1_0_0/0.30)]">
          {badge}
        </span>
      )}
      {extra}
    </div>
  );
}

/* ── Card.Body ── */
interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`px-5 py-4 md:px-6 ${className}`}>
      {children}
    </div>
  );
}

/* ── Card.Footer ── */
interface CardFooterProps {
  children?: ReactNode;
  actions?: ReactNode[];
  className?: string;
}

export function CardFooter({ children, actions, className = '' }: CardFooterProps) {
  return (
    <div className={`px-5 pb-5 pt-3 md:px-6 md:pb-6 border-t border-gray-200/60 flex items-center gap-2 ${className}`}>
      {children}
      {actions && (
        <div className="flex items-center gap-2 ml-auto">
          {actions.map((action, i) => (
            <span key={i}>{action}</span>
          ))}
        </div>
      )}
    </div>
  );
}

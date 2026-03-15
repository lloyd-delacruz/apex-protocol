import { HTMLAttributes } from 'react';

type BadgeVariant = 'achieved' | 'progress' | 'failed' | 'neutral' | 'warning';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  achieved: 'bg-success/10 text-success border-success/20',
  progress: 'bg-accent/10 text-accent border-accent/20',
  failed: 'bg-danger/10 text-danger border-danger/20',
  neutral: 'bg-white/[0.06] text-text-muted border-white/[0.08]',
  warning: 'bg-warning/10 text-warning border-warning/20',
};

export default function Badge({
  variant = 'neutral',
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-semibold border
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

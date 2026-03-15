import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  noPadding?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ elevated = false, noPadding = false, children, className = '', ...props }, ref) => {
    const baseClasses = elevated
      ? 'bg-surface-elevated border border-white/[0.06] rounded-card'
      : 'bg-surface border border-white/[0.06] rounded-card';

    const shadowClass = elevated
      ? 'shadow-elevated'
      : 'shadow-surface';

    const paddingClass = noPadding ? '' : 'p-5';

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${shadowClass} ${paddingClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;

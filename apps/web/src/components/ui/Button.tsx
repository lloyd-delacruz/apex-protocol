import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `bg-accent text-background font-semibold
    hover:brightness-110 active:scale-95
    disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100
    transition-transform duration-150 ease-out`,
  secondary: `bg-surface-elevated text-text-primary font-medium
    border border-white/[0.08]
    hover:border-accent/40 hover:text-accent
    active:scale-95
    disabled:opacity-60 disabled:cursor-not-allowed
    transition-transform duration-150 ease-out`,
  ghost: `text-text-muted font-medium
    hover:text-text-primary hover:bg-white/[0.04]
    active:scale-95
    disabled:opacity-60 disabled:cursor-not-allowed
    transition-transform duration-150 ease-out`,
  danger: `bg-danger/10 text-danger font-medium
    border border-danger/20
    hover:bg-danger/20 hover:border-danger/40
    active:scale-95
    disabled:opacity-60 disabled:cursor-not-allowed
    transition-transform duration-150 ease-out`,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-[6px]',
  md: 'px-5 py-2.5 text-sm rounded-card',
  lg: 'px-6 py-3 text-base rounded-card',
};

const shadowClasses: Record<ButtonVariant, string> = {
  primary: 'shadow-accent-sm',
  secondary: '',
  ghost: '',
  danger: '',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${shadowClasses[variant]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

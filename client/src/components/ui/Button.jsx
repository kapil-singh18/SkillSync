import React from 'react';
import Spinner from './Spinner';

const sizeClasses = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-lg gap-2',
};

const variantClasses = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] focus-visible:ring-[var(--color-accent)]',
  secondary:
    'bg-[var(--color-surface-raised)] text-[var(--color-foreground)] border border-[var(--color-border)] hover:bg-[var(--color-border)]',
  outline:
    'bg-transparent text-[var(--color-foreground)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]',
  ghost:
    'bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)]',
  danger:
    'bg-[var(--color-danger)] text-white hover:opacity-90 focus-visible:ring-[var(--color-danger)]',
};

const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-offset-[var(--color-background)]',
          'disabled:opacity-50 disabled:cursor-not-allowed select-none',
          sizeClasses[size],
          variantClasses[variant],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

const variantClasses = {
  neutral:
    'bg-[var(--color-surface-raised)] text-[var(--color-muted-foreground)] border border-[var(--color-border)]',
  accent:
    'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20',
  success:
    'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20',
  warning:
    'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20',
  danger:
    'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20',
};

const Badge = ({ children, variant = 'neutral', className = '' }) => (
  <span
    className={[
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
      variantClasses[variant],
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </span>
);

export default Badge;

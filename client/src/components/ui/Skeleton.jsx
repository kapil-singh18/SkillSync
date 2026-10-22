const Skeleton = ({ className = '', variant = 'block', ...props }) => {
  const baseClass = [
    'animate-pulse bg-[var(--color-surface-raised)] rounded',
    variant === 'circle' ? 'rounded-full' : 'rounded-lg',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={baseClass} aria-hidden="true" role="presentation" {...props} />;
};

Skeleton.Text = ({ lines = 3, className = '' }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className="h-4"
        style={{ width: i === lines - 1 ? '60%' : '100%' }}
      />
    ))}
  </div>
);

Skeleton.Card = ({ className = '' }) => (
  <div
    className={[
      'p-5 rounded-xl border border-[var(--color-border)]',
      'bg-[var(--color-surface)] flex flex-col gap-3',
      className,
    ].join(' ')}
  >
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <Skeleton.Text lines={3} />
  </div>
);

export default Skeleton;

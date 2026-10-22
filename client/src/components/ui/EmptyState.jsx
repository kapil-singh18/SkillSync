import Button from './Button';

const EmptyState = ({
  icon: Icon,
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) => (
  <div
    className={[
      'flex flex-col items-center justify-center text-center py-16 px-6 gap-4',
      className,
    ].join(' ')}
  >
    {Icon && (
      <div className="w-14 h-14 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center">
        <Icon
          size={24}
          className="text-[var(--color-muted-foreground)]"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
    )}
    <div className="flex flex-col gap-1.5 max-w-xs">
      <h3 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-muted-foreground)]">{description}</p>
      )}
    </div>
    {action && (
      <Button variant="primary" size="md" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

export default EmptyState;

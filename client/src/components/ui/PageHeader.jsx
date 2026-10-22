const PageHeader = ({
  title,
  subtitle,
  action,
  className = '',
}) => (
  <div
    className={[
      'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between',
      className,
    ].join(' ')}
  >
    <div className="flex flex-col gap-0.5">
      <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{title}</h1>
      {subtitle && (
        <p className="text-sm text-[var(--color-muted-foreground)]">{subtitle}</p>
      )}
    </div>
    {action && <div className="flex items-center gap-3 mt-3 sm:mt-0">{action}</div>}
  </div>
);

export default PageHeader;

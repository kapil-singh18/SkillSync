/**
 * ProgressBar — displays a 0-100 percentage with a colored fill.
 * Uses design tokens exclusively.
 */
const ProgressBar = ({
  value = 0,
  label,
  showPercent = true,
  size = 'md',
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  const color =
    clamped >= 80
      ? 'var(--color-success)'
      : clamped >= 50
      ? 'var(--color-accent)'
      : 'var(--color-warning)';

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-[var(--color-foreground)]">{label}</span>
          )}
          {showPercent && (
            <span className="text-xs font-semibold" style={{ color }}>
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        className={`w-full rounded-full bg-[var(--color-border)] ${heights[size]}`}
      >
        <div
          className="rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, height: '100%', backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

const sizeClasses = {
  xs: 'w-6 h-6 text-[0.5rem]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const Avatar = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
  ...props
}) => {
  const initials = getInitials(name || alt);

  return (
    <div
      role="img"
      aria-label={alt || name || 'Avatar'}
      className={[
        'relative inline-flex items-center justify-center rounded-full overflow-hidden',
        'bg-[var(--color-surface-raised)] border border-[var(--color-border)]',
        'font-semibold text-[var(--color-muted-foreground)] select-none flex-shrink-0',
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
};

export default Avatar;

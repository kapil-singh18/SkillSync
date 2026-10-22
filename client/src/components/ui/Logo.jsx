const Logo = ({ size = 'md', className = '' }) => {
  const isLg = size === 'md';

  return (
    <div
      className={[
        'inline-flex items-center gap-2 select-none',
        className,
      ].join(' ')}
      aria-label="SkillSync"
    >
      {/* Mark — a simple stylized "S" */}
      <div
        className={[
          'flex items-center justify-center rounded-lg flex-shrink-0',
          'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-bold',
          isLg ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs',
        ].join(' ')}
        aria-hidden="true"
      >
        S
      </div>
      {/* Wordmark */}
      <span
        className={[
          'font-semibold tracking-tight text-[var(--color-foreground)]',
          isLg ? 'text-lg' : 'text-base',
        ].join(' ')}
      >
        Skill<span className="text-[var(--color-accent)]">Sync</span>
      </span>
    </div>
  );
};

export default Logo;

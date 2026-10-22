const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-8 h-8 border-[3px]',
};

const Spinner = ({ size = 'md', className = '' }) => (
  <span
    role="status"
    aria-label="Loading"
    className={[
      'inline-block rounded-full animate-spin',
      'border-[var(--color-border)] border-t-[var(--color-accent)]',
      sizeMap[size],
      className,
    ].join(' ')}
  />
);

export default Spinner;

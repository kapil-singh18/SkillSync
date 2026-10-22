const Card = ({
  children,
  className = '',
  padding = true,
  hover = false,
  as: Tag = 'div',
  ...props
}) => (
  <Tag
    className={[
      'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl',
      'shadow-[var(--shadow-card)] transition-colors duration-150',
      padding ? 'p-5' : '',
      hover
        ? 'hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] cursor-pointer'
        : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </Tag>
);

export default Card;

/**
 * Standardized PageHeader component across all dashboard views.
 *
 * @param {Object} props
 * @param {string} props.title - Main page title
 * @param {string} [props.subtitle] - Optional descriptive subtitle below the title
 * @param {React.ReactNode} [props.action] - Optional action buttons/elements placed top-right
 * @param {Object} [props.style] - Inline style override
 */
const PageHeader = ({ title, subtitle, action, style = {} }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <div style={{ flex: 1, minWidth: '200px' }}>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-heading, #111827)',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              color: 'var(--color-muted, #6B7280)',
              fontSize: '0.875rem',
              marginTop: '0.25rem',
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

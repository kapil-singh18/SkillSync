import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Standardized Empty State Component across all lists and feeds.
 *
 * @param {Object} props
 * @param {React.ElementType} [props.icon=Inbox] - Lucide icon component
 * @param {string} props.title - Main empty state title
 * @param {string} [props.description] - Descriptive help text
 * @param {string} [props.actionLabel] - CTA button label
 * @param {string} [props.actionTo] - Link route for CTA button
 * @param {Function} [props.onAction] - Click handler for CTA button
 * @param {React.ReactNode} [props.actionNode] - Custom action element
 * @param {boolean} [props.inCard=true] - Whether to wrap in standard card
 * @param {Object} [props.style] - Inline style override
 */
const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  actionNode,
  inCard = true,
  style = {},
}) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
        ...style,
      }}
    >
      {/* Icon Circle */}
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary-light, #EFF6FF)',
          color: 'var(--color-primary, #2563EB)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <Icon size={24} strokeWidth={1.8} />
      </div>

      {/* Heading */}
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--color-heading, #111827)',
          marginBottom: description ? '0.375rem' : '0',
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-muted, #6B7280)',
            maxWidth: '380px',
            lineHeight: 1.5,
            marginBottom: actionLabel || actionNode ? '1.25rem' : '0',
          }}
        >
          {description}
        </p>
      )}

      {/* Call to Action */}
      {actionNode ? (
        actionNode
      ) : actionLabel && actionTo ? (
        <Link to={actionTo} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
          {actionLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="btn btn-primary btn-sm">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );

  if (inCard) {
    return <div className="card">{content}</div>;
  }

  return content;
};

export default EmptyState;

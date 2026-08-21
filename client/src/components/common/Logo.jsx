import { Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const SIZES = {
  sm: {
    box: '1.75rem',      // 28px
    boxRadius: 'var(--radius-md, 0.5rem)',
    iconSize: 16,
    textSize: '1.125rem', // 18px
    gap: '0.5rem',
  },
  md: {
    box: '2.25rem',      // 36px
    boxRadius: 'var(--radius-lg, 0.75rem)',
    iconSize: 20,
    textSize: '1.25rem',  // 20px
    gap: '0.625rem',
  },
  lg: {
    box: '2.625rem',     // 42px
    boxRadius: 'var(--radius-xl, 1rem)',
    iconSize: 24,
    textSize: '1.5rem',   // 24px
    gap: '0.75rem',
  },
};

/**
 * Reusable brand Logo component.
 *
 * @param {('sm'|'md'|'lg')} [size='md'] - Sizing preset
 * @param {boolean} [clickable=true] - If true, wraps logo in a Link to / or /dashboard
 * @param {string} [to='/'] - Link destination
 * @param {string} [subtitle] - Optional subtitle under the wordmark
 * @param {string} [className] - Optional extra class name
 */
const Logo = ({
  size = 'md',
  clickable = false,
  to = '/',
  subtitle,
  className = '',
  style = {},
}) => {
  const config = SIZES[size] || SIZES.md;

  const content = (
    <div
      className={`skillsync-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: config.gap,
        userSelect: 'none',
        textDecoration: 'none',
        ...style,
      }}
    >
      {/* Icon Mark: Rounded container filled with primary blue */}
      <div
        style={{
          width: config.box,
          height: config.box,
          borderRadius: config.boxRadius,
          backgroundColor: 'var(--color-primary, #2563EB)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
        }}
      >
        <Layers size={config.iconSize} strokeWidth={2.2} />
      </div>

      {/* Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          style={{
            fontSize: config.textSize,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--color-heading, #111827)',
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
          }}
        >
          skillsync
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: '0.6875rem',
              color: 'var(--color-muted, #9CA3AF)',
              fontWeight: 400,
              marginTop: '0.25rem',
              letterSpacing: 'normal',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link to={to} style={{ textDecoration: 'none', display: 'inline-flex' }}>
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;

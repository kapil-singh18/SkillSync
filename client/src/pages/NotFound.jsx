import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';

const NotFound = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '1.5rem',
        background: 'var(--color-page-bg, #F9FAFB)',
        fontFamily: 'var(--font-sans, Inter, sans-serif)',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '3rem 2rem',
          textAlign: 'center',
          borderRadius: 'var(--radius-2xl, 1.25rem)',
          background: '#FFFFFF',
          border: '1px solid var(--color-border, #E5E7EB)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            background: 'var(--color-primary-light, #EFF6FF)',
            color: 'var(--color-primary, #2563EB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <Compass size={32} />
        </div>

        <div
          style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            color: 'var(--color-primary, #2563EB)',
            lineHeight: 1,
            marginBottom: '0.5rem',
            letterSpacing: '-0.03em',
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--color-heading, #111827)',
            marginBottom: '0.75rem',
          }}
        >
          Page Not Found
        </h1>

        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--color-body, #6B7280)',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          The page you are looking for doesn't exist, was removed, or is temporarily unavailable.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: 'var(--radius-xl, 1rem)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Home size={15} />
            {isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: 'var(--radius-xl, 1rem)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--color-border, #E5E7EB)',
              background: 'var(--color-card, #FFFFFF)',
            }}
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

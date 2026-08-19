import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
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
              maxWidth: '480px',
              width: '100%',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-2xl, 1.25rem)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              background: '#FFFFFF',
              border: '1px solid var(--color-border, #E5E7EB)',
            }}
          >
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h1
              style={{
                fontSize: '1.375rem',
                fontWeight: 700,
                color: 'var(--color-heading, #111827)',
                marginBottom: '0.5rem',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-body, #6B7280)',
                lineHeight: 1.6,
                marginBottom: '1.75rem',
              }}
            >
              An unexpected error occurred while rendering this view. You can reload the page or navigate back to the dashboard.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  borderRadius: 'var(--radius-xl, 1rem)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={15} />
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
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
                <Home size={15} />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

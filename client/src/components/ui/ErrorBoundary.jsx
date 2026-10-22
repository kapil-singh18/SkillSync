import { Component } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, send to an error tracking service
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
          <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 flex items-center justify-center">
              <AlertTriangle
                size={28}
                className="text-[var(--color-danger)]"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
                Something went wrong
              </h1>
              <p className="text-sm text-[var(--color-muted-foreground)] max-w-sm mx-auto">
                An unexpected error occurred. Our team has been notified. Please
                reload the page to continue.
              </p>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 w-full overflow-auto text-[var(--color-danger)] max-h-40">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-medium bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              <RefreshCcw size={15} />
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

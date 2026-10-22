import { Link } from 'react-router-dom';
import { Frown } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
    <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center">
        <Frown
          size={36}
          className="text-[var(--color-muted-foreground)]"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-6xl font-bold text-[var(--color-accent)]">404</p>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
          Page not found
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link to="/">
        <Button variant="primary" size="md">
          Back to home
        </Button>
      </Link>
    </div>
  </div>
);

export default NotFound;

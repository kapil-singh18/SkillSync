import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';

const Landing = () => (
  <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
    {/* Nav */}
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
      <Logo size="md" />
      <div className="flex items-center gap-3">
        <Link to="/login">
          <Button variant="ghost" size="sm">Log in</Button>
        </Link>
        <Link to="/register">
          <Button variant="primary" size="sm">Get started</Button>
        </Link>
      </div>
    </header>

    {/* Hero */}
    <main
      id="main-content"
      role="main"
      className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 gap-8"
    >
      <div className="flex flex-col gap-4 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-semibold text-[var(--color-foreground)] leading-tight">
          Learn together.{' '}
          <span className="text-[var(--color-accent)]">Grow faster.</span>
        </h1>
        <p className="text-base text-[var(--color-muted-foreground)] max-w-xl mx-auto">
          SkillSync connects peers for collaborative learning, project building, and
          mentorship — all in one streamlined platform.
        </p>
      </div>
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <Link to="/register">
          <Button variant="primary" size="lg">Start for free</Button>
        </Link>
        <Link to="/login">
          <Button variant="outline" size="lg">Sign in</Button>
        </Link>
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        No credit card required · Free during beta
      </p>
    </main>
  </div>
);

export default Landing;

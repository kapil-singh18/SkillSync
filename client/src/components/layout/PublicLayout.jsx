import { Outlet } from 'react-router-dom';
import Logo from '../ui/Logo';

const PublicLayout = () => (
  <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
    {/* Minimal nav */}
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
      <Logo size="md" />
    </header>

    <main
      id="main-content"
      role="main"
      className="flex-1 flex items-center justify-center px-4 py-12"
    >
      <Outlet />
    </main>
  </div>
);

export default PublicLayout;

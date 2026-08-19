import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  User,
  MessageSquare,
  FolderKanban,
  Map,
  Users,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discover',  icon: Compass,         label: 'Discover' },
  { to: '/profile',   icon: User,             label: 'Profile' },
  { to: '/chat',      icon: MessageSquare,    label: 'Chat' },
  { to: '/projects',  icon: FolderKanban,     label: 'Projects' },
  // ── Coming in later phases ──────────────────────────────────
  { to: '/roadmap',   icon: Map,              label: 'Roadmap',    disabled: true },
  { to: '/community', icon: Users,            label: 'Community',  disabled: true },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="sidebar-logo" style={{ gap: '0.5rem', padding: '1.25rem 1.25rem 1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <img
            src="/skillsync.svg"
            alt="SkillSync"
            style={{ height: '32px', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', lineHeight: 1.3, margin: 0 }}>
            Learn together. Grow faster.
          </p>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label, disabled }) =>
          disabled ? (
            <span
              key={to}
              className="sidebar-nav-item disabled"
              title={`${label} — coming soon`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </span>
          ) : (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          )
        )}
      </nav>

      {/* ── Bottom label ─────────────────────────────────────── */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--color-border-sub)',
          fontSize: '0.75rem',
          color: 'var(--color-muted)',
        }}
      >
        Phase 3 — MVP
      </div>
    </aside>
  );
};

export default Sidebar;

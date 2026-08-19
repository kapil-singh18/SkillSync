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

// Nav items that exist in Phase 2 — set disabled:true for items coming in later phases
const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discover',  icon: Compass,         label: 'Discover' },
  { to: '/profile',   icon: User,             label: 'Profile' },
  // ── Coming in later phases ──────────────────────────────────
  { to: '/chat',      icon: MessageSquare,    label: 'Chat',       disabled: true },
  { to: '/projects',  icon: FolderKanban,     label: 'Projects',   disabled: true },
  { to: '/roadmap',   icon: Map,              label: 'Roadmap',    disabled: true },
  { to: '/community', icon: Users,            label: 'Community',  disabled: true },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="sidebar-logo">
        <img src="/logo.png" alt="SkillSync" style={{ height: '28px', width: 'auto' }} />
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
        Phase 2 — MVP
      </div>
    </aside>
  );
};

export default Sidebar;

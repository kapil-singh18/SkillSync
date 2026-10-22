import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  MessageSquare,
  FolderKanban,
  Map,
  ClipboardCheck,
  Users,
  BookOpen,
  Trophy,
  Briefcase,
  CalendarClock,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import Logo from '../ui/Logo';
import useSidebarStore from '../../store/sidebarStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/roadmaps', label: 'Roadmaps', icon: Map },
  { to: '/assessments', label: 'Assessments', icon: ClipboardCheck },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/resources', label: 'Resources', icon: BookOpen },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/career', label: 'Career', icon: Briefcase },
  { to: '/sessions', label: 'Sessions', icon: CalendarClock },
  { to: '/profile', label: 'Profile', icon: UserCircle },
];

const NavItem = ({ item, collapsed }) => {
  const { icon: Icon, to, label } = item;

  return (
    <li>
      <NavLink
        to={to}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          [
            'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
            'transition-colors duration-150 outline-none group min-h-[40px]',
            'focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1',
            'focus-visible:ring-offset-[var(--color-background)]',
            isActive
              ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)]',
            collapsed ? 'justify-center' : '',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              size={18}
              className={[
                'flex-shrink-0 transition-colors duration-150',
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)]',
              ].join(' ')}
              aria-hidden="true"
              strokeWidth={isActive ? 2.5 : 2}
            />
            {!collapsed && <span>{label}</span>}
          </>
        )}
      </NavLink>
    </li>
  );
};

const SidebarContent = ({ collapsed, onMobileClose }) => {
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={[
          'flex items-center justify-between px-3 py-4 border-b border-[var(--color-border)] flex-shrink-0',
          collapsed ? 'flex-col gap-2' : '',
        ].join(' ')}
      >
        {!collapsed && <Logo size="md" />}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold">
            S
          </div>
        )}

        {/* Mobile close / Desktop collapse toggle */}
        <div className="flex items-center">
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              aria-label="Close sidebar"
              className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] lg:hidden"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] hidden lg:flex"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5" role="list">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </ul>
      </nav>
    </div>
  );
};

const Sidebar = () => {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={[
          'hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0',
          'bg-[var(--color-surface)] border-r border-[var(--color-border)]',
          'transition-[width] duration-200 ease-in-out overflow-hidden',
          collapsed ? 'w-[72px]' : 'w-64',
        ].join(' ')}
        aria-label="Sidebar navigation"
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={[
              'absolute inset-y-0 left-0 flex flex-col w-64 flex-shrink-0',
              'bg-[var(--color-surface)] border-r border-[var(--color-border)]',
              'animate-[slideInLeft_200ms_ease]',
            ].join(' ')}
            aria-label="Sidebar navigation"
          >
            <SidebarContent
              collapsed={false}
              onMobileClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default Sidebar;

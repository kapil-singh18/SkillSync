import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Sun, Moon, LogOut, Settings, User } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Dropdown from '../ui/Dropdown';
import useSidebarStore from '../../store/sidebarStore';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import useToastStore from '../../store/toastStore';

const roleBadgeVariant = { student: 'accent', mentor: 'success', admin: 'warning' };

const TopBar = () => {
  const navigate = useNavigate();
  const toggleMobileOpen = useSidebarStore((s) => s.toggleMobileOpen);
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const handleLogout = () => {
    logout();
    addToast({ type: 'info', message: 'You have been signed out.' });
    navigate('/login', { replace: true });
  };

  const userMenuItems = [
    {
      label: 'Profile',
      icon: <User size={14} />,
      onClick: () => navigate('/profile'),
    },
    {
      label: 'Settings',
      icon: <Settings size={14} />,
      onClick: () => {},
    },
    { type: 'separator' },
    {
      label: 'Log out',
      icon: <LogOut size={14} />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header
      className="h-14 flex items-center gap-3 px-4 sticky top-0 z-30 flex-shrink-0 bg-[var(--color-background)] border-b border-[var(--color-border)]"
      role="banner"
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={toggleMobileOpen}
        aria-label="Open sidebar menu"
        className="p-2 -ml-1 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center"
      >
        <Menu size={20} />
      </button>

      {/* Search bar */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search…"
            aria-label="Search"
            className="h-9 w-full rounded-lg pl-9 pr-3 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-colors duration-150"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-1">
        {/* Notification bell */}
        <button
          aria-label="Notifications"
          className="p-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <Bell size={18} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          className="p-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User avatar dropdown */}
        <Dropdown
          align="right"
          trigger={
            <button
              aria-label="User menu"
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-[var(--color-surface-raised)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] min-h-[40px]"
            >
              <Avatar size="sm" name={user?.name || 'User'} src={user?.avatarUrl || ''} />
              {user && (
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-medium text-[var(--color-foreground)] max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <Badge variant={roleBadgeVariant[user.role] || 'neutral'} className="text-[10px] px-1.5 py-0">
                    {user.role}
                  </Badge>
                </div>
              )}
            </button>
          }
          items={userMenuItems}
        />
      </div>
    </header>
  );
};

export default TopBar;

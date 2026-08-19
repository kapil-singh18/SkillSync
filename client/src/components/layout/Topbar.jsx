import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';

/** Returns up to 2 uppercase initials from a name string */
const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

const Topbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="topbar">
      {/* ── Search (placeholder) ─────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--color-page-bg)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.5rem 0.875rem',
          flex: '1',
          maxWidth: '360px',
        }}
      >
        <Search size={15} color="var(--color-muted)" />
        <input
          id="topbar-search"
          type="text"
          placeholder="Search…"
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '0.875rem',
            color: 'var(--color-heading)',
            width: '100%',
          }}
          readOnly
        />
      </div>

      {/* ── Right controls ───────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Notification bell (static) */}
        <button
          id="topbar-notifications"
          className="btn btn-ghost btn-icon"
          aria-label="Notifications"
          title="Notifications — coming soon"
        >
          <Bell size={18} />
        </button>

        {/* User dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            id="topbar-user-menu"
            onClick={() => setDropdownOpen((o) => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.625rem',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--color-border)',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-page-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span className="avatar avatar-sm">{getInitials(user?.name)}</span>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-heading)',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name}
            </span>
            <ChevronDown size={14} color="var(--color-muted)" />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                right: 0,
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                minWidth: '180px',
                overflow: 'hidden',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: '0.875rem 1rem',
                  borderBottom: '1px solid var(--color-border-sub)',
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-heading)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.125rem' }}>
                  {user?.email}
                </div>
              </div>
              <div style={{ padding: '0.375rem' }}>
                <button
                  id="topbar-profile-link"
                  onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    width: '100%', padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
                    color: 'var(--color-heading)', background: 'transparent',
                    cursor: 'pointer', border: 'none', transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-page-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <User size={15} /> Profile
                </button>
                <button
                  id="topbar-logout-btn"
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    width: '100%', padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
                    color: 'var(--color-error)', background: 'transparent',
                    cursor: 'pointer', border: 'none', transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={15} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;

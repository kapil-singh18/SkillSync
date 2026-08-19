import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      {/* ─── Top Bar ─────────────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: '1px solid var(--color-neutral-800)',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--color-primary-400)',
            letterSpacing: '-0.02em',
          }}
        >
          SkillSync
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && (
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-neutral-400)',
              }}
            >
              {user.email}
            </span>
          )}
          <button
            id="dashboard-logout-btn"
            onClick={handleLogout}
            className="btn-outline"
            style={{ padding: '0.375rem 1rem', fontSize: '0.8125rem' }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main style={{ padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--color-neutral-50)',
            marginBottom: '0.5rem',
          }}
        >
          Welcome, {user?.name ?? 'there'} 👋
        </h1>
        <p style={{ color: 'var(--color-neutral-400)', fontSize: '1rem' }}>
          Your dashboard is ready. Features will be added in upcoming phases.
        </p>

        {/* Placeholder widget grid */}
        <div
          style={{
            marginTop: '2.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {['Skill Matches', 'Sessions', 'Points & Badges', 'My Projects'].map(
            (label) => (
              <div
                key={label}
                className="card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-neutral-500)',
                  }}
                >
                  Coming soon
                </span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--color-neutral-300)',
                  }}
                >
                  {label}
                </span>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

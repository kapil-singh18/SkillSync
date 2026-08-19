import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Nav ─────────────────────────────────────────────────────────── */}
      <nav
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
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-primary-400)',
            letterSpacing: '-0.02em',
          }}
        >
          SkillSync
        </span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/login" className="btn-outline" id="nav-login-btn">
            Log in
          </Link>
          <Link to="/register" className="btn-primary" id="nav-register-btn">
            Get started
          </Link>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '4rem 1.5rem',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '0.25rem 0.875rem',
            background: 'var(--color-primary-900)',
            color: 'var(--color-primary-300)',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
          }}
        >
          AI-Powered Peer Learning
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.25rem, 6vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: '700px',
            color: 'var(--color-neutral-50)',
            letterSpacing: '-0.03em',
          }}
        >
          Learn faster by teaching.{' '}
          <span style={{ color: 'var(--color-primary-400)' }}>
            Teach better by learning.
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--color-neutral-400)',
            maxWidth: '520px',
            lineHeight: 1.7,
          }}
        >
          SkillSync intelligently matches students and mentors based on
          complementary skills, goals, and availability — enabling structured,
          meaningful peer knowledge exchange.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/register" className="btn-primary" id="hero-register-btn">
            Create free account
          </Link>
          <Link to="/login" className="btn-outline" id="hero-login-btn">
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Home;

import { Link } from 'react-router-dom';
import { Compass, Users, Zap } from 'lucide-react';

const FeaturePill = ({ icon: Icon, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
    background: 'white', border: '1px solid var(--color-border)', borderRadius: '9999px',
    fontSize: '0.875rem', color: 'var(--color-body)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
    <Icon size={15} color="var(--color-primary)" />
    {text}
  </div>
);

const Home = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-page-bg)' }}>
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav style={{
        background: 'white', borderBottom: '1px solid var(--color-border)',
        padding: '0 2rem', height: '64px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <img src="/skillsync.svg" alt="SkillSync" style={{ height: '32px', width: 'auto', objectFit: 'contain', display: 'block' }} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/login" className="btn btn-outline btn-sm" id="nav-login-btn">Log in</Link>
          <Link to="/register" className="btn btn-primary btn-sm" id="nav-register-btn">Get started</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '5rem 1.5rem 4rem', gap: '1.5rem' }}>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <FeaturePill icon={Zap} text="AI-powered matching" />
          <FeaturePill icon={Users} text="Peer learning" />
          <FeaturePill icon={Compass} text="Skill discovery" />
        </div>

        <h1 style={{
          fontSize: 'clamp(2.25rem, 6vw, 3.75rem)',
          fontWeight: 800, lineHeight: 1.1, maxWidth: '680px',
          color: 'var(--color-heading)', letterSpacing: '-0.03em',
        }}>
          Learn faster by teaching.{' '}
          <span style={{ color: 'var(--color-primary)' }}>Teach better by learning.</span>
        </h1>

        <p style={{ fontSize: '1.125rem', color: 'var(--color-muted)', maxWidth: '500px', lineHeight: 1.7 }}>
          SkillSync intelligently connects students and mentors based on
          complementary skills, goals, and availability.
        </p>

        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          <Link to="/register" className="btn btn-primary btn-lg" id="hero-register-btn">
            Create free account
          </Link>
          <Link to="/login" className="btn btn-outline btn-lg" id="hero-login-btn">
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Home;

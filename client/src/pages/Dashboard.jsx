import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, AlertCircle, ArrowRight, Users, Star, Map } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import useAuthStore from '../store/authStore';
import useUserStore from '../store/userStore';

/** Returns true if the profile lacks skills or interests */
const isIncomplete = (profile) =>
  !profile ||
  (profile.skills || []).length === 0 ||
  (profile.interests || []).length === 0;

const StatCard = ({ icon: Icon, label, value, color = 'var(--color-primary)' }) => (
  <div className="card card-padded" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div
      style={{
        width: '2.75rem', height: '2.75rem', borderRadius: 'var(--radius-xl)',
        background: 'var(--color-primary-light)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-heading)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>{label}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuthStore();
  const { profile, fetchProfile, isLoading } = useUserStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const incomplete = isIncomplete(profile);

  return (
    <DashboardLayout>
      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-heading)' }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--color-muted)', marginTop: '0.25rem', fontSize: '0.9375rem' }}>
          Here's what's happening with your learning journey.
        </p>
      </div>

      {/* ── Profile incomplete prompt ────────────────────────── */}
      {!isLoading && incomplete && (
        <div
          className="card"
          style={{
            marginBottom: '1.75rem',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            borderLeft: '4px solid var(--color-primary)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} color="var(--color-primary)" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-heading)', fontSize: '0.9375rem' }}>
                Complete your profile to get better matches
              </div>
              <div style={{ color: 'var(--color-muted)', fontSize: '0.8125rem', marginTop: '0.125rem' }}>
                Add your skills and interests so the AI can find you ideal study partners.
              </div>
            </div>
          </div>
          <Link to="/profile" className="btn btn-primary btn-sm" id="dashboard-complete-profile-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
            Complete profile <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard icon={Star} label="Points earned" value={profile?.points ?? 0} />
        <StatCard icon={Users} label="Connections" value={0} />
        <StatCard icon={Compass} label="New matches" value="—" />
      </div>

      {/* ── Quick actions ────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)', marginBottom: '1rem' }}>
          Quick actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <Link
            to="/discover"
            id="dashboard-discover-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem', borderRadius: 'var(--radius-xl)',
              background: 'var(--color-primary-light)', textDecoration: 'none',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.96)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            <Compass size={20} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
              Discover peers
            </span>
          </Link>
          <Link
            to="/roadmap"
            id="dashboard-roadmap-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem', borderRadius: 'var(--radius-xl)',
              background: 'var(--color-primary-light)', textDecoration: 'none',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.96)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            <Map size={20} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
              Learning Roadmaps
            </span>
          </Link>
          <Link
            to="/assessments"
            id="dashboard-assessments-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem', borderRadius: 'var(--radius-xl)',
              background: 'var(--color-border-sub)', textDecoration: 'none',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.97)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            <Star size={20} color="#F59E0B" />
            <span style={{ fontWeight: 600, color: 'var(--color-heading)', fontSize: '0.9rem' }}>
              Skill Quizzes
            </span>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

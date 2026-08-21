import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, AlertCircle, ArrowRight, Users, Star, Map, Trophy, FileText, Award } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/common/PageHeader';
import useAuthStore from '../store/authStore';
import useUserStore from '../store/userStore';

/** Returns true if the profile lacks skills or interests */
const isIncomplete = (profile) =>
  !profile ||
  (profile.skills || []).length === 0 ||
  (profile.interests || []).length === 0;

const StatCard = ({ icon: Icon, label, value, color = 'var(--color-primary)' }) => (
  <div className="card card-padded" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
    <div
      style={{
        width: '3rem',
        height: '3rem',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-primary-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={22} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-heading)', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
        {label}
      </div>
    </div>
  </div>
);

const ActionCard = ({ to, id, icon: Icon, title, subtitle, bg = 'var(--color-primary-light)', iconColor = 'var(--color-primary)' }) => (
  <Link
    to={to}
    id={id}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1.25rem',
      borderRadius: 'var(--radius-xl)',
      background: bg,
      textDecoration: 'none',
      transition: 'filter 0.15s, transform 0.1s',
      border: '1px solid rgba(0,0,0,0.03)',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.96)')}
    onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
  >
    <div
      style={{
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <Icon size={20} color={iconColor} />
    </div>
    <div>
      <div style={{ fontWeight: 600, color: 'var(--color-heading)', fontSize: '0.9375rem' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.125rem' }}>
          {subtitle}
        </div>
      )}
    </div>
  </Link>
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
      {/* ── Page Header ──────────────────────────────────────── */}
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Learner'} 👋`}
        subtitle="Here's what's happening with your learning journey."
      />

      {/* ── Profile incomplete prompt ────────────────────────── */}
      {!isLoading && incomplete && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            borderLeft: '4px solid var(--color-primary)',
            borderRadius: 'var(--radius-xl)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '50%',
                background: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-heading)', fontSize: '0.9375rem' }}>
                Complete your profile to get better matches
              </div>
              <div style={{ color: 'var(--color-muted)', fontSize: '0.8125rem', marginTop: '0.125rem' }}>
                Add your skills and interests so the AI can find you ideal study partners.
              </div>
            </div>
          </div>
          <Link
            to="/profile"
            className="btn btn-primary btn-sm"
            id="dashboard-complete-profile-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}
          >
            Complete profile <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard icon={Star} label="Points earned" value={profile?.points ?? 0} color="#F59E0B" />
        <StatCard icon={Users} label="Verified Skills" value={profile?.skills?.length ?? 0} color="var(--color-primary)" />
        <StatCard icon={Compass} label="Badges Unlocked" value={profile?.badges?.length ?? 0} color="#10B981" />
      </div>

      {/* ── Quick actions ────────────────────────────────────── */}
      <div className="card card-padded">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)', marginBottom: '1.25rem' }}>
          Quick Actions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '1rem',
          }}
        >
          <ActionCard
            to="/discover"
            id="dashboard-discover-btn"
            icon={Compass}
            title="Discover Peers"
            subtitle="Find study partners & mentors"
            bg="var(--color-primary-light)"
            iconColor="var(--color-primary)"
          />
          <ActionCard
            to="/roadmap"
            id="dashboard-roadmap-btn"
            icon={Map}
            title="Learning Roadmaps"
            subtitle="AI-tailored learning paths"
            bg="#EFF6FF"
            iconColor="#2563EB"
          />
          <ActionCard
            to="/assessments"
            id="dashboard-assessments-btn"
            icon={Award}
            title="Skill Quizzes"
            subtitle="Test and level up skills"
            bg="#FEF3C7"
            iconColor="#D97706"
          />
          <ActionCard
            to="/community"
            id="dashboard-community-btn"
            icon={Users}
            title="Community Feed"
            subtitle="Discussions & Q&A"
            bg="#F0FDF4"
            iconColor="#15803D"
          />
          <ActionCard
            to="/leaderboard"
            id="dashboard-leaderboard-btn"
            icon={Trophy}
            title="Leaderboard"
            subtitle="Ranks and badge catalog"
            bg="#FEF3C7"
            iconColor="#D97706"
          />
          <ActionCard
            to="/resume"
            id="dashboard-resume-btn"
            icon={FileText}
            title="Resume AI"
            subtitle="Skills & project analysis"
            bg="#F3F4F6"
            iconColor="#4B5563"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

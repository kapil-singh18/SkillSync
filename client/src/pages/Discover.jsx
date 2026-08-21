import { useEffect } from 'react';
import { UserCheck, UserX, Compass, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import useMatchStore from '../store/matchStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

const scoreColor = (score) => {
  if (score >= 70) return '#10B981';
  if (score >= 40) return '#F59E0B';
  return '#6B7280';
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div className="skeleton" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div className="skeleton" style={{ height: '1rem', width: '60%' }} />
        <div className="skeleton" style={{ height: '0.75rem', width: '35%' }} />
      </div>
      <div className="skeleton" style={{ width: '3rem', height: '3rem', borderRadius: '50%' }} />
    </div>
    <div className="skeleton" style={{ height: '0.75rem', width: '90%' }} />
    <div className="skeleton" style={{ height: '0.75rem', width: '75%' }} />
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {[1, 2, 3].map((n) => (
        <div key={n} className="skeleton" style={{ height: '1.5rem', width: '4rem', borderRadius: '9999px' }} />
      ))}
    </div>
    <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.5rem' }}>
      <div className="skeleton" style={{ height: '2.25rem', flex: 1, borderRadius: 'var(--radius-lg)' }} />
      <div className="skeleton" style={{ height: '2.25rem', flex: 1, borderRadius: 'var(--radius-lg)' }} />
    </div>
  </div>
);

// ─── Match Card ───────────────────────────────────────────────────────────────
const MatchCard = ({ match, onConnect, onDismiss }) => {
  const { user, matchScore, matchReason } = match;
  const color = scoreColor(matchScore);

  return (
    <div
      className="card card-padded"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'box-shadow 0.2s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.transform = '';
      }}
    >
      {/* Header row: avatar + name + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="avatar avatar-lg">{getInitials(user.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--color-heading)', fontSize: '1rem' }}>{user.name}</div>
          <span className={user.role === 'mentor' ? 'badge-mentor' : 'badge-student'} style={{ marginTop: '0.25rem', display: 'inline-block' }}>
            {user.role}
          </span>
        </div>
        {/* Score ring */}
        <div
          style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: '50%',
            border: `2.5px solid ${color}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: `${color}12`,
          }}
        >
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color, lineHeight: 1 }}>{matchScore}</span>
          <span style={{ fontSize: '0.6rem', color, opacity: 0.8 }}>%</span>
        </div>
      </div>

      {/* AI match reason */}
      {matchReason && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-body)', lineHeight: 1.5, margin: 0 }}>
          {matchReason}
        </p>
      )}

      {/* Bio snippet */}
      {user.bio && (
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-muted)',
            lineHeight: 1.5,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {user.bio}
        </p>
      )}

      {/* Shared skills pills */}
      {(user.skills || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {user.skills.slice(0, 4).map((s, i) => (
            <span key={i} className="chip chip-gray" style={{ fontSize: '0.75rem' }}>
              {s.name}
            </span>
          ))}
          {user.skills.length > 4 && (
            <span className="chip chip-gray" style={{ fontSize: '0.75rem' }}>
              +{user.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.625rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
        <button
          id={`discover-connect-${user._id}`}
          type="button"
          onClick={() => onConnect(user._id)}
          className="btn btn-primary btn-sm"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <UserCheck size={15} /> Connect
        </button>
        <button
          id={`discover-dismiss-${user._id}`}
          type="button"
          onClick={() => onDismiss(user._id)}
          className="btn btn-outline btn-sm"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <UserX size={15} /> Dismiss
        </button>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const Discover = () => {
  const { matches, isLoading, error, fetchDiscover, connect, dismiss } = useMatchStore();

  useEffect(() => {
    fetchDiscover();
  }, [fetchDiscover]);

  return (
    <DashboardLayout>
      {/* ── Page Header ──────────────────────────────────────── */}
      <PageHeader
        title="Discover"
        subtitle="AI-ranked peers and mentors matched to your skills and learning goals."
        action={
          <button
            id="discover-refresh-btn"
            type="button"
            onClick={fetchDiscover}
            className="btn btn-outline btn-sm"
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />

      {/* ── Error ────────────────────────────────────────────── */}
      {error && (
        <div className="toast toast-error" style={{ marginBottom: '1.5rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : matches.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={Compass}
              title="No matches found"
              description="You've reviewed everyone for now. Add more skills and interests to your profile to unlock new peer recommendations."
              actionLabel="Update Profile"
              actionTo="/profile"
            />
          </div>
        ) : (
          matches.map((match) => (
            <MatchCard
              key={match.user._id}
              match={match}
              onConnect={connect}
              onDismiss={dismiss}
            />
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default Discover;

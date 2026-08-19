import { useEffect } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Award,
  Loader2,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import useGamificationStore from '../store/gamificationStore';
import useAuthStore from '../store/authStore';

const RANK_STYLES = [
  { bg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', icon: Crown, color: '#D97706', border: '#F59E0B' },
  { bg: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)', icon: Medal, color: '#6B7280', border: '#9CA3AF' },
  { bg: 'linear-gradient(135deg, #FED7AA, #FDBA74)', icon: Medal, color: '#C2410C', border: '#EA580C' },
];

const Leaderboard = () => {
  const { user } = useAuthStore();
  const { leaderboard, myStats, allBadges, isLoading, fetchLeaderboard, fetchMyStats, fetchAllBadges } =
    useGamificationStore();

  useEffect(() => {
    fetchLeaderboard();
    fetchMyStats();
    fetchAllBadges();
  }, [fetchLeaderboard, fetchMyStats, fetchAllBadges]);

  return (
    <DashboardLayout>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-heading)' }}>
          Leaderboard &amp; Badges
        </h1>
        <p style={{ color: 'var(--color-muted)', marginTop: '0.25rem', fontSize: '0.9375rem' }}>
          Earn points, unlock badges, and climb the ranks.
        </p>
      </div>

      {/* ── My Stats Card ───────────────────────────────────── */}
      {myStats && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, var(--color-primary-light), #DBEAFE)',
            borderLeft: '4px solid var(--color-primary)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                Your Rank
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-heading)' }}>
                #{myStats.rank}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                Total Points
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-heading)' }}>
                {myStats.points}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                Badges Earned
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-heading)' }}>
                {myStats.earnedBadges?.length || 0}/{myStats.totalBadges || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* ── Leaderboard ─────────────────────────────────────── */}
        <div className="card" style={{ padding: '1.5rem', minWidth: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={18} color="var(--color-primary)" /> Top Learners
          </h2>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
              <Loader2 size={20} className="spin" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {leaderboard.map((u, i) => {
                const rankStyle = RANK_STYLES[i] || null;
                const isMe = u._id === user?._id;
                const RankIcon = rankStyle?.icon || null;
                return (
                  <div
                    key={u._id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem', borderRadius: 'var(--radius-xl)',
                      background: rankStyle?.bg || (isMe ? 'var(--color-primary-light)' : 'var(--color-page-bg)'),
                      border: isMe ? '1px solid var(--color-primary)' : rankStyle ? `1px solid ${rankStyle.border}` : '1px solid transparent',
                      transition: 'transform 0.1s',
                    }}
                  >
                    {/* Rank */}
                    <div
                      style={{
                        width: '2rem', height: '2rem', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0,
                        background: rankStyle ? 'rgba(255,255,255,0.7)' : 'var(--color-card)',
                        color: rankStyle?.color || 'var(--color-muted)',
                      }}
                    >
                      {RankIcon ? <RankIcon size={16} /> : i + 1}
                    </div>

                    {/* Avatar */}
                    <div
                      style={{
                        width: '2rem', height: '2rem', borderRadius: '50%',
                        background: 'var(--color-primary)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: '0.75rem', flexShrink: 0,
                      }}
                    >
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>

                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, fontSize: '0.875rem',
                        color: 'var(--color-heading)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {u.name} {isMe && <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary)' }}>(you)</span>}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-muted)' }}>
                        {u.badges?.length || 0} badge{(u.badges?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Points */}
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-heading)', flexShrink: 0 }}>
                      {u.points || 0}
                      <span style={{ fontSize: '0.6875rem', fontWeight: 400, color: 'var(--color-muted)', marginLeft: '0.25rem' }}>pts</span>
                    </div>
                  </div>
                );
              })}

              {leaderboard.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '1rem', fontSize: '0.875rem' }}>
                  No data yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Badges ──────────────────────────────────────────── */}
        <div className="card" style={{ padding: '1.5rem', minWidth: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--color-primary)" /> All Badges
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {allBadges.map((badge) => {
              const earned = myStats?.earnedBadges?.some((b) => b._id === badge._id);
              return (
                <div
                  key={badge._id}
                  title={badge.criteria || badge.description}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-xl)',
                    border: `1px solid ${earned ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: earned ? 'var(--color-primary-light)' : 'var(--color-page-bg)',
                    textAlign: 'center',
                    opacity: earned ? 1 : 0.55,
                    transition: 'opacity 0.15s, box-shadow 0.15s',
                    cursor: 'default',
                  }}
                >
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>
                    {badge.iconUrl || '🏅'}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-heading)', marginBottom: '0.125rem' }}>
                    {badge.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-muted)', lineHeight: 1.3 }}>
                    {badge.description}
                  </div>
                  {earned && (
                    <div style={{ marginTop: '0.375rem', fontSize: '0.625rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                      ✓ EARNED
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {allBadges.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '1rem', fontSize: '0.875rem' }}>
              No badges configured. Run the seed script to add badges.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;

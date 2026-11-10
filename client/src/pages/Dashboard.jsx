import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, ArrowRight } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Skeleton from '../components/ui/Skeleton';
import useAuthStore from '../store/authStore';
import useProfileStore from '../store/profileStore';
import useMatchStore from '../store/matchStore';
import useConnectionStore from '../store/connectionStore';

const roleBadgeVariant = { student: 'accent', mentor: 'success', admin: 'warning' };

const Dashboard = () => {
  const user = useAuthStore((s) => s.user);
  const { completeness, fetchProfile } = useProfileStore();

  const peerState = useMatchStore((s) => s.peer);
  const fetchDiscover = useMatchStore((s) => s.fetchDiscover);

  const { incoming, fetchAll } = useConnectionStore();

  useEffect(() => {
    fetchProfile();
    fetchAll();
    fetchDiscover('peer');
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's your learning hub." />

      {/* Welcome card */}
      {user && (
        <Card className="flex items-center gap-4">
          <Avatar size="lg" name={user.name} src={user.avatarUrl} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                Welcome, {user.name}
              </h2>
              <Badge variant={roleBadgeVariant[user.role] || 'neutral'}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)]">{user.email}</p>
            {user.lastLoginAt && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Last login:{' '}
                {new Date(user.lastLoginAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Profile completeness — shown only when < 100% */}
      {completeness < 100 && (
        <Card>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                Complete your profile
              </h2>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                A complete profile helps you get discovered by peers and mentors.
              </p>
            </div>
            <Badge variant={completeness >= 50 ? 'accent' : 'warning'}>{completeness}%</Badge>
          </div>
          <ProgressBar value={completeness} showPercent={false} className="mb-4" />
          <Link to="/profile">
            <Button variant="outline" size="sm">Complete profile →</Button>
          </Link>
        </Card>
      )}

      {/* Pending requests count */}
      {incoming.length > 0 && (
        <Card className="flex items-center gap-3 border-[var(--color-accent)]/30">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
            <Bell size={16} className="text-[var(--color-accent)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              {incoming.length} pending request{incoming.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Someone wants to connect with you
            </p>
          </div>
          <Link to="/discover">
            <Button variant="ghost" size="sm" aria-label="View requests">
              <ArrowRight size={14} />
            </Button>
          </Link>
        </Card>
      )}

      {/* Top peer matches widget */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-[var(--color-muted-foreground)]" />
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Top peer matches</h2>
          </div>
          <Link to="/discover">
            <Button variant="ghost" size="sm">
              View all <ArrowRight size={12} className="ml-1" />
            </Button>
          </Link>
        </div>

        {peerState.isLoading && peerState.results.length === 0 ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        ) : peerState.needsProfile ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            <Link to="/profile" className="text-[var(--color-accent)] hover:underline">Complete your profile</Link> to see peer matches.
          </p>
        ) : peerState.results.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">No peer matches yet. Check back soon!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {peerState.results.slice(0, 3).map(({ user: matchUser, score, sharedSkills }) => (
              <div key={matchUser._id} className="flex items-center gap-3">
                <Avatar src={matchUser.avatarUrl} name={matchUser.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/users/${matchUser._id}`}
                    className="text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-accent)] transition-colors truncate block"
                  >
                    {matchUser.name}
                  </Link>
                  {sharedSkills.length > 0 && (
                    <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                      Shared: {sharedSkills.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-[var(--color-accent)] flex-shrink-0">
                  {score}%
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import useAuthStore from '../store/authStore';
import useProfileStore from '../store/profileStore';

const roleBadgeVariant = { student: 'accent', mentor: 'success', admin: 'warning' };

const Dashboard = () => {
  const user = useAuthStore((s) => s.user);
  const { completeness, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
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

      <p className="text-sm text-[var(--color-muted-foreground)]">
        More dashboard widgets coming in a future module.
      </p>
    </div>
  );
};

export default Dashboard;

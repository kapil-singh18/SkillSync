import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Bell, Network, RefreshCw, MessageCircle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import MatchCard from '../components/ui/MatchCard';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import useMatchStore from '../store/matchStore';
import useConnectionStore from '../store/connectionStore';
import useAuthStore from '../store/authStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

const useDebouncedValue = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ── Match grid with skeletons ─────────────────────────────────────────────────

const MatchGrid = ({ results, isLoading, type, onConnect, onDismiss, onLoadMore, hasMore, statusByUser }) => {
  if (isLoading && results.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton.Card key={i} />)}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result) => (
          <MatchCard
            key={result.user._id}
            result={result}
            type={type}
            connectionStatus={statusByUser[String(result.user._id)]?.status || 'none'}
            onConnect={(userId, message) => onConnect(userId, type, message)}
            onDismiss={(userId) => onDismiss(userId, type)}
          />
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            isLoading={isLoading}
            disabled={isLoading}
          >
            Load more
          </Button>
        </div>
      )}
    </>
  );
};

// ── Requests tab ──────────────────────────────────────────────────────────────

const RequestsTab = () => {
  const { incoming, outgoing, accept, decline, cancel, isLoading } = useConnectionStore();

  if (isLoading && incoming.length === 0 && outgoing.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton.Card key={i} />)}
      </div>
    );
  }

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No pending requests"
        description="When you send or receive connection requests, they'll appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Incoming */}
      {incoming.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
            Incoming ({incoming.length})
          </h3>
          <div className="flex flex-col gap-3">
            {incoming.map((conn) => {
              const other = conn.requester;
              return (
                <div
                  key={conn._id}
                  className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <Avatar src={other?.avatarUrl} name={other?.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/users/${other?._id}`}
                        className="text-sm font-semibold text-[var(--color-foreground)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        {other?.name}
                      </Link>
                      <Badge variant={conn.type === 'mentorship' ? 'accent' : 'neutral'}>
                        {conn.type}
                      </Badge>
                    </div>
                    {other?.headline && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">{other.headline}</p>
                    )}
                    {conn.message && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-1.5 italic border-l-2 border-[var(--color-border)] pl-2">
                        "{conn.message}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="primary" onClick={() => accept(conn._id)}>Accept</Button>
                    <Button size="sm" variant="ghost" onClick={() => decline(conn._id)}>Decline</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Outgoing */}
      {outgoing.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
            Sent ({outgoing.length})
          </h3>
          <div className="flex flex-col gap-3">
            {outgoing.map((conn) => {
              const other = conn.recipient;
              return (
                <div
                  key={conn._id}
                  className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <Avatar src={other?.avatarUrl} name={other?.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/users/${other?._id}`}
                        className="text-sm font-semibold text-[var(--color-foreground)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        {other?.name}
                      </Link>
                      <Badge variant={conn.type === 'mentorship' ? 'accent' : 'neutral'}>
                        {conn.type}
                      </Badge>
                    </div>
                    {other?.headline && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">{other.headline}</p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => cancel(conn._id)}>Cancel</Button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

// ── My Network tab ────────────────────────────────────────────────────────────

const MyNetworkTab = () => {
  const { accepted, remove, isLoading } = useConnectionStore();
  const { user: me } = useAuthStore();
  const [confirmId, setConfirmId] = useState(null);

  if (isLoading && accepted.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton.Card key={i} />)}
      </div>
    );
  }

  if (accepted.length === 0) {
    return (
      <EmptyState
        icon={Network}
        title="No connections yet"
        description="Accept or send peer/mentorship requests to build your network."
        action={{ label: 'Discover peers', onClick: () => window.location.hash = '' }}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {accepted.map((conn) => {
          const other =
            String(conn.requester?._id || conn.requester) === String(me?._id)
              ? conn.recipient
              : conn.requester;

          return (
            <div
              key={conn._id}
              className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              <Avatar src={other?.avatarUrl} name={other?.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/users/${other?._id}`}
                    className="text-sm font-semibold text-[var(--color-foreground)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {other?.name}
                  </Link>
                  <Badge variant={conn.type === 'mentorship' ? 'accent' : 'neutral'}>
                    {conn.type}
                  </Badge>
                </div>
                {other?.headline && (
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">{other.headline}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled
                  title="Coming soon in Module 5"
                  aria-label="Message (coming soon)"
                >
                  <MessageCircle size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmId(conn._id)}
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)]"
                >
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Remove confirmation modal */}
      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Remove connection?"
        description="This person will no longer appear in your network. You can always reconnect later."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                await remove(confirmId);
                setConfirmId(null);
              }}
            >
              Remove
            </Button>
          </>
        }
      />
    </>
  );
};

// ── Main Discover page ────────────────────────────────────────────────────────

const Discover = () => {
  const [skillFilter, setSkillFilter] = useState('');
  const debouncedSkill = useDebouncedValue(skillFilter);

  const peerState = useMatchStore((s) => s.peer);
  const mentorState = useMatchStore((s) => s.mentor);
  const fetchDiscover = useMatchStore((s) => s.fetchDiscover);
  const loadMore = useMatchStore((s) => s.loadMore);
  const dismiss = useMatchStore((s) => s.dismiss);
  const removeResult = useMatchStore((s) => s.removeResult);
  const clearDismissed = useMatchStore((s) => s.clearDismissed);

  const { incoming, fetchAll, sendRequest, statusByUser } = useConnectionStore();

  const [activeTab, setActiveTab] = useState('peers');
  const activeModeRef = useRef('peer');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Fetch peers on mount and when skill filter changes
  useEffect(() => {
    fetchDiscover('peer', { skill: debouncedSkill });
  }, [debouncedSkill, fetchDiscover]);

  // Fetch mentors when switching to mentor tab
  useEffect(() => {
    if (activeTab === 'mentors') {
      fetchDiscover('mentor', { skill: debouncedSkill });
    }
  }, [activeTab, debouncedSkill, fetchDiscover]);

  useEffect(() => {
    activeModeRef.current = activeTab === 'mentors' ? 'mentor' : 'peer';
  }, [activeTab]);

  const handleConnect = useCallback(async (userId, type, message) => {
    const connType = type === 'mentor' ? 'mentorship' : 'peer';
    const result = await sendRequest({ userId, type: connType, message });
    if (result.success) {
      removeResult(userId, type);
    }
  }, [sendRequest, removeResult]);

  const handleDismiss = useCallback((userId, type) => {
    dismiss(userId, type);
  }, [dismiss]);

  const handleLoadMore = useCallback(() => {
    const type = activeModeRef.current;
    loadMore(type, { skill: debouncedSkill });
  }, [loadMore, debouncedSkill]);

  const peerHasMore = peerState.page < peerState.totalPages;
  const mentorHasMore = mentorState.page < mentorState.totalPages;

  const tabs = [
    {
      id: 'peers',
      label: 'Peers',
      icon: <Users size={14} />,
      content: (
        <div className="flex flex-col gap-4">
          {/* Skill filter */}
          <div className="max-w-xs">
            <Input
              placeholder="Filter by skill…"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              aria-label="Filter peers by skill"
            />
          </div>

          {peerState.needsProfile ? (
            <EmptyState
              icon={Users}
              title="Complete your profile first"
              description="Add at least one skill or interest so we can find the right peers for you."
              action={{ label: 'Go to profile', onClick: () => (window.location.href = '/profile') }}
            />
          ) : peerState.results.length === 0 && !peerState.isLoading ? (
            <EmptyState
              icon={Users}
              title="No peer matches found"
              description={
                skillFilter
                  ? `No peers found with "${skillFilter}". Try a different skill.`
                  : "You've dismissed everyone! Reset to see matches again."
              }
              action={
                skillFilter
                  ? { label: 'Clear filter', onClick: () => setSkillFilter('') }
                  : { label: 'Reset dismissed', onClick: () => clearDismissed('peer') }
              }
            />
          ) : (
            <MatchGrid
              results={peerState.results}
              isLoading={peerState.isLoading}
              type="peer"
              onConnect={handleConnect}
              onDismiss={handleDismiss}
              onLoadMore={handleLoadMore}
              hasMore={peerHasMore}
              statusByUser={statusByUser}
            />
          )}
        </div>
      ),
    },
    {
      id: 'mentors',
      label: 'Mentors',
      icon: <GraduationCap size={14} />,
      content: (
        <div className="flex flex-col gap-4">
          <div className="max-w-xs">
            <Input
              placeholder="Filter by skill…"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              aria-label="Filter mentors by skill"
            />
          </div>

          {mentorState.needsProfile ? (
            <EmptyState
              icon={GraduationCap}
              title="Complete your profile first"
              description="Add skills and learning goals to find the right mentors for you."
              action={{ label: 'Go to profile', onClick: () => (window.location.href = '/profile') }}
            />
          ) : mentorState.results.length === 0 && !mentorState.isLoading ? (
            <EmptyState
              icon={GraduationCap}
              title="No mentor matches found"
              description={
                skillFilter
                  ? `No mentors found with "${skillFilter}".`
                  : "No mentors match your profile right now. Check back soon!"
              }
              action={
                skillFilter ? { label: 'Clear filter', onClick: () => setSkillFilter('') } : undefined
              }
            />
          ) : (
            <MatchGrid
              results={mentorState.results}
              isLoading={mentorState.isLoading}
              type="mentor"
              onConnect={handleConnect}
              onDismiss={handleDismiss}
              onLoadMore={handleLoadMore}
              hasMore={mentorHasMore}
              statusByUser={statusByUser}
            />
          )}
        </div>
      ),
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: <Bell size={14} />,
      badge: incoming.length > 0 ? incoming.length : undefined,
      content: <RequestsTab />,
    },
    {
      id: 'network',
      label: 'My Network',
      icon: <Network size={14} />,
      content: <MyNetworkTab />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Discover"
        description="Find peers to learn with and mentors to guide you."
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const type = activeModeRef.current;
              fetchDiscover(type, { skill: debouncedSkill });
            }}
            aria-label="Refresh matches"
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
        }
      />

      <Tabs
        tabs={tabs}
        defaultTab="peers"
        onChange={(id) => setActiveTab(id)}
      />
    </div>
  );
};

export default Discover;

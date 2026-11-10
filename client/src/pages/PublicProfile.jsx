import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GitBranch, ExternalLink, Globe, GraduationCap, Star, MapPin, Calendar, MessageCircle, UserPlus, CheckCircle, Clock } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Textarea from '../components/ui/Textarea';
import useProfileStore from '../store/profileStore';
import useConnectionStore from '../store/connectionStore';
import useAuthStore from '../store/authStore';

const LEVEL_COLORS = { beginner: 'neutral', intermediate: 'accent', advanced: 'success' };
const SLOT_LABELS = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchPublicProfile, isLoading } = useProfileStore();
  const { fetchStatus, sendRequest, statusByUser } = useConnectionStore();
  const { user: me } = useAuthStore();

  const [user, setUser] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [connectModal, setConnectModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isOwnProfile = me && String(me._id) === String(id);
  const connectionInfo = statusByUser[String(id)];
  const connectionStatus = connectionInfo?.status || 'none';

  useEffect(() => {
    if (!id) return;
    fetchPublicProfile(id)
      .then(({ success, user: u }) => {
        if (success) setUser(u);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));

    if (!isOwnProfile) {
      fetchStatus(id);
    }
  }, [id]);

  const handleConnect = async () => {
    if (!user) return;
    const isMentorTarget = user.role === 'mentor';
    setIsSending(true);
    await sendRequest({
      userId: id,
      type: isMentorTarget ? 'mentorship' : 'peer',
      message: message.trim(),
    });
    setIsSending(false);
    setConnectModal(false);
  };

  if (isLoading && !user) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <Skeleton className="h-40" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="User not found"
        description="This profile doesn't exist or has been deactivated."
        action={{ label: 'Browse community', onClick: () => (window.location.href = '/discover') }}
      />
    );
  }

  if (!user) return null;

  const isMentor = user.role === 'mentor';
  const links = user.links || {};

  // Build compact availability map: day → slots
  const availMap = {};
  (user.availability || []).forEach(({ day, slot }) => {
    if (!availMap[day]) availMap[day] = [];
    availMap[day].push(slot);
  });

  // ── Connect button state ───────────────────────────────────────────────────
  const isAccepting = !isMentor || user.mentorProfile?.acceptingMentees !== false;

  const ConnectButton = () => {
    if (isOwnProfile) return null;

    if (connectionStatus === 'connected') {
      return (
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-success)]">
          <CheckCircle size={14} />
          Connected
        </div>
      );
    }

    if (connectionStatus === 'pending_sent') {
      return (
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-muted-foreground)]">
          <Clock size={14} />
          Request sent
        </div>
      );
    }

    if (connectionStatus === 'pending_received') {
      return (
        <Link to="/discover?tab=requests">
          <Button variant="outline" size="md">
            <Bell size={14} />
            Respond to request
          </Button>
        </Link>
      );
    }

    return (
      <Button
        variant="secondary"
        size="md"
        disabled={!isAccepting}
        onClick={() => { setMessage(''); setConnectModal(true); }}
        title={!isAccepting ? 'Not accepting mentees' : undefined}
      >
        <UserPlus size={14} />
        {isMentor ? 'Request mentorship' : 'Connect'}
      </Button>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={`${user.name}'s avatar`} className="w-20 h-20 rounded-full object-cover ring-2 ring-[var(--color-border)]" />
            ) : (
              <Avatar size="2xl" name={user.name} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-[var(--color-foreground)]">{user.name}</h1>
              <Badge variant={isMentor ? 'success' : 'accent'}>
                {isMentor ? <><Star size={10} className="inline mr-1" />Mentor</> : <><GraduationCap size={10} className="inline mr-1" />Student</>}
              </Badge>
            </div>
            {user.headline && (
              <p className="text-sm text-[var(--color-muted-foreground)] mb-2">{user.headline}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-muted-foreground)]">
              {user.location && (
                <span className="flex items-center gap-1"><MapPin size={11} />{user.location}</span>
              )}
              {(user.college || user.course) && (
                <span className="flex items-center gap-1">
                  <GraduationCap size={11} />
                  {[user.course, user.college].filter(Boolean).join(' · ')}
                  {user.yearOfStudy && ` (${user.yearOfStudy})`}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0 sm:ml-auto">
            <ConnectButton />

              {/* Message button — enabled once connected */}
              {connectionStatus === 'accepted' ? (
                <button
                  onClick={() => navigate(`/chat?user=${id}`)}
                  aria-label="Send message"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors w-full justify-center"
                >
                  <MessageCircle size={14} /> Message
                </button>
              ) : (
                <div className="relative group">
                  <button
                    disabled
                    aria-label="Message (connect first)"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent)] text-white opacity-40 cursor-not-allowed w-full justify-center"
                  >
                    <MessageCircle size={14} /> Message
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-xs bg-[var(--color-surface-raised)] text-[var(--color-muted-foreground)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 border border-[var(--color-border)]">
                    Connect first to message
                  </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Bio */}
      {user.bio && (
        <Card>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">About</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] whitespace-pre-line">{user.bio}</p>
        </Card>
      )}

      {/* Skills */}
      {user.skills?.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((s, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                <span className="text-sm text-[var(--color-foreground)]">{s.name}</span>
                <Badge variant={LEVEL_COLORS[s.level] || 'neutral'}>{s.level}</Badge>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Interests */}
      {user.interests?.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {user.interests.map((t, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                {t}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Learning Goals */}
      {user.learningGoals?.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Learning Goals</h2>
          <ul className="flex flex-col gap-1.5">
            {user.learningGoals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-muted-foreground)]">
                <span className="text-[var(--color-accent)] mt-0.5">→</span>{g}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Availability */}
      {user.availability?.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
            <Calendar size={14} className="inline mr-1.5 mb-0.5" />Availability
          </h2>
          <div className="flex flex-wrap gap-2">
            {DAYS.filter((d) => availMap[d]).map((day) => (
              <div key={day} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                <span className="text-xs font-semibold text-[var(--color-foreground)]">{day}</span>
                <span className="text-sm">{(availMap[day] || []).map((s) => SLOT_LABELS[s]).join(' ')}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mentor section */}
      {isMentor && user.mentorProfile && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-[var(--color-success)]" />
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Mentor Profile</h2>
            {user.mentorProfile.acceptingMentees && (
              <Badge variant="success">Accepting mentees</Badge>
            )}
          </div>
          {user.mentorProfile.mentoringStatement && (
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">{user.mentorProfile.mentoringStatement}</p>
          )}
          {user.mentorProfile.expertise?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {user.mentorProfile.expertise.map((e, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">{e}</span>
              ))}
            </div>
          )}
          {user.mentorProfile.yearsOfExperience > 0 && (
            <p className="text-xs text-[var(--color-muted-foreground)] mt-3">
              {user.mentorProfile.yearsOfExperience} year{user.mentorProfile.yearsOfExperience !== 1 ? 's' : ''} of experience
            </p>
          )}
        </Card>
      )}

      {/* Links */}
      {(links.github || links.linkedin || links.portfolio) && (
        <Card>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Links</h2>
          <div className="flex flex-wrap gap-3">
            {links.github && (
              <a href={links.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">
                <GitBranch size={14} />GitHub
              </a>
            )}
            {links.linkedin && (
              <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">
                <ExternalLink size={14} />LinkedIn
              </a>
            )}
            {links.portfolio && (
              <a href={links.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">
                <Globe size={14} />Portfolio
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Connect modal */}
      <Modal
        open={connectModal}
        onClose={() => setConnectModal(false)}
        title={isMentor ? `Request mentorship from ${user.name}` : `Connect with ${user.name}`}
        description={isMentor ? "Tell them why you'd like them as your mentor (optional)." : 'Add a personal note to your request (optional).'}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConnectModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleConnect} isLoading={isSending} disabled={isSending}>
              Send request
            </Button>
          </>
        }
      >
        <Textarea
          placeholder="Write a short message… (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 300))}
          rows={3}
          aria-label="Request message"
        />
        <p className="mt-1 text-right text-xs text-[var(--color-muted-foreground)]">{message.length}/300</p>
      </Modal>
    </div>
  );
};

export default PublicProfile;

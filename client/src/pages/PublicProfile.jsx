import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GitBranch, ExternalLink, Globe, GraduationCap, Star, MapPin, Calendar, MessageCircle, UserPlus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import useProfileStore from '../store/profileStore';

const LEVEL_COLORS = { beginner: 'neutral', intermediate: 'accent', advanced: 'success' };
const SLOT_LABELS = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PublicProfile = () => {
  const { id } = useParams();
  const { fetchPublicProfile, isLoading } = useProfileStore();
  const [user, setUser] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPublicProfile(id)
      .then(({ success, user: u }) => {
        if (success) setUser(u);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [id]);

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
        icon={<span className="text-4xl">🔍</span>}
        title="User not found"
        description="This profile doesn't exist or has been deactivated."
        action={<Link to="/discover" className="text-sm text-[var(--color-accent)] hover:underline">Browse community</Link>}
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

          {/* Action buttons (disabled — coming soon) */}
          <div className="flex flex-col gap-2 flex-shrink-0 sm:ml-auto">
            <div className="relative group">
              <button disabled className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-muted-foreground)] opacity-50 cursor-not-allowed">
                <UserPlus size={14} />Connect
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-xs bg-[var(--color-surface-raised)] text-[var(--color-muted-foreground)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 border border-[var(--color-border)]">
                Coming soon
              </div>
            </div>
            <div className="relative group">
              <button disabled className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent)] text-white opacity-50 cursor-not-allowed">
                <MessageCircle size={14} />Message
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-xs bg-[var(--color-surface-raised)] text-[var(--color-muted-foreground)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 border border-[var(--color-border)]">
                Coming soon
              </div>
            </div>
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
    </div>
  );
};

export default PublicProfile;

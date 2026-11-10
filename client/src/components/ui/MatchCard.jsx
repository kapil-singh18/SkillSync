import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserX, ExternalLink, Clock, Zap } from 'lucide-react';
import Avatar from './Avatar';
import Badge from './Badge';
import Button from './Button';
import Modal from './Modal';
import ProgressBar from './ProgressBar';
import Textarea from './Textarea';

/**
 * MatchCard
 *
 * Displays a scored match candidate with:
 * - Avatar, name, role badge, headline
 * - Match % ring and AI one-liner insight
 * - Shared skills / "can help you with" chips
 * - Availability overlap count
 * - Connect / Request mentorship / Dismiss / View profile actions
 */
const MatchCard = ({
  result,          // { user, score, sharedSkills, sharedInterests, overlappingSlots, canTeachMe, insight }
  type,            // 'peer' | 'mentor'
  onConnect,       // async (userId, message) => void
  onDismiss,       // (userId) => void
  connectionStatus, // 'none' | 'pending_sent' | 'pending_received' | 'connected'
}) => {
  const { user, score, sharedSkills = [], canTeachMe = [], overlappingSlots = 0, insight } = result;

  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const isMentorType = type === 'mentor';
  const isAccepting = !isMentorType || user?.mentorProfile?.acceptingMentees !== false;
  const isConnected = connectionStatus === 'connected';
  const isPendingSent = connectionStatus === 'pending_sent';
  const isPendingReceived = connectionStatus === 'pending_received';

  const handleConnectClick = () => {
    if (!isAccepting) return;
    setMessage('');
    setModalOpen(true);
  };

  const handleSend = async () => {
    if (!onConnect) return;
    setIsConnecting(true);
    await onConnect(user._id, message.trim());
    setIsConnecting(false);
    setModalOpen(false);
  };

  const connectLabel = isConnected
    ? 'Connected'
    : isPendingSent
      ? 'Request sent'
      : isPendingReceived
        ? 'Respond'
        : isMentorType
          ? 'Request mentorship'
          : 'Connect';

  const connectDisabled = isConnected || isPendingSent || !isAccepting;

  return (
    <>
      <article className="flex flex-col gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 transition-colors duration-150">
        {/* Top row: Avatar + meta + score ring */}
        <div className="flex items-start gap-3">
          <Link to={`/users/${user._id}`} tabIndex={-1} aria-hidden="true">
            <Avatar src={user.avatarUrl} name={user.name} size="lg" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/users/${user._id}`}
                className="text-sm font-semibold text-[var(--color-foreground)] hover:text-[var(--color-accent)] transition-colors truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
              >
                {user.name}
              </Link>
              <Badge
                variant={user.role === 'mentor' ? 'accent' : 'neutral'}
              >
                {user.role}
              </Badge>
            </div>

            {user.headline && (
              <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)] truncate">
                {user.headline}
              </p>
            )}

            {user.location && (
              <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]/70 truncate">
                {user.location}
              </p>
            )}
          </div>

          {/* Match score ring */}
          <div
            className="flex-shrink-0 flex flex-col items-center"
            aria-label={`${score}% match`}
          >
            <div
              className="relative w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(var(--color-accent) ${score * 3.6}deg, var(--color-surface-raised) 0deg)`,
              }}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[var(--color-accent)]">
                  {score}%
                </span>
              </div>
            </div>
            <span className="mt-0.5 text-[10px] text-[var(--color-muted-foreground)]">match</span>
          </div>
        </div>

        {/* AI insight */}
        {insight && (
          <p className="text-xs text-[var(--color-muted-foreground)] italic border-l-2 border-[var(--color-accent)]/40 pl-2 leading-relaxed">
            {insight}
          </p>
        )}

        {/* Match score bar */}
        <ProgressBar value={score} showLabel={false} size="sm" />

        {/* Chips */}
        <div className="flex flex-col gap-2">
          {sharedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] text-[var(--color-muted-foreground)] mr-1 self-center">Shared:</span>
              {sharedSkills.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--color-surface-raised)] text-[var(--color-foreground)] border border-[var(--color-border)]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {canTeachMe.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] text-[var(--color-muted-foreground)] mr-1 self-center flex items-center gap-0.5">
                <Zap size={9} className="text-[var(--color-accent)]" />
                Can help:
              </span>
              {canTeachMe.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {overlappingSlots > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-[var(--color-muted-foreground)]">
              <Clock size={10} />
              <span>{overlappingSlots} overlapping time slot{overlappingSlots !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Mentor not accepting */}
        {isMentorType && !isAccepting && (
          <p className="text-[10px] text-[var(--color-muted-foreground)] italic">
            Not currently accepting mentees
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            disabled={connectDisabled}
            onClick={handleConnectClick}
            aria-label={`${connectLabel} with ${user.name}`}
          >
            {connectLabel}
          </Button>

          <Link to={`/users/${user._id}`} tabIndex={0} aria-label={`View ${user.name}'s profile`}>
            <Button variant="ghost" size="sm" aria-label="View profile">
              <ExternalLink size={14} />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss?.(user._id)}
            aria-label={`Dismiss ${user.name}`}
            title="Dismiss"
          >
            <UserX size={14} className="text-[var(--color-muted-foreground)]" />
          </Button>
        </div>
      </article>

      {/* Connect modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isMentorType ? `Request mentorship from ${user.name}` : `Connect with ${user.name}`}
        description={
          isMentorType
            ? "Tell them why you'd like them as a mentor (optional)."
            : 'Add a personal note to your request (optional).'
        }
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              isLoading={isConnecting}
              disabled={isConnecting}
            >
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
        <p className="mt-1 text-right text-xs text-[var(--color-muted-foreground)]">
          {message.length}/300
        </p>
      </Modal>
    </>
  );
};

export default MatchCard;
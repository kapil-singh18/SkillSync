/**
 * Chat.jsx — Module 5: Real-time DM + Study Rooms
 *
 * Layout:
 *  - Left panel: conversation/room list with tabs, search, action buttons
 *  - Right panel: message thread with auto-scroll, typing indicator, composer
 *  - Mobile (<lg): single-screen, Back button to toggle panels
 *
 * Query params: ?user=<id> → auto-open DM | ?room=<id> → auto-open room
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Hash,
  Plus,
  Search,
  ArrowLeft,
  Send,
  Trash2,
  RefreshCw,
  Info,
  Users,
  Copy,
  Check,
  LogOut,
  Archive,
  ChevronDown,
  X,
  Pencil,
  Lock,
  Globe,
  Clock,
} from 'lucide-react';

import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import * as chatApi from '../api/chat';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatDateSep = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
};

const isSameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

// ── Online dot ────────────────────────────────────────────────────────────────

const OnlineDot = ({ online, className = '' }) => (
  <span
    aria-label={online ? 'Online' : 'Offline'}
    className={[
      'inline-block rounded-full border-2 border-[var(--color-background)]',
      online ? 'bg-[var(--color-success)]' : 'bg-[var(--color-muted-foreground)]/30',
      className,
    ].join(' ')}
  />
);

// ── Connection state banner ───────────────────────────────────────────────────

const ConnectionBanner = ({ state }) => {
  if (state === 'connected') return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-2 px-4 py-2 text-xs border-b"
      style={{
        background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
        borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
        color: 'var(--color-warning)',
      }}
    >
      {state === 'reconnecting' ? (
        <><RefreshCw size={12} className="animate-spin" /> Reconnecting&hellip;</>
      ) : (
        <><Clock size={12} /> Offline &mdash; messages will send when reconnected</>
      )}
    </div>
  );
};

// ── Typing indicator ──────────────────────────────────────────────────────────

const TypingIndicator = ({ names }) => {
  if (!names || !names.length) return null;
  const label =
    names.length === 1
      ? `${names[0]} is typing\u2026`
      : `${names.slice(0, 2).join(', ')} are typing\u2026`;
  return (
    <div
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-1 text-xs text-[var(--color-muted-foreground)] italic"
    >
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted-foreground)]/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      {label}
    </div>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────────

const MessageBubble = ({ message, isOwn, showSender, canDelete, onDelete, onRetry }) => {
  const isDeleted = !!(message.deleted || message.deletedAt);
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';

  return (
    <div className={['flex gap-2 group/bubble', isOwn ? 'flex-row-reverse' : 'flex-row'].join(' ')}>
      {/* Avatar (rooms, other user) */}
      {!isOwn && showSender ? (
        <Avatar src={message.sender?.avatarUrl} name={message.sender?.name} size="sm" className="flex-shrink-0 mt-1" />
      ) : (
        !isOwn && <div className="w-8 flex-shrink-0" />
      )}

      <div className={['flex flex-col gap-0.5 max-w-[70%]', isOwn ? 'items-end' : 'items-start'].join(' ')}>
        {showSender && !isOwn && (
          <span className="text-xs font-medium text-[var(--color-muted-foreground)] px-1">
            {message.sender?.name}
          </span>
        )}

        <div
          className={[
            'relative px-3 py-2 rounded-2xl text-sm break-words',
            isOwn
              ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] rounded-tr-sm'
              : 'bg-[var(--color-surface-raised)] text-[var(--color-foreground)] border border-[var(--color-border)] rounded-tl-sm',
            isDeleted ? 'opacity-50 italic' : '',
          ].join(' ')}
        >
          {/* Plain text — never dangerouslySetInnerHTML */}
          {isDeleted
            ? <span className="text-xs">(Message deleted)</span>
            : <span style={{ whiteSpace: 'pre-wrap' }}>{message.text}</span>
          }

          {/* Delete on hover */}
          {canDelete && !isDeleted && (
            <button
              onClick={() => onDelete(message._id)}
              aria-label="Delete message"
              className={[
                'absolute -top-2 p-1 rounded-full',
                'bg-[var(--color-surface)] border border-[var(--color-border)]',
                'text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)]',
                'opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-150',
                isOwn ? '-left-7' : '-right-7',
              ].join(' ')}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

        {/* Status / time */}
        <span className="text-[0.65rem] text-[var(--color-muted-foreground)] px-1 flex items-center gap-1.5">
          {formatTime(message.createdAt)}
          {isSending && <span className="opacity-60">Sending&hellip;</span>}
          {isFailed && (
            <button
              onClick={() => onRetry(message.clientId, message.text)}
              className="text-[var(--color-danger)] hover:underline flex items-center gap-1"
            >
              <RefreshCw size={9} /> Retry
            </button>
          )}
        </span>
      </div>
    </div>
  );
};

// ── Message list ──────────────────────────────────────────────────────────────

const MessageList = ({ chatKey, type, targetId }) => {
  const { messagesByChat, hasMoreByChat, typing, loadOlder, deleteMessage, retryMessage } = useChatStore();
  const { user: me } = useAuthStore();
  const listRef = useRef(null);
  const topRef = useRef(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);
  const [showPill, setShowPill] = useState(false);
  const nearBottomRef = useRef(true);
  const prevLenRef = useRef(0);
  const isRoom = type === 'room';

  const messages = messagesByChat[chatKey] || [];
  const hasMore = hasMoreByChat[chatKey];
  const typingSet = typing[chatKey];
  const typingNames = typingSet ? [...typingSet] : [];

  // Scroll to bottom on new msgs if near bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const isNew = messages.length > prevLenRef.current;
    prevLenRef.current = messages.length;
    if (isNew) {
      if (nearBottomRef.current) {
        el.scrollTop = el.scrollHeight;
        setShowPill(false);
      } else {
        setShowPill(true);
      }
    }
  }, [messages.length]);

  // Restore scroll after loading older
  useEffect(() => {
    const el = listRef.current;
    if (!el || !prevScrollHeight) return;
    el.scrollTop = el.scrollHeight - prevScrollHeight;
    setPrevScrollHeight(0);
  }, [prevScrollHeight]);

  // Initial scroll
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    prevLenRef.current = 0;
    setShowPill(false);
  }, [chatKey]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottomRef.current) setShowPill(false);
  };

  const doLoadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore) return;
    const el = listRef.current;
    setLoadingOlder(true);
    setPrevScrollHeight(el?.scrollHeight || 0);
    await loadOlder(type, targetId);
    setLoadingOlder(false);
  }, [loadingOlder, hasMore, loadOlder, type, targetId]);

  // Intersection observer for top sentinel
  useEffect(() => {
    const sentinel = topRef.current;
    if (!sentinel || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) doLoadOlder(); },
      { root: listRef.current, threshold: 0.1 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [hasMore, doLoadOlder]);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setShowPill(false);
  };

  const handleDelete = (msgId) => deleteMessage(msgId);
  const handleRetry = (clientId, text) => retryMessage(type, targetId, clientId, text);

  if (messages.length === 0 && !loadingOlder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[var(--color-muted-foreground)]">
        <MessageCircle size={32} className="opacity-20" />
        <p className="text-sm">No messages yet. Say hello!</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={listRef}
        onScroll={handleScroll}
        aria-live="polite"
        aria-relevant="additions"
        className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-1"
      >
        <div ref={topRef} />

        {loadingOlder && (
          <div className="flex justify-center py-3"><Spinner size="sm" /></div>
        )}

        {!hasMore && messages.length > 0 && (
          <p className="text-center text-[0.65rem] text-[var(--color-muted-foreground)]/40 py-2">
            Beginning of conversation
          </p>
        )}

        {messages.map((msg, idx) => {
          const prev = messages[idx - 1];
          const showDaySep = !prev || !isSameDay(prev.createdAt, msg.createdAt);
          const senderId = String(msg.sender?._id || msg.sender);
          const isOwn = senderId === String(me?._id);
          const prevSenderId = prev ? String(prev.sender?._id || prev.sender) : null;
          const showSender = isRoom && (!prev || prevSenderId !== senderId || showDaySep);
          const canDelete = isOwn;

          return (
            <div key={msg._id || msg.clientId}>
              {showDaySep && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-[var(--color-border)]" />
                  <span className="text-[0.65rem] text-[var(--color-muted-foreground)]/50">
                    {formatDateSep(msg.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-[var(--color-border)]" />
                </div>
              )}
              <MessageBubble
                message={msg}
                isOwn={isOwn}
                showSender={showSender}
                canDelete={canDelete}
                onDelete={handleDelete}
                onRetry={handleRetry}
              />
            </div>
          );
        })}

        <TypingIndicator names={typingNames} />
      </div>

      {/* New messages pill */}
      {showPill && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
        >
          <ChevronDown size={12} /> New messages
        </button>
      )}
    </div>
  );
};

// ── Composer ──────────────────────────────────────────────────────────────────

const Composer = ({ type, targetId, connectionState }) => {
  const { sendMessage, sendTyping } = useChatStore();
  const [text, setText] = useState('');
  const ref = useRef(null);
  const typingTimer = useRef(null);
  const isTyping = useRef(false);
  const MAX = 2000;
  const disabled = connectionState !== 'connected';

  // Auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [text]);

  const stopTyping = useCallback(() => {
    if (isTyping.current) {
      isTyping.current = false;
      sendTyping(type, targetId, false);
    }
  }, [sendTyping, type, targetId]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length > MAX) return;
    setText(val);
    if (!isTyping.current) {
      isTyping.current = true;
      sendTyping(type, targetId, true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 2000);
  };

  const doSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    setText('');
    stopTyping();
    await sendMessage(type, targetId, trimmed);
    ref.current?.focus();
  }, [text, disabled, sendMessage, type, targetId, stopTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  // Reset text when switching chats
  useEffect(() => {
    setText('');
    stopTyping();
  }, [type, targetId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
      {disabled && (
        <p className="text-xs text-center text-[var(--color-muted-foreground)] mb-2">
          Connecting&hellip; your message will send when reconnected.
        </p>
      )}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={ref}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label="Message input"
            placeholder={disabled ? 'Connecting\u2026' : 'Type a message\u2026 (Enter to send, Shift+Enter for newline)'}
            className={[
              'w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-150',
              'border border-[var(--color-border)] bg-[var(--color-surface-raised)]',
              'text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/60',
              'focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20',
              'disabled:opacity-50 disabled:cursor-not-allowed max-h-40 overflow-y-auto',
            ].join(' ')}
            style={{ minHeight: '44px' }}
          />
          {text.length > 1800 && (
            <span className="absolute bottom-2 right-3 text-[0.6rem] text-[var(--color-muted-foreground)]">
              {text.length}/{MAX}
            </span>
          )}
        </div>
        <Button
          onClick={doSend}
          disabled={disabled || !text.trim()}
          size="sm"
          aria-label="Send message"
          className="rounded-xl h-11 w-11 p-0 flex-shrink-0"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};

// ── Create Room Modal ─────────────────────────────────────────────────────────

const CreateRoomModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [maxMembers, setMaxMembers] = useState(30);
  const [loading, setLoading] = useState(false);

  const reset = () => { setName(''); setDescription(''); setTags(''); setVisibility('public'); setMaxMembers(30); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 5);
    const result = await onCreate({
      name: name.trim(), description: description.trim(),
      tags: tagList, visibility, maxMembers: Number(maxMembers),
    });
    setLoading(false);
    if (result?.success) handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create Study Room" size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Room Name" value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder="e.g. React Study Group" required />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-foreground)]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 300))}
            placeholder="What is this room about?"
            rows={2}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 resize-none placeholder:text-[var(--color-muted-foreground)]/60"
          />
        </div>
        <Input label="Tags (comma-separated, up to 5)" value={tags} onChange={(e) => setTags(e.target.value.slice(0, 200))} placeholder="React, JavaScript, Frontend" />
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-[var(--color-foreground)]">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
            >
              <option value="public">Public</option>
              <option value="private">Private (invite only)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-32">
            <label className="text-sm font-medium text-[var(--color-foreground)]">Max Members</label>
            <input
              type="number" min={2} max={50} value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" type="button" onClick={handleClose}>Cancel</Button>
          <Button size="sm" type="submit" loading={loading} disabled={!name.trim()}>Create Room</Button>
        </div>
      </form>
    </Modal>
  );
};

// ── Browse Rooms Modal ────────────────────────────────────────────────────────

const BrowseRoomsModal = ({ open, onClose, onJoin }) => {
  const [search, setSearch] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const fetchRooms = useCallback(async (q, p) => {
    setLoading(true);
    try {
      const { data } = await chatApi.discoverRooms({ search: q, page: p, limit: 10 });
      const list = data.rooms || [];
      setRooms(p === 1 ? list : (prev) => [...prev, ...list]);
      setHasMore(data.hasMore || false);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSearch(''); setPage(1); setRooms([]);
    fetchRooms('', 1);
  }, [open, fetchRooms]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => { setPage(1); fetchRooms(search, 1); }, 350);
    return () => clearTimeout(t);
  }, [search, open, fetchRooms]);

  const handleJoin = async (roomId) => {
    setJoiningId(roomId);
    await onJoin(roomId);
    setJoiningId(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Browse Public Rooms" size="lg">
      <div className="flex flex-col gap-3">
        <Input placeholder="Search rooms\u2026" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {loading && page === 1 ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-center text-[var(--color-muted-foreground)] py-4">No public rooms found</p>
          ) : (
            rooms.map((room) => (
              <div key={room._id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center flex-shrink-0">
                  <Hash size={14} className="text-[var(--color-accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{room.name}</p>
                  {room.description && <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">{room.description}</p>}
                  <p className="text-xs text-[var(--color-muted-foreground)]/50 mt-0.5">{room.members?.length || 0} members</p>
                </div>
                <Button size="sm" variant="outline" loading={joiningId === room._id} onClick={() => handleJoin(room._id)}>Join</Button>
              </div>
            ))
          )}
          {hasMore && (
            <Button variant="ghost" size="sm" className="w-full" loading={loading}
              onClick={() => { const next = page + 1; setPage(next); fetchRooms(search, next); }}>
              Load more
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ── Join by Code Modal ────────────────────────────────────────────────────────

const JoinByCodeModal = ({ open, onClose, onJoin }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => { setCode(''); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    const result = await onJoin(code.trim());
    setLoading(false);
    if (result?.success) handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Join Private Room" description="Enter the invite code shared with you." size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Invite Code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste invite code\u2026" required />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={handleClose}>Cancel</Button>
          <Button size="sm" type="submit" loading={loading} disabled={!code.trim()}>Join</Button>
        </div>
      </form>
    </Modal>
  );
};

// ── Room Info Drawer ──────────────────────────────────────────────────────────

const RoomInfoDrawer = ({ open, onClose, roomId }) => {
  const { roomDetails, loadRoomDetails, leaveRoom } = useChatStore();
  const { user: me } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const room = roomDetails[String(roomId)];

  useEffect(() => {
    if (!open || !roomId) return;
    setLoading(true);
    loadRoomDetails(roomId).finally(() => setLoading(false));
  }, [open, roomId, loadRoomDetails]);

  const isOwner = useMemo(() =>
    room?.members?.some(
      (m) => String(m.user?._id || m.user) === String(me?._id) && m.role === 'owner'
    ), [room, me]);

  const handleCopy = () => {
    if (!room?.inviteCode) return;
    navigator.clipboard.writeText(room.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const startEdit = () => {
    setEditName(room?.name || '');
    setEditDesc(room?.description || '');
    setEditTags((room?.tags || []).join(', '));
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const tagList = editTags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 5);
      await chatApi.updateRoom(roomId, { name: editName.trim(), description: editDesc.trim(), tags: tagList });
      await loadRoomDetails(roomId);
      setEditMode(false);
    } catch { /* toast by api */ }
    finally { setSavingEdit(false); }
  };

  const handleRemoveMember = async (userId) => {
    setRemovingId(userId);
    try {
      await chatApi.removeMember(roomId, userId);
      await loadRoomDetails(roomId);
    } catch { /* */ }
    finally { setRemovingId(null); }
  };

  const handleArchive = async () => {
    if (!window.confirm('Archive this room? Members will no longer be able to send messages.')) return;
    setArchiving(true);
    await chatApi.archiveRoom(roomId);
    setArchiving(false);
    onClose();
  };

  const handleLeave = async () => {
    setLeaving(true);
    await leaveRoom(roomId);
    setLeaving(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true" role="dialog" aria-label="Room info">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-80 h-full bg-[var(--color-surface)] border-l border-[var(--color-border)] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-foreground)]">Room Info</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !room ? (
          <p className="p-4 text-sm text-[var(--color-muted-foreground)]">Could not load room info.</p>
        ) : (
          <div className="flex flex-col gap-4 p-4 flex-1">
            {/* Name + description */}
            {editMode ? (
              <div className="flex flex-col gap-2">
                <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value.slice(0, 60))} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Description</label>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value.slice(0, 300))} rows={2}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] resize-none" />
                </div>
                <Input label="Tags (comma-separated)" value={editTags} onChange={(e) => setEditTags(e.target.value.slice(0, 200))} />
                <div className="flex gap-2 mt-1">
                  <Button size="sm" onClick={handleSaveEdit} loading={savingEdit}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--color-foreground)] truncate">{room.name}</h3>
                    {room.description && (
                      <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{room.description}</p>
                    )}
                  </div>
                  {isOwner && (
                    <button onClick={startEdit} className="p-1 rounded text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] flex-shrink-0">
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
                {room.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {room.tags.map((tag) => <Badge key={tag} variant="neutral" className="text-xs">{tag}</Badge>)}
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--color-muted-foreground)]">
                  {room.visibility === 'private' ? <Lock size={11} /> : <Globe size={11} />}
                  {room.visibility === 'private' ? 'Private' : 'Public'}
                </div>
              </div>
            )}

            {/* Invite code (private room owner only) */}
            {isOwner && room.visibility === 'private' && room.inviteCode && (
              <div className="bg-[var(--color-surface-raised)] rounded-lg p-3 border border-[var(--color-border)]">
                <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Invite Code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-[var(--color-foreground)] bg-[var(--color-surface)] rounded px-2 py-1 border border-[var(--color-border)] truncate">
                    {room.inviteCode}
                  </code>
                  <button onClick={handleCopy} aria-label="Copy invite code"
                    className="p-1.5 rounded text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border)] transition-colors">
                    {copied ? <Check size={14} className="text-[var(--color-success)]" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Members */}
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-2">
                Members ({room.members?.length || 0})
              </p>
              <div className="flex flex-col gap-1.5">
                {(room.members || []).map((m) => {
                  const memberId = String(m.user?._id || m.user);
                  const memberName = m.user?.name || 'User';
                  const isSelf = memberId === String(me?._id);
                  return (
                    <div key={memberId} className="flex items-center gap-2 py-1">
                      <Avatar src={m.user?.avatarUrl} name={memberName} size="sm" />
                      <span className="flex-1 text-sm text-[var(--color-foreground)] truncate">{memberName}</span>
                      {m.role === 'owner' && <Badge variant="accent" className="text-xs">Owner</Badge>}
                      {isOwner && !isSelf && (
                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          disabled={removingId === memberId}
                          className="p-1 rounded text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)] transition-colors disabled:opacity-50"
                          aria-label={`Remove ${memberName}`}
                        >
                          {removingId === memberId ? <Spinner size="sm" /> : <X size={12} />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer actions */}
            <div className="mt-auto pt-3 border-t border-[var(--color-border)] flex flex-col gap-2">
              {isOwner ? (
                <Button variant="danger" size="sm" loading={archiving} onClick={handleArchive} className="w-full">
                  <Archive size={14} /> Archive Room
                </Button>
              ) : (
                <Button
                  variant="outline" size="sm" loading={leaving} onClick={handleLeave}
                  className="w-full text-[var(--color-danger)] border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/10"
                >
                  <LogOut size={14} /> Leave Room
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Chat thread (right panel) ─────────────────────────────────────────────────

const ChatThread = ({ onBack }) => {
  const { activeChat, conversations, rooms, connectionState, roomDetails } = useChatStore();
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);

  const type = activeChat?.type;
  const targetId = activeChat?.id;
  const chatKey = type && targetId ? `${type}:${targetId}` : null;

  const headerInfo = useMemo(() => {
    if (!activeChat) return null;
    if (type === 'dm') {
      const conv = conversations.find((c) => String(c.other?._id) === String(targetId));
      return { name: conv?.other?.name || 'User', avatar: conv?.other?.avatarUrl, subtitle: null, isDm: true };
    }
    if (type === 'room') {
      const room = rooms.find((r) => String(r._id) === String(targetId));
      const memberCount = room?.members?.length || roomDetails[String(targetId)]?.members?.length || 0;
      return { name: room?.name || 'Room', avatar: null, subtitle: memberCount ? `${memberCount} members` : null, isDm: false };
    }
    return null;
  }, [activeChat, conversations, rooms, roomDetails, type, targetId]);

  if (!activeChat || !chatKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--color-muted-foreground)]">
        <MessageCircle size={40} className="opacity-20" />
        <p className="text-sm">Select a conversation or join a room</p>
        <p className="text-xs opacity-60">Start by opening a DM or joining a study room</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} />
        </button>
        {headerInfo?.isDm ? (
          <Avatar src={headerInfo.avatar} name={headerInfo.name} size="sm" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center flex-shrink-0">
            <Hash size={16} className="text-[var(--color-accent)]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">{headerInfo?.name}</p>
          {headerInfo?.subtitle && (
            <p className="text-xs text-[var(--color-muted-foreground)]">{headerInfo.subtitle}</p>
          )}
        </div>
        {type === 'room' && (
          <button
            onClick={() => setRoomInfoOpen(true)}
            aria-label="Room info"
            className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <Info size={16} />
          </button>
        )}
      </div>

      <ConnectionBanner state={connectionState} />

      <MessageList chatKey={chatKey} type={type} targetId={targetId} />

      <Composer type={type} targetId={targetId} connectionState={connectionState} />

      {type === 'room' && (
        <RoomInfoDrawer open={roomInfoOpen} onClose={() => setRoomInfoOpen(false)} roomId={targetId} />
      )}
    </div>
  );
};

// ── Conversation list item ────────────────────────────────────────────────────

const ConvItem = ({ conv, isActive, onClick }) => {
  const { presence } = useChatStore();
  const online = presence[String(conv.other?._id)];
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? 'true' : undefined}
      className={[
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150',
        isActive
          ? 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20'
          : 'hover:bg-[var(--color-surface-raised)]',
      ].join(' ')}
    >
      <div className="relative flex-shrink-0">
        <Avatar src={conv.other?.avatarUrl} name={conv.other?.name} size="sm" />
        <OnlineDot online={online} className="absolute -bottom-0.5 -right-0.5 w-3 h-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm font-medium text-[var(--color-foreground)] truncate">{conv.other?.name}</span>
          {conv.lastMessage?.createdAt && (
            <span className="text-[0.65rem] text-[var(--color-muted-foreground)]/60 flex-shrink-0">
              {formatTime(conv.lastMessage.createdAt)}
            </span>
          )}
        </div>
        {conv.lastMessage?.text && (
          <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">{conv.lastMessage.text}</p>
        )}
      </div>
      {conv.unread > 0 && (
        <span className="flex-shrink-0 min-w-5 h-5 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] text-[0.6rem] font-bold flex items-center justify-center px-1">
          {conv.unread > 99 ? '99+' : conv.unread}
        </span>
      )}
    </button>
  );
};

// ── Room list item ────────────────────────────────────────────────────────────

const RoomItem = ({ room, isActive, onClick }) => (
  <button
    onClick={onClick}
    aria-current={isActive ? 'true' : undefined}
    className={[
      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150',
      isActive
        ? 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20'
        : 'hover:bg-[var(--color-surface-raised)]',
    ].join(' ')}
  >
    <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center flex-shrink-0">
      <Hash size={14} className="text-[var(--color-accent)]" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-sm font-medium text-[var(--color-foreground)] truncate">{room.name}</span>
        {room.lastMessage?.createdAt && (
          <span className="text-[0.65rem] text-[var(--color-muted-foreground)]/60 flex-shrink-0">
            {formatTime(room.lastMessage.createdAt)}
          </span>
        )}
      </div>
      {room.lastMessage?.text ? (
        <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">{room.lastMessage.text}</p>
      ) : (
        <p className="text-xs text-[var(--color-muted-foreground)]/50 mt-0.5">{room.members?.length || 0} members</p>
      )}
    </div>
    {room.visibility === 'private' && (
      <Lock size={12} className="text-[var(--color-muted-foreground)]/40 flex-shrink-0" />
    )}
  </button>
);

// ── Left panel (sidebar) ──────────────────────────────────────────────────────

const ChatSidebar = ({ onSelectChat, showOnMobile }) => {
  const { conversations, rooms, activeChat, loadConversations, loadMyRooms, createRoom, joinRoom, joinByCode, fetchPresence } = useChatStore();
  const [tab, setTab] = useState('direct');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  // Fetch presence for DM contacts
  useEffect(() => {
    const ids = conversations.map((c) => String(c.other?._id)).filter(Boolean);
    if (ids.length) fetchPresence(ids);
  }, [conversations, fetchPresence]);

  const filteredConvs = useMemo(() => {
    const q = search.toLowerCase();
    return q ? conversations.filter((c) => (c.other?.name || '').toLowerCase().includes(q)) : conversations;
  }, [conversations, search]);

  const filteredRooms = useMemo(() => {
    const q = search.toLowerCase();
    return q ? rooms.filter((r) => r.name.toLowerCase().includes(q)) : rooms;
  }, [rooms, search]);

  const handleJoinRoom = async (roomId) => {
    const result = await joinRoom(roomId);
    if (result?.success) onSelectChat('room', roomId);
    return result;
  };

  const handleJoinByCode = async (code) => {
    const result = await joinByCode(code);
    if (result?.success && result.roomId) onSelectChat('room', result.roomId);
    return result;
  };

  const handleCreate = async (data) => {
    const result = await createRoom(data);
    if (result?.success && result.room) onSelectChat('room', result.room._id);
    return result;
  };

  return (
    <div className={[
      'flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)]',
      'lg:flex',
      showOnMobile ? 'flex' : 'hidden',
    ].join(' ')}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-[var(--color-border)]">
        <h1 className="font-semibold text-[var(--color-foreground)]">Messages</h1>
        <button
          onClick={() => { loadConversations(); loadMyRooms(); }}
          aria-label="Refresh conversations"
          className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]/60 pointer-events-none" />
          <input
            type="search"
            placeholder="Search\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 placeholder:text-[var(--color-muted-foreground)]/60 transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-3 gap-1 pb-1">
        {['direct', 'rooms'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150',
              tab === t
                ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)]',
            ].join(' ')}
          >
            {t === 'direct'
              ? <span className="flex items-center justify-center gap-1.5"><MessageCircle size={12} /> Direct</span>
              : <span className="flex items-center justify-center gap-1.5"><Hash size={12} /> Rooms</span>
            }
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 flex flex-col gap-0.5">
        {tab === 'direct' ? (
          filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center text-[var(--color-muted-foreground)]">
              <Users size={28} className="opacity-20" />
              <p className="text-xs">{search ? 'No matches' : 'Connect with peers to start chatting'}</p>
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <ConvItem
                key={conv._id || String(conv.other?._id)}
                conv={conv}
                isActive={activeChat?.type === 'dm' && String(activeChat.id) === String(conv.other?._id)}
                onClick={() => onSelectChat('dm', String(conv.other?._id))}
              />
            ))
          )
        ) : (
          <>
            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 text-center text-[var(--color-muted-foreground)]">
                <Hash size={28} className="opacity-20" />
                <p className="text-xs">{search ? 'No matches' : 'Join or create a room to collaborate'}</p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <RoomItem
                  key={room._id}
                  room={room}
                  isActive={activeChat?.type === 'room' && String(activeChat.id) === String(room._id)}
                  onClick={() => onSelectChat('room', String(room._id))}
                />
              ))
            )}

            {/* Room action buttons */}
            <div className="flex flex-col gap-1 mt-2 px-1">
              {[
                { icon: Plus, label: 'Create a room', action: () => setCreateOpen(true) },
                { icon: Globe, label: 'Browse public rooms', action: () => setBrowseOpen(true) },
                { icon: Lock, label: 'Join with invite code', action: () => setCodeOpen(true) },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors border border-dashed border-[var(--color-border)]"
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CreateRoomModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <BrowseRoomsModal open={browseOpen} onClose={() => setBrowseOpen(false)} onJoin={handleJoinRoom} />
      <JoinByCodeModal open={codeOpen} onClose={() => setCodeOpen(false)} onJoin={handleJoinByCode} />
    </div>
  );
};

// ── Main Chat page ────────────────────────────────────────────────────────────

const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openChat, activeChat, loadConversations, loadMyRooms } = useChatStore();
  const [showList, setShowList] = useState(true);
  const initialized = useRef(false);

  // Load data on mount
  useEffect(() => {
    loadConversations();
    loadMyRooms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ?user= and ?room= query params to auto-open a chat
  useEffect(() => {
    if (initialized.current) return;
    const userId = searchParams.get('user');
    const roomId = searchParams.get('room');
    if (!userId && !roomId) return;
    initialized.current = true;
    const type = userId ? 'dm' : 'room';
    const id = userId || roomId;
    openChat(type, id).then(() => {
      setShowList(false);
      navigate('/chat', { replace: true });
    });
  }, [searchParams, openChat, navigate]);

  const handleSelectChat = useCallback((type, id) => {
    openChat(type, id);
    setShowList(false);
  }, [openChat]);

  const handleBack = useCallback(() => setShowList(true), []);

  return (
    // Full-height layout that hugs the app shell edges
    <div className="flex overflow-hidden -mx-4 -my-4 sm:-mx-6 lg:-mx-8"
      style={{ height: 'calc(100dvh - 4rem)' }}>
      {/* Left — list */}
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 h-full">
        <ChatSidebar onSelectChat={handleSelectChat} showOnMobile={showList || !activeChat} />
      </div>

      {/* Right — thread */}
      <div className={[
        'flex-1 h-full',
        // Desktop: always visible. Mobile: visible only when a chat is selected & list is hidden
        'hidden lg:flex lg:flex-col',
        (!showList && activeChat) ? '!flex !flex-col' : '',
      ].join(' ')}>
        <ChatThread onBack={handleBack} />
      </div>
    </div>
  );
};

export default Chat;

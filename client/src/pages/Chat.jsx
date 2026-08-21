import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus, MessageSquare, Hash, X } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import { getSocket } from '../lib/socket';

const getInitials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ─── Create Room Modal ────────────────────────────────────────────────────────
const CreateRoomModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim() });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-heading)' }}>Create study room</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Room name</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. React Study Group" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this room about?" />
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !name.trim()}>
              {loading ? 'Creating…' : 'Create room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ message, isOwn, showSender }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', marginBottom: '0.625rem' }}>
    {showSender && !isOwn && (
      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.25rem', marginLeft: '0.25rem' }}>
        {message.sender?.name}
      </span>
    )}
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
      {!isOwn && (
        <div className="avatar avatar-sm" style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
          {getInitials(message.sender?.name)}
        </div>
      )}
      <div
        style={{
          maxWidth: '65%',
          padding: '0.625rem 0.875rem',
          borderRadius: isOwn ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
          background: isOwn ? 'var(--color-primary)' : 'white',
          color: isOwn ? 'white' : 'var(--color-heading)',
          border: isOwn ? 'none' : '1px solid var(--color-border)',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}
      >
        {message.content}
      </div>
    </div>
    <span style={{
      fontSize: '0.7rem', color: 'var(--color-muted)',
      marginTop: '0.25rem',
      marginLeft: isOwn ? 0 : '2.5rem',
      marginRight: isOwn ? '0.25rem' : 0,
    }}>
      {formatTime(message.createdAt)}
    </span>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const Chat = () => {
  const { user } = useAuthStore();
  const {
    conversations, rooms, activeThread, messages,
    isLoadingConversations, isLoadingMessages,
    fetchConversations, openDirectMessage, openRoom,
    sendMessage, emitTyping, emitStopTyping, createRoom,
    typingUsers, setTyping,
  } = useChatStore();

  const [tab, setTab] = useState('dms'); // 'dms' | 'rooms'
  const [input, setInput] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const typingTimer = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    // Register typing listeners on socket
    const socket = getSocket();
    if (socket) {
      socket.on('typing', ({ userId: tid }) => setTyping(tid, true));
      socket.on('stop_typing', ({ userId: tid }) => setTyping(tid, false));
    }
    return () => {
      const s = getSocket();
      if (s) { s.off('typing'); s.off('stop_typing'); }
    };
  }, [fetchConversations, setTyping]);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInput = useCallback((e) => {
    setInput(e.target.value);
    emitTyping();
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitStopTyping(), 1500);
  }, [emitTyping, emitStopTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    emitStopTyping();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const otherIsTyping = activeThread?.type === 'dm' && typingUsers[activeThread.id];

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - var(--topbar-height) - 4rem)', gap: '1.25rem' }}>
        {/* ── Left panel ──────────────────────────────────────── */}
        <div className="card" style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-sub)' }}>
            {['dms', 'rooms'].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '0.875rem 0', fontSize: '0.875rem', fontWeight: 600,
                color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)',
                borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
                background: 'transparent', cursor: 'pointer', border: 'none',
                borderBottomStyle: 'solid',
              }}>
                {t === 'dms' ? 'Direct' : 'Rooms'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {isLoadingConversations ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '3.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '0.375rem' }} />
              ))
            ) : tab === 'dms' ? (
              conversations.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-heading)' }}>No messages yet</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      Connect with peers from Discover to start chatting.
                    </div>
                  </div>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button key={conv.user._id} onClick={() => openDirectMessage(conv.user)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                    padding: '0.75rem 0.75rem', borderRadius: 'var(--radius-lg)', background: 'transparent',
                    border: activeThread?.id === conv.user._id ? '1.5px solid var(--color-primary-light)' : '1.5px solid transparent',
                    backgroundColor: activeThread?.id === conv.user._id ? 'var(--color-primary-light)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div className="avatar avatar-sm">{getInitials(conv.user.name)}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.user.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.lastMessage.isOwn ? 'You: ' : ''}{conv.lastMessage.content}
                      </div>
                    </div>
                  </button>
                ))
              )
            ) : (
              <>
                <button onClick={() => setShowCreateRoom(true)} className="btn btn-secondary btn-sm" style={{ width: '100%', marginBottom: '0.5rem', justifyContent: 'center' }}>
                  <Plus size={14} /> New room
                </button>
                {rooms.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.8125rem', lineHeight: 1.4 }}>
                    No rooms yet. Create a study room to chat with multiple peers!
                  </div>
                ) : (
                  rooms.map((room) => (
                    <button key={room._id} onClick={() => openRoom(room)} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                      padding: '0.75rem', borderRadius: 'var(--radius-lg)', background: 'transparent',
                      border: activeThread?.id === room._id ? '1.5px solid var(--color-primary-light)' : '1.5px solid transparent',
                      backgroundColor: activeThread?.id === room._id ? 'var(--color-primary-light)' : 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                      <Hash size={16} color="var(--color-muted)" style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{room.members?.length} member{room.members?.length !== 1 ? 's' : ''}</div>
                      </div>
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right panel ─────────────────────────────────────── */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!activeThread ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={22} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-heading)', margin: 0 }}>
                Select a conversation
              </h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', textAlign: 'center', maxWidth: '320px', margin: 0, lineHeight: 1.5 }}>
                Choose a direct message from the left or join a study room to start chatting in real-time.
              </p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border-sub)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {activeThread.type === 'dm'
                  ? <div className="avatar avatar-md">{getInitials(activeThread.name)}</div>
                  : <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Hash size={16} color="var(--color-primary)" /></div>
                }
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-heading)', fontSize: '1rem' }}>{activeThread.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{activeThread.type === 'dm' ? 'Direct message' : 'Study room'}</div>
                </div>
              </div>

              {/* Messages area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                {isLoadingMessages ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-muted)' }}>Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: '3rem', fontSize: '0.9rem' }}>
                    No messages yet. Say hello! 👋
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
                    const showSender = activeThread.type === 'room' && !isOwn;
                    return <MessageBubble key={msg._id || i} message={msg} isOwn={isOwn} showSender={showSender} />;
                  })
                )}
                {otherIsTyping && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                    {activeThread.name} is typing…
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border-sub)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <textarea
                  id="chat-message-input"
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send)"
                  rows={1}
                  style={{
                    flex: 1, resize: 'none', padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--color-border)',
                    fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                    background: 'var(--color-page-bg)', color: 'var(--color-heading)',
                    lineHeight: 1.5, maxHeight: '120px', overflowY: 'auto',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                />
                <button
                  id="chat-send-btn"
                  onClick={handleSend}
                  className="btn btn-primary btn-icon"
                  disabled={!input.trim()}
                  style={{ padding: '0.625rem', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}
                >
                  <Send size={17} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} onCreate={createRoom} />
      )}
    </DashboardLayout>
  );
};

export default Chat;

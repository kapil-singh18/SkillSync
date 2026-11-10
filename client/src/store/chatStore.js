import { create } from 'zustand';
import { nanoid } from 'nanoid';
import * as chatApi from '../api/chat';
import { connectSocket, disconnectSocket, getSocket, emitWithAck } from '../lib/socket';
import useToastStore from './toastStore';
import useAuthStore from './authStore';

// nanoid is not installed — use a simple fallback
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const toast = (type, message) => useToastStore.getState().addToast({ type, message });

const useChatStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  conversations: [],       // DM list
  rooms: [],               // my rooms
  activeChat: null,        // { type: 'dm'|'room', id } where id is userId or roomId
  messagesByChat: {},      // chatKey → Message[]
  hasMoreByChat: {},       // chatKey → boolean
  unreadTotal: 0,
  presence: {},            // userId → boolean (online)
  typing: {},              // chatKey → Set of userIds
  connectionState: 'offline', // 'connected' | 'reconnecting' | 'offline'
  roomDetails: {},         // roomId → full room object

  // ── Socket init ───────────────────────────────────────────────────────────
  initSocket: () => {
    const token = localStorage.getItem('skillsync-token');
    if (!token) return;

    const socket = connectSocket(token);

    socket.on('connect', () => {
      set({ connectionState: 'connected' });

      // Re-join active room if any
      const { activeChat } = get();
      if (activeChat?.type === 'room') {
        emitWithAck('room:join', { roomId: activeChat.id });
      }
    });

    socket.on('disconnect', () => set({ connectionState: 'offline' }));
    socket.on('connect_error', () => set({ connectionState: 'reconnecting' }));
    socket.on('reconnecting', () => set({ connectionState: 'reconnecting' }));

    // ── Incoming DM ──────────────────────────────────────────────────────────
    socket.on('dm:new', ({ message, conversationId }) => {
      const me = useAuthStore.getState().user;
      const otherId = String(message.sender?._id || message.sender) === String(me?._id)
        ? undefined
        : String(message.sender?._id || message.sender);

      const chatKey = `dm:${otherId || conversationId}`;
      const { activeChat, messagesByChat, conversations } = get();

      // Append to messages
      const existing = messagesByChat[chatKey] || [];
      const isDup = existing.some((m) => String(m._id) === String(message._id));
      if (!isDup) {
        set((s) => ({
          messagesByChat: {
            ...s.messagesByChat,
            [chatKey]: [...(s.messagesByChat[chatKey] || []), { ...message, status: 'sent' }],
          },
        }));
      }

      // Update conversation list
      const isMine = String(message.sender?._id || message.sender) === String(me?._id);
      const isActiveConv = activeChat?.type === 'dm' && activeChat?.id === otherId;

      set((s) => {
        const updated = s.conversations.map((c) => {
          if (!otherId) return c;
          if (String(c.other?._id) === otherId) {
            return {
              ...c,
              lastMessage: { text: message.text, sender: message.sender, createdAt: message.createdAt },
              unread: isMine || isActiveConv ? 0 : (c.unread || 0) + 1,
            };
          }
          return c;
        });
        return {
          conversations: updated,
          unreadTotal: updated.reduce((n, c) => n + (c.unread || 0), 0),
        };
      });

      // Mark read if this chat is active
      if (isActiveConv && otherId) {
        chatApi.markDMRead(otherId).catch(() => {});
      }
    });

    // ── Incoming room message ────────────────────────────────────────────────
    socket.on('room:new', ({ message, roomId }) => {
      const chatKey = `room:${roomId}`;
      set((s) => {
        const existing = s.messagesByChat[chatKey] || [];
        // Replace optimistic temp message if clientId matches
        const idx = message.clientId
          ? existing.findIndex((m) => m.clientId === message.clientId && m.status === 'sending')
          : -1;

        let updated;
        if (idx >= 0) {
          updated = [...existing];
          updated[idx] = { ...message, status: 'sent' };
        } else {
          const isDup = existing.some((m) => String(m._id) === String(message._id));
          updated = isDup ? existing : [...existing, { ...message, status: 'sent' }];
        }

        return {
          messagesByChat: { ...s.messagesByChat, [chatKey]: updated },
          rooms: s.rooms.map((r) =>
            String(r._id) === String(roomId)
              ? { ...r, lastMessage: { text: message.text, sender: message.sender, createdAt: message.createdAt } }
              : r
          ),
        };
      });
    });

    // ── Message deleted ──────────────────────────────────────────────────────
    socket.on('message:deleted', ({ messageId }) => {
      set((s) => {
        const updated = {};
        for (const [key, msgs] of Object.entries(s.messagesByChat)) {
          updated[key] = msgs.map((m) =>
            String(m._id) === String(messageId) ? { ...m, text: '', deleted: true } : m
          );
        }
        return { messagesByChat: updated };
      });
    });

    // ── Typing ───────────────────────────────────────────────────────────────
    socket.on('typing', ({ scope, fromUserId, roomId, isTyping }) => {
      const chatKey = scope === 'dm' ? `dm:${fromUserId}` : `room:${roomId}`;
      set((s) => {
        const current = new Set(s.typing[chatKey] || []);
        if (isTyping) current.add(fromUserId);
        else current.delete(fromUserId);
        return { typing: { ...s.typing, [chatKey]: current } };
      });
    });

    // ── Presence ─────────────────────────────────────────────────────────────
    socket.on('presence:update', ({ userId, online }) => {
      set((s) => ({ presence: { ...s.presence, [String(userId)]: online } }));
    });
  },

  destroySocket: () => {
    const socket = getSocket();
    if (socket) {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('dm:new');
      socket.off('room:new');
      socket.off('message:deleted');
      socket.off('typing');
      socket.off('presence:update');
    }
    disconnectSocket();
    set({ connectionState: 'offline' });
  },

  // ── Load conversations ────────────────────────────────────────────────────
  loadConversations: async () => {
    try {
      const { data } = await chatApi.getConversations();
      const convs = data.conversations || [];
      set({
        conversations: convs,
        unreadTotal: convs.reduce((n, c) => n + (c.unread || 0), 0),
      });
    } catch {
      toast('error', 'Failed to load conversations.');
    }
  },

  // ── Load my rooms ─────────────────────────────────────────────────────────
  loadMyRooms: async () => {
    try {
      const { data } = await chatApi.getMyRooms();
      set({ rooms: data.rooms || [] });
    } catch {
      toast('error', 'Failed to load rooms.');
    }
  },

  // ── Open a chat ────────────────────────────────────────────────────────────
  openChat: async (type, id) => {
    const prevActive = get().activeChat;

    // Leave previous room socket channel
    if (prevActive?.type === 'room') {
      emitWithAck('room:leave', { roomId: prevActive.id });
    }

    set({ activeChat: { type, id } });
    const chatKey = `${type}:${id}`;

    // Load messages if not already loaded
    if (!get().messagesByChat[chatKey]) {
      await get().loadMessages(type, id);
    }

    // Join room socket channel
    if (type === 'room') {
      await emitWithAck('room:join', { roomId: id });
    }

    // Mark DM read
    if (type === 'dm') {
      await chatApi.markDMRead(id).catch(() => {});
      set((s) => ({
        conversations: s.conversations.map((c) =>
          String(c.other?._id) === String(id) ? { ...c, unread: 0 } : c
        ),
        unreadTotal: Math.max(0, s.unreadTotal - (s.conversations.find((c) => String(c.other?._id) === String(id))?.unread || 0)),
      }));
    }
  },

  // ── Load messages (initial or paginated) ──────────────────────────────────
  loadMessages: async (type, id, before = null) => {
    const chatKey = `${type}:${id}`;
    try {
      let data;
      if (type === 'dm') {
        const res = await chatApi.getDMMessages(id, { before, limit: 30 });
        data = res.data;
      } else {
        const res = await chatApi.getRoomMessages(id, { before, limit: 30 });
        data = res.data;
      }
      const msgs = data.messages || [];
      set((s) => ({
        messagesByChat: before
          ? { ...s.messagesByChat, [chatKey]: [...msgs, ...(s.messagesByChat[chatKey] || [])] }
          : { ...s.messagesByChat, [chatKey]: msgs },
        hasMoreByChat: { ...s.hasMoreByChat, [chatKey]: data.hasMore },
      }));
    } catch {
      toast('error', 'Failed to load messages.');
    }
  },

  // ── Load older messages ───────────────────────────────────────────────────
  loadOlder: async (type, id) => {
    const chatKey = `${type}:${id}`;
    const msgs = get().messagesByChat[chatKey] || [];
    const oldest = msgs[0];
    if (!oldest || !get().hasMoreByChat[chatKey]) return;
    await get().loadMessages(type, id, oldest._id);
  },

  // ── Send message (optimistic) ─────────────────────────────────────────────
  sendMessage: async (type, targetId, text) => {
    const me = useAuthStore.getState().user;
    const chatKey = `${type}:${targetId}`;
    const clientId = uid();

    const optimistic = {
      _id: `opt-${clientId}`,
      clientId,
      sender: me,
      text,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatKey]: [...(s.messagesByChat[chatKey] || []), optimistic],
      },
    }));

    const event = type === 'dm' ? 'dm:send' : 'room:send';
    const payload = type === 'dm'
      ? { toUserId: targetId, text, clientId }
      : { roomId: targetId, text, clientId };

    const result = await emitWithAck(event, payload);

    if (result.ok) {
      // Replace optimistic with confirmed
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatKey]: (s.messagesByChat[chatKey] || []).map((m) =>
            m.clientId === clientId ? { ...result.data, status: 'sent' } : m
          ),
        },
      }));
    } else {
      // Mark as failed
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatKey]: (s.messagesByChat[chatKey] || []).map((m) =>
            m.clientId === clientId ? { ...m, status: 'failed' } : m
          ),
        },
      }));
      toast('error', result.error === 'no_connection' ? 'No accepted connection with this user.' : 'Failed to send message.');
    }
  },

  // ── Retry failed message ──────────────────────────────────────────────────
  retryMessage: async (type, targetId, clientId, text) => {
    const chatKey = `${type}:${targetId}`;
    // Update status back to sending
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatKey]: (s.messagesByChat[chatKey] || []).map((m) =>
          m.clientId === clientId ? { ...m, status: 'sending' } : m
        ),
      },
    }));

    const event = type === 'dm' ? 'dm:send' : 'room:send';
    const payload = type === 'dm'
      ? { toUserId: targetId, text, clientId }
      : { roomId: targetId, text, clientId };

    const result = await emitWithAck(event, payload);
    if (result.ok) {
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatKey]: (s.messagesByChat[chatKey] || []).map((m) =>
            m.clientId === clientId ? { ...result.data, status: 'sent' } : m
          ),
        },
      }));
    } else {
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatKey]: (s.messagesByChat[chatKey] || []).map((m) =>
            m.clientId === clientId ? { ...m, status: 'failed' } : m
          ),
        },
      }));
    }
  },

  // ── Delete message ────────────────────────────────────────────────────────
  deleteMessage: async (messageId) => {
    try {
      await chatApi.deleteMessage(messageId);
      // The socket event 'message:deleted' will update the UI
    } catch (err) {
      toast('error', err?.message || 'Failed to delete message.');
    }
  },

  // ── Rooms ─────────────────────────────────────────────────────────────────
  createRoom: async (data) => {
    try {
      const res = await chatApi.createRoom(data);
      const room = res.data.room;
      set((s) => ({ rooms: [room, ...s.rooms] }));
      toast('success', `Room "${room.name}" created!`);
      return { success: true, room };
    } catch (err) {
      toast('error', err?.message || 'Failed to create room.');
      return { success: false };
    }
  },

  joinRoom: async (roomId) => {
    try {
      await chatApi.joinRoom(roomId);
      await get().loadMyRooms();
      toast('success', 'Joined room!');
      return { success: true };
    } catch (err) {
      toast('error', err?.message || 'Failed to join room.');
      return { success: false };
    }
  },

  joinByCode: async (code) => {
    try {
      const res = await chatApi.joinByCode(code);
      await get().loadMyRooms();
      toast('success', 'Joined room!');
      return { success: true, roomId: res.data.roomId };
    } catch (err) {
      toast('error', err?.message || 'Invalid invite code.');
      return { success: false };
    }
  },

  leaveRoom: async (roomId) => {
    try {
      await chatApi.leaveRoom(roomId);
      set((s) => ({ rooms: s.rooms.filter((r) => String(r._id) !== String(roomId)) }));
      if (get().activeChat?.id === String(roomId)) set({ activeChat: null });
      toast('info', 'Left room.');
    } catch (err) {
      toast('error', err?.message || 'Failed to leave room.');
    }
  },

  loadRoomDetails: async (roomId) => {
    try {
      const { data } = await chatApi.getRoom(roomId);
      set((s) => ({ roomDetails: { ...s.roomDetails, [String(roomId)]: data.room } }));
      return data.room;
    } catch {
      return null;
    }
  },

  // ── Typing indicator (throttled at call site) ─────────────────────────────
  sendTyping: (type, targetId, isTyping) => {
    const socket = getSocket();
    if (!socket?.connected) return;
    socket.emit('typing', { scope: type, targetId, isTyping });
  },

  // ── Presence ──────────────────────────────────────────────────────────────
  fetchPresence: async (userIds) => {
    if (!userIds.length) return;
    try {
      const { data } = await chatApi.getPresence(userIds);
      set((s) => ({ presence: { ...s.presence, ...data.presence } }));
    } catch {
      // non-fatal
    }
  },
}));

export default useChatStore;


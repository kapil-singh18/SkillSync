import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import * as chatApi from '../api/chatApi';

const useChatStore = create((set, get) => ({
  conversations: [],
  rooms: [],
  activeThread: null,   // { type: 'dm' | 'room', id, name }
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  typingUsers: {},      // keyed by userId or roomId
  error: null,

  // ── Fetch conversations list ────────────────────────────────
  fetchConversations: async () => {
    set({ isLoadingConversations: true, error: null });
    try {
      const [convRes, roomRes] = await Promise.all([
        chatApi.getConversations(),
        chatApi.getRooms(),
      ]);
      set({
        conversations: convRes.data.conversations,
        rooms: roomRes.data.rooms,
        isLoadingConversations: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load chats', isLoadingConversations: false });
    }
  },

  // ── Select a DM thread ──────────────────────────────────────
  openDirectMessage: async (user) => {
    set({ activeThread: { type: 'dm', id: user._id, name: user.name }, messages: [], isLoadingMessages: true });
    try {
      const res = await chatApi.getDirectMessages(user._id);
      set({ messages: res.data.messages, isLoadingMessages: false });
    } catch {
      set({ isLoadingMessages: false });
    }

    // Subscribe to incoming DMs via socket
    const socket = getSocket();
    if (!socket) return;

    socket.off('new_direct_message');
    socket.on('new_direct_message', (msg) => {
      const { activeThread } = get();
      if (
        activeThread?.type === 'dm' &&
        (msg.sender._id === activeThread.id || msg.receiver === activeThread.id)
      ) {
        set((s) => ({ messages: [...s.messages, msg] }));
      }
    });
  },

  // ── Select a room thread ────────────────────────────────────
  openRoom: async (room) => {
    set({ activeThread: { type: 'room', id: room._id, name: room.name }, messages: [], isLoadingMessages: true });
    try {
      const res = await chatApi.getRoomMessages(room._id);
      set({ messages: res.data.messages, isLoadingMessages: false });
    } catch {
      set({ isLoadingMessages: false });
    }

    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_room', { roomId: room._id });

    socket.off('new_room_message');
    socket.on('new_room_message', (msg) => {
      const { activeThread } = get();
      if (activeThread?.type === 'room' && msg.room === activeThread.id) {
        set((s) => ({ messages: [...s.messages, msg] }));
      }
    });
  },

  // ── Send message ────────────────────────────────────────────
  sendMessage: (content) => {
    const { activeThread } = get();
    if (!activeThread || !content.trim()) return;

    const socket = getSocket();
    if (!socket) return;

    if (activeThread.type === 'dm') {
      socket.emit('send_direct_message', { receiverId: activeThread.id, content });
    } else {
      socket.emit('send_room_message', { roomId: activeThread.id, content });
    }
  },

  // ── Typing indicators ───────────────────────────────────────
  emitTyping: () => {
    const { activeThread } = get();
    const socket = getSocket();
    if (!socket || !activeThread) return;
    if (activeThread.type === 'dm') socket.emit('typing', { receiverId: activeThread.id });
    else socket.emit('typing', { roomId: activeThread.id });
  },

  emitStopTyping: () => {
    const { activeThread } = get();
    const socket = getSocket();
    if (!socket || !activeThread) return;
    if (activeThread.type === 'dm') socket.emit('stop_typing', { receiverId: activeThread.id });
    else socket.emit('stop_typing', { roomId: activeThread.id });
  },

  setTyping: (userId, isTyping) => {
    set((s) => ({
      typingUsers: { ...s.typingUsers, [userId]: isTyping },
    }));
  },

  // ── Create room ─────────────────────────────────────────────
  createRoom: async ({ name, description }) => {
    const res = await chatApi.createRoom({ name, description });
    set((s) => ({ rooms: [res.data.room, ...s.rooms] }));
    return res.data.room;
  },

  clearError: () => set({ error: null }),
}));

export default useChatStore;

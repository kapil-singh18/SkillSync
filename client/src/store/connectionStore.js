import { create } from 'zustand';
import * as connectionApi from '../api/connections';
import useToastStore from './toastStore';

const useConnectionStore = create((set, get) => ({
  incoming: [],
  outgoing: [],
  accepted: [],
  statusByUser: {}, // userId → { status, connection }
  isLoading: false,

  // ── Fetch all connection data ────────────────────────────────────────────────
  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const [incRes, outRes, accRes] = await Promise.all([
        connectionApi.getIncomingRequests(),
        connectionApi.getOutgoingRequests(),
        connectionApi.getConnections({ status: 'accepted' }),
      ]);
      set({
        incoming: incRes.data.requests || [],
        outgoing: outRes.data.requests || [],
        accepted: accRes.data.connections || [],
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      useToastStore.getState().addToast({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to load connections.',
      });
    }
  },

  // ── Fetch relationship status with one user ──────────────────────────────────
  fetchStatus: async (userId) => {
    try {
      const { data } = await connectionApi.getConnectionStatus(userId);
      set((s) => ({
        statusByUser: { ...s.statusByUser, [String(userId)]: { status: data.status, connection: data.connection } },
      }));
      return data;
    } catch {
      return { status: 'none', connection: null };
    }
  },

  // ── Send request (optimistic) ────────────────────────────────────────────────
  sendRequest: async ({ userId, type, message }) => {
    try {
      const { data } = await connectionApi.sendConnectionRequest({ userId, type, message });
      // Update statusByUser optimistically
      set((s) => ({
        statusByUser: {
          ...s.statusByUser,
          [String(userId)]: { status: 'pending_sent', connection: data.connection },
        },
        outgoing: [data.connection, ...s.outgoing],
      }));
      useToastStore.getState().addToast({ type: 'success', message: 'Request sent!' });
      return { success: true, connection: data.connection };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to send request.';
      useToastStore.getState().addToast({ type: 'error', message: msg });
      return { success: false, message: msg };
    }
  },

  // ── Accept incoming request ──────────────────────────────────────────────────
  accept: async (connectionId) => {
    // Optimistic: move from incoming → accepted
    const prevIncoming = get().incoming;
    const conn = prevIncoming.find((c) => String(c._id) === String(connectionId));
    if (!conn) return;

    set((s) => ({
      incoming: s.incoming.filter((c) => String(c._id) !== String(connectionId)),
      accepted: [{ ...conn, status: 'accepted' }, ...s.accepted],
      statusByUser: {
        ...s.statusByUser,
        [String(conn.requester?._id || conn.requester)]: { status: 'connected', connection: { ...conn, status: 'accepted' } },
      },
    }));

    try {
      const { data } = await connectionApi.acceptRequest(connectionId);
      useToastStore.getState().addToast({ type: 'success', message: 'Connection accepted!' });
      return { success: true, connection: data.connection };
    } catch (err) {
      // Rollback
      set((s) => ({
        incoming: [conn, ...s.incoming],
        accepted: s.accepted.filter((c) => String(c._id) !== String(connectionId)),
      }));
      useToastStore.getState().addToast({ type: 'error', message: err?.response?.data?.message || 'Failed to accept.' });
      return { success: false };
    }
  },

  // ── Decline incoming request ─────────────────────────────────────────────────
  decline: async (connectionId) => {
    const prevIncoming = get().incoming;
    set((s) => ({ incoming: s.incoming.filter((c) => String(c._id) !== String(connectionId)) }));

    try {
      await connectionApi.declineRequest(connectionId);
      useToastStore.getState().addToast({ type: 'info', message: 'Request declined.' });
      return { success: true };
    } catch (err) {
      set({ incoming: prevIncoming });
      useToastStore.getState().addToast({ type: 'error', message: err?.response?.data?.message || 'Failed to decline.' });
      return { success: false };
    }
  },

  // ── Cancel outgoing request ──────────────────────────────────────────────────
  cancel: async (connectionId) => {
    const prevOutgoing = get().outgoing;
    set((s) => ({ outgoing: s.outgoing.filter((c) => String(c._id) !== String(connectionId)) }));

    try {
      await connectionApi.cancelRequest(connectionId);
      useToastStore.getState().addToast({ type: 'info', message: 'Request cancelled.' });
      return { success: true };
    } catch (err) {
      set({ outgoing: prevOutgoing });
      useToastStore.getState().addToast({ type: 'error', message: err?.response?.data?.message || 'Failed to cancel.' });
      return { success: false };
    }
  },

  // ── Remove accepted connection ───────────────────────────────────────────────
  remove: async (connectionId) => {
    const prevAccepted = get().accepted;
    const conn = prevAccepted.find((c) => String(c._id) === String(connectionId));
    set((s) => ({ accepted: s.accepted.filter((c) => String(c._id) !== String(connectionId)) }));

    try {
      await connectionApi.removeConnection(connectionId);
      if (conn) {
        const otherId = String(conn.requester?._id || conn.requester);
        const myId = String(conn.recipient?._id || conn.recipient);
        const otherUserId = otherId !== myId ? otherId : myId;
        set((s) => ({
          statusByUser: { ...s.statusByUser, [otherUserId]: { status: 'none', connection: null } },
        }));
      }
      useToastStore.getState().addToast({ type: 'info', message: 'Connection removed.' });
      return { success: true };
    } catch (err) {
      set({ accepted: prevAccepted });
      useToastStore.getState().addToast({ type: 'error', message: err?.response?.data?.message || 'Failed to remove.' });
      return { success: false };
    }
  },

  // ── Update status locally (after sending a request from PublicProfile) ───────
  setStatus: (userId, status, connection) => {
    set((s) => ({
      statusByUser: { ...s.statusByUser, [String(userId)]: { status, connection } },
    }));
  },
}));

export default useConnectionStore;


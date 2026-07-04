import { create } from 'zustand';
import type { ChatMessage, ChatSession, ChatSessionDetail } from '../types/models';
import api from '../lib/axios';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  sessionDetailsById: Record<string, ChatSessionDetail>;
  isLoading: boolean;
  fetchSessions: () => Promise<void>;
  fetchSessionDetail: (id: string) => Promise<ChatSessionDetail | null>;
  createSession: () => Promise<string | null>;
  deleteSession: (id: string) => Promise<void>;
  setActiveSession: (id: string | null) => void;
  setSessionMessages: (id: string, messages: ChatMessage[]) => void;
  upsertSession: (session: ChatSession) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  activeSessionId: null,
  sessionDetailsById: {},
  isLoading: false,

  fetchSessions: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/chat/sessions');
      set({ sessions: res.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch sessions', error);
      set({ isLoading: false });
    }
  },

  fetchSessionDetail: async (id) => {
    try {
      const res = await api.get(`/chat/sessions/${id}`);
      const detail = res.data as ChatSessionDetail;
      set((state) => ({
        sessionDetailsById: {
          ...state.sessionDetailsById,
          [id]: detail,
        },
      }));
      return detail;
    } catch (error) {
      console.error('Failed to fetch session detail', error);
      return null;
    }
  },

  createSession: async () => {
    try {
      const res = await api.post('/chat/sessions');
      const newSession = res.data as ChatSession;
      set((state) => ({
        sessions: [newSession, ...state.sessions],
        activeSessionId: newSession.id,
      }));
      return newSession.id;
    } catch (error) {
      console.error('Failed to create session', error);
      return null;
    }
  },

  deleteSession: async (id) => {
    try {
      await api.delete(`/chat/sessions/${id}`);
      set((state) => {
        const filtered = state.sessions.filter((session) => session.id !== id);
        const details = { ...state.sessionDetailsById };
        delete details[id];

        return {
          sessions: filtered,
          sessionDetailsById: details,
          activeSessionId:
            state.activeSessionId === id ? filtered[0]?.id ?? null : state.activeSessionId,
        };
      });
    } catch (error) {
      console.error('Failed to delete session', error);
    }
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  setSessionMessages: (id, messages) =>
    set((state) => {
      const existing = state.sessionDetailsById[id];
      return {
        sessionDetailsById: {
          ...state.sessionDetailsById,
          [id]: existing
            ? { ...existing, messages, message_count: messages.length }
            : {
                id,
                title: 'Session',
                message_count: messages.length,
                created_at: '',
                updated_at: '',
                messages,
              },
        },
      };
    }),

  upsertSession: (session) =>
    set((state) => {
      const existingIndex = state.sessions.findIndex((item) => item.id === session.id);
      if (existingIndex === -1) {
        return { sessions: [session, ...state.sessions] };
      }

      const next = [...state.sessions];
      next[existingIndex] = { ...next[existingIndex], ...session };
      return { sessions: next };
    }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ChatSession, ChatSessionDetail } from '../types/models';
import type { PinSessionRequest } from '../types/api';
import api from '../lib/axios';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  sessionDetailsById: Record<string, ChatSessionDetail>;
  isLoading: boolean;
  isSidebarCollapsed: boolean;
  isRightSidebarOpen: boolean;
  detailModalSessionId: string | null;
  
  fetchSessions: () => Promise<void>;
  fetchSessionDetail: (id: string) => Promise<ChatSessionDetail | null>;
  createSession: () => Promise<string | null>;
  deleteSession: (id: string) => Promise<void>;
  togglePin: (id: string, isPinned: boolean) => Promise<void>;
  setActiveSession: (id: string | null) => void;
  setSessionMessages: (id: string, messages: ChatMessage[]) => void;
  upsertSession: (session: ChatSession) => void;
  updateSessionTitle: (id: string, title: string) => Promise<void>;
  updateSessionTitleLocally: (id: string, title: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleRightSidebar: () => void;
  openDetailModal: (id: string) => void;
  closeDetailModal: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,
      sessionDetailsById: {},
      isLoading: false,
      isSidebarCollapsed: false,
      isRightSidebarOpen: true,
      detailModalSessionId: null,

      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),
      toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
      
      openDetailModal: (id: string) => set({ detailModalSessionId: id }),
      closeDetailModal: () => set({ detailModalSessionId: null }),

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

      togglePin: async (id, isPinned) => {
        try {
          const body: PinSessionRequest = { is_pinned: isPinned };
          const res = await api.patch(`/chat/sessions/${id}/pin`, body);
          const updated = res.data as ChatSession;
          set((state) => {
            const sessions = state.sessions.map((s) =>
              s.id === id ? { ...s, is_pinned: updated.is_pinned } : s
            );
            return { sessions };
          });
        } catch (error) {
          console.error('Failed to toggle pin', error);
        }
      },

      updateSessionTitle: async (id, title) => {
        // Optimistic update
        set((state) => {
          const newSessions = state.sessions.map(s => s.id === id ? { ...s, title } : s);
          const newDetails = { ...state.sessionDetailsById };
          if (newDetails[id]) {
            newDetails[id] = { ...newDetails[id], title };
          }
          return { sessions: newSessions, sessionDetailsById: newDetails };
        });

        try {
          // If there's an API endpoint for renaming, call it here.
          // Fallback to existing endpoints or ignore if backend doesn't support yet.
          // await api.put(`/chat/sessions/${id}`, { title });
        } catch (error) {
          console.error('Failed to update title on server', error);
          // Revert optimistic update here if necessary
        }
      },

      updateSessionTitleLocally: (id, title) =>
        set((state) => {
          const sessions = state.sessions.map((s) =>
            s.id === id ? { ...s, title } : s
          );
          const details = { ...state.sessionDetailsById };
          if (details[id]) {
            details[id] = { ...details[id], title };
          }
          return { sessions, sessionDetailsById: details };
        }),

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
                    is_pinned: false,
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
    }),
    {
      name: 'sidebarCollapsed',
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed, isRightSidebarOpen: state.isRightSidebarOpen }),
    }
  )
);

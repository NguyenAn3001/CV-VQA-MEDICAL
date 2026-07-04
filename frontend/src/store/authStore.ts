import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, JwtPayload, User } from '../types/models';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  mustChangePassword: boolean;
  isAuthenticated: boolean;
  setAuth: (tokens: AuthTokens) => void;
  setUser: (user: User | null) => void;
  refreshAccessToken: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const decodeToken = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '='));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};

const userFromToken = (token: string): User | null => {
  const payload = decodeToken(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.sub ?? '',
    username: payload.username ?? 'User',
    email: payload.email ?? '',
    role: payload.role === 'admin' ? 'admin' : 'user',
    is_active: true,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      mustChangePassword: false,
      isAuthenticated: false,
      setAuth: ({ access_token, refresh_token, must_change_password }) =>
        set({
          accessToken: access_token,
          refreshToken: refresh_token,
          mustChangePassword: must_change_password,
          isAuthenticated: Boolean(access_token),
          user: userFromToken(access_token),
        }),
      setUser: (user) => set({ user }),
      refreshAccessToken: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken,
          refreshToken,
          isAuthenticated: Boolean(accessToken),
          user: state.user ?? userFromToken(accessToken),
        })),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          mustChangePassword: false,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

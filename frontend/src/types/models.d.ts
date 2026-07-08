export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  specialty?: string | null;
  must_change_password?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface JwtPayload {
  sub?: string;
  username?: string;
  email?: string;
  role?: 'user' | 'admin';
  exp?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  must_change_password: boolean;
}

export interface ChatToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string | null;
  toolsUsed?: ChatToolCall[];
  created_at?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  message_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
}

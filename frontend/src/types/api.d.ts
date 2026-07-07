export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  must_change_password: boolean;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  detail?: string;
}

export interface PredictionResponse {
  answer?: string;
  caption?: string;
  confidence?: number;
  inference_time_ms: number;
}

export interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  specialty: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  full_name?: string | null;
  bio?: string | null;
  specialty?: string | null;
}

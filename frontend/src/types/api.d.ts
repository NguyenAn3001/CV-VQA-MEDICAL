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

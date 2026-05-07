export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  isStreaming?: boolean;
  error?: boolean;
}

export interface ApiError {
  type: 'network' | 'rate_limit' | 'server' | 'validation';
  message: string;
  retryAfter?: number;
}

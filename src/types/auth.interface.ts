import type { UserOut } from './user.interface';

export interface TelegramAuthRequest {
  init_data: string;
  referrer_code?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserOut;
}

export interface TelegramAuthResponse extends AuthResponse {
  user_id?: number;
  is_new_user?: boolean;
}

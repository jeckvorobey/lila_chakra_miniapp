export interface UserOut {
  id: string | number;
  telegram_id: number;
  username?: string | null;
  first_name: string;
  last_name?: string | null;
  language_code?: string;
  language_code_app?: string | null;
  balance: number;
  photo_url?: string | null;

  // Telegram метаданные
  is_bot?: boolean;
  is_premium_telegram?: boolean;
  added_to_attachment_menu?: boolean;

  // Флаги и статус
  is_admin: boolean;
  is_premium?: boolean;
  has_seen_onboarding?: boolean;
  total_games?: number;
  completed_games?: number;
  referral_code?: string | null;
  created_at?: string;

  // Блокировки (ISO datetime string или null)
  blocked_at?: string | null;
  bot_blocked_at?: string | null;
  
  // Лимиты
  daily_moves_used?: number;
  daily_moves_limit?: number;
}

export interface UserStats {
  total_games: number;
  completed_games: number;
  highest_chakra_reached?: number;
  total_arrows_hit?: number;
  total_snakes_hit?: number;
}

export type UserProfile = UserOut;

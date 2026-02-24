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
  dice_mode?: 'auto' | 'manual';
  settings?: UserSettingsOut | null;

  created_at?: string;

  // Блокировки (ISO datetime string или null)
  blocked_at?: string | null;
  bot_blocked_at?: string | null;
}

export interface UserSettingsOut {
  chip_color?: string | null;
  chip_text_color?: string | null;
}

export interface UserStats {
  total_games: number;
  completed_games: number;
  highest_chakra_reached?: number;
  current_chakra?: number;
  has_active_game?: boolean;
  total_arrows_hit?: number;
  total_snakes_hit?: number;
}

export interface ReferralProgramTier {
  key: 'x2' | 'x5';
  required_referrals: number;
  required_uses: number;
  owner_reward_tkn: number;
  user_reward_tkn: number;
  can_generate: boolean;
  promo_code?: string | null;
  promo_status: 'not_generated' | 'active' | 'completed';
  promo_uses: number;
  promo_max_uses: number;
  owner_bonus_pending_tkn: number;
}

export interface ReferralProgramData {
  code?: string | null;
  link: string;
  total_referrals: number;
  programs: ReferralProgramTier[];
}

export type UserProfile = UserOut;

export interface UserUpdate {
  language_code_app?: string | null;
  dice_mode?: 'auto' | 'manual';
  has_seen_onboarding?: boolean;
  settings?: UserSettingsUpdate | null;
}

export interface UserSettingsUpdate {
  chip_color?: string | null;
  chip_text_color?: string | null;
}

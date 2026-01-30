/**
 * API types matching backend schemas.
 */

// Enums (lowercase to match backend StrEnum)
export type GameMode = 'free' | 'ai_incognito' | 'ai_guide';

export type GameStatus =
  | 'waiting_for_6'
  | 'in_progress'
  | 'in_waiting_zone'
  | 'completed'
  | 'abandoned';

export type QueryCategory =
  | 'personality'
  | 'career'
  | 'health'
  | 'finance'
  | 'relationships'
  | 'freedom';

export type TransitionType = 'none' | 'arrow' | 'snake';

// Cell schemas
export interface CellBrief {
  id: number;
  name_ru: string;
  chakra_level: number;
  chakra_name: string;
  affirmation_ru: string;
  transition_type: TransitionType;
  transition_to: number | null;
}

export interface CellOut {
  id: number;
  name_ru: string;
  name_en: string | null;
  name_sanskrit: string | null;
  chakra_level: number;
  chakra_name: string;
  description_ru: string;
  affirmation_ru: string;
  question_ru: string | null;
  keywords: string[] | null;
  audio_url: string | null;
  image_url: string | null;
  is_arrow_start: boolean;
  arrow_end: number | null;
  is_snake_head: boolean;
  snake_tail: number | null;
}

// Game schemas
export interface GameCreate {
  query: string;
  category: QueryCategory;
  mode?: GameMode;
}

export interface GameOut {
  id: number;
  user_id: number;
  query: string;
  category: QueryCategory;
  mode: GameMode;
  status: GameStatus;
  current_cell: number;
  entry_meditation_completed: boolean;
  exit_meditation_completed: boolean;
  total_moves: number;
  arrows_hit: number;
  snakes_hit: number;
  highest_cell: number;
  created_at: string;
  completed_at: string | null;
  magic_time_ends_at: string | null;
}

export interface GameDetail extends GameOut {
  ai_summary: string | null;
}

export interface GameBrief {
  id: number;
  query: string;
  category: QueryCategory;
  mode: GameMode;
  status: GameStatus;
  current_cell: number;
  total_moves: number;
  created_at: string;
  completed_at: string | null;
  magic_time_ends_at: string | null;
}

export interface GameListResponse {
  items: GameBrief[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

// Move schemas
export interface MoveOut {
  id: number;
  game_id: number;
  move_number: number;
  dice_rolls: number[];
  total_roll: number;
  is_triple_six: boolean;
  start_cell: number;
  end_cell: number;
  final_cell: number;
  transition_type: TransitionType;
  transition_from: number | null;
  transition_to: number | null;
  ai_interpretation: string | null;
  player_insight: string | null;
  created_at: string;
}

export interface MoveResponse {
  move: MoveOut;
  cell_info: CellBrief;
  game_status: GameStatus;
  requires_another_roll: boolean;
  is_entry_move: boolean;
  is_victory: boolean;
}

export interface DiceRollRequest {
  is_manual?: boolean;
  manual_value?: number;
}

export interface InsightCreate {
  insight: string;
}

// Auth schemas
export interface TelegramAuthRequest {
  init_data: string;
  referrer_code?: string;
}

export interface TelegramAuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  is_new_user: boolean;
}

// User schemas
export interface UserOut {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  language_code: string;
  balance: number;
  photo_url: string | null;
  is_admin: boolean;
  is_premium: boolean;
  has_seen_onboarding: boolean;
  total_games: number;
  completed_games: number;
  referral_code: string | null;
  created_at: string;
}

export interface UserStats {
  total_games: number;
  completed_games: number;
  highest_chakra_reached: number;
  total_arrows_hit: number;
  total_snakes_hit: number;
}

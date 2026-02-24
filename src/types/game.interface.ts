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

export interface ReflectionQuestions {
  relationships?: string;
  money?: string;
  career?: string;
}

export interface CellTransitionInfo {
  name?: string;
  description?: string;
}

export interface MultilingualText {
  [key: string]: string;
  ru: string;
  en: string;
}

export interface CellBrief {
  id: number;
  name_ru: string;
  chakra_level: number;
  chakra_name: string;
  transition_type: TransitionType;
  transition_to: number | null;
  description?: string | null;
  description_revisit?: string | null;
  questions_first?: ReflectionQuestions | null;
  questions_revisit?: ReflectionQuestions | null;
  reflection_questions?: ReflectionQuestions | null;
  visit_count?: number | null;
  is_revisit?: boolean | null;
}

export interface CellOut {
  id: number;
  name_ru: string;
  name_sanskrit: string | null;
  chakra_level: number;
  chakra_name: string;
  description_ru: string;
  question_ru: string | null;
  keywords: string[] | null;
  audio_url: string | null;
  image_url: string | null;
  is_arrow_start: boolean;
  arrow_end: number | null;
  is_snake_head: boolean;
  snake_tail: number | null;
}

export interface Cell {
  id: number;
  name: string;
  name_sanskrit?: string | null;
  chakra_level: number;
  description: string;
  description_revisit?: string | null;
  questions_first?: ReflectionQuestions | null;
  questions_revisit?: ReflectionQuestions | null;
  reflection_questions?: ReflectionQuestions | null;
  transition?: CellTransitionInfo | null;
  keywords?: string[] | null;
  audio_url?: string | null;
  image_url?: string | null;
  is_arrow_start?: boolean;
  arrow_end?: number | null;
  is_snake_head?: boolean;
  snake_tail?: number | null;
}

export interface CellReference {
  id: number;
  is_arrow_start: boolean;
  arrow_end: number | null;
  is_snake_head: boolean;
  snake_tail: number | null;
}

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
  entry_meditation_audio_url?: string | null;
  exit_meditation_audio_url?: string | null;
  total_moves: number;
  arrows_hit: number;
  snakes_hit: number;
  highest_cell: number;
  clarifications_used: number;
  created_at: string;
  completed_at: string | null;
  magic_time_ends_at: string | null;
}

export interface GameDetail extends GameOut {
  ai_summary: string | null;
}

export interface GameFinalePlanWindow {
  window: string;
  title: string;
  steps: string[];
}

export interface GameFinaleSummary {
  epic_summary: string;
  journey_highlights: string[];
  next_72h_plan: GameFinalePlanWindow[];
  parting_message: string;
  path_phrase: string;
  generated_at: string;
}

export interface GameFinaleImageArtifact {
  artifact_id: number;
  file_name: string;
  mime_type: string;
  generation_index: number;
  created_at: string;
}

export interface GameFinaleImageJob {
  job_id: string;
  game_id: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error: string | null;
  artifact_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface GameFinaleImageState {
  latest_artifact: GameFinaleImageArtifact | null;
  active_job: GameFinaleImageJob | null;
  free_generations_left: number;
}

export interface GameFinaleState {
  game_id: number;
  summary: GameFinaleSummary | null;
  image: GameFinaleImageState;
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

export interface MoveOut {
  id: number;
  game_id: number;
  move_number: number;
  dice_rolls: number[];
  is_triple_six: boolean;
  is_pending: boolean;
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

export interface IntermediateRollResponse {
  pending_move_id: number;
  dice_value: number;
  accumulated_rolls: number[];
  is_triple_six: boolean;
  requires_another_roll: true;
  message_key: string;
}

export interface MoveResponse {
  requires_another_roll: boolean;
  intermediate?: IntermediateRollResponse;
  move?: MoveOut;
  cell_info?: CellBrief;
  game_status?: GameStatus;
  is_entry_move: boolean;
  is_victory: boolean;
}

export interface DiceRollRequest {
  is_manual?: boolean;
  manual_value?: number;
  previous_manual_rolls?: number[];
}

export interface InsightCreate {
  insight: string;
}

export interface ClarificationRequest {
  question: string;
}

export interface ClarificationResponse {
  answer: string;
  cost_tkn: number;
  balance_tkn: number;
  free_left: number;
}

export interface AIInteractionOut {
  id: number;
  move_id: number | null;
  cell_id: number | null;
  interaction_type: string;
  ai_response: string;
  user_query: string | null;
  language: string;
  created_at: string;
}

export interface AIHistoryResponse {
  interactions: AIInteractionOut[];
}

export interface ClarificationHistoryItem {
  id: number;
  question: string;
  answer: string;
  cell_id: number | null;
  created_at: string;
}

export interface ClarificationHistoryResponse {
  items: ClarificationHistoryItem[];
}

export interface ClarificationStreamMetaEvent {
  type: 'meta';
  question: string;
  cost_tkn: number;
  balance_tkn: number;
  free_left: number;
}

export interface ClarificationStreamDeltaEvent {
  type: 'delta';
  text: string;
}

export interface ClarificationStreamDoneEvent {
  type: 'done';
  answer: string;
}

export interface ClarificationStreamErrorEvent {
  type: 'error';
  message: string;
}

export type ClarificationStreamEvent =
  | ClarificationStreamMetaEvent
  | ClarificationStreamDeltaEvent
  | ClarificationStreamDoneEvent
  | ClarificationStreamErrorEvent;

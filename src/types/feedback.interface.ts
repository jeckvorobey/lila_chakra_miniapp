export type FeedbackStatus = 'new' | 'processed' | 'in_progress' | 'completed' | 'rejected';
export type FeedbackCategory = 'bug' | 'feature' | 'ux' | 'other';
export type FeedbackPriority = 'low' | 'medium' | 'high';

export interface FeedbackRequestCreate {
  message: string;
  category?: FeedbackCategory;
  priority?: FeedbackPriority;
}

export interface FeedbackRequestOut {
  id: number;
  user_id: number;
  message: string;
  status: FeedbackStatus;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  admin_comment?: string | null;
  eta_at?: string | null;
  processed_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackListResponse {
  items: FeedbackRequestOut[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export type BalanceTransactionType = 'accrual' | 'deduction';

export type BalanceTransactionSource =
  | 'USER_PURCHASE'
  | 'ADMIN_GRANT'
  | 'PROMO_CODE'
  | 'REFERRAL_REWARD'
  | 'GAME_FEE'
  | 'AI_SERVICE_FEE'
  | 'REFUND';

export interface TransactionOut {
  id: number;
  type: BalanceTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  source: BalanceTransactionSource;
  description: string;
  created_at: string;
}

export interface TransactionListResponse {
  items: TransactionOut[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

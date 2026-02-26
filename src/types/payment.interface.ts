export interface PaymentPackage {
  amount_rub: number;
  amount_tkn: number;
  bonus_tkn: number;
  label: string;
  discount?: string;
}

export interface PaymentCreate {
  amount_rub: number;
  promo_code?: string | null;
}

export interface PaymentInitResponse {
  payment_id: number;
  confirmation_url: string;
  amount_rub: number;
  amount_tkn: number;
  bonus_tkn: number;
}

export interface PromoCodeApplyResponse {
  success: boolean;
  balance_added: number;
  new_balance: number;
  owner_bonus_released_tkn: number;
  owner_bonus_pending_tkn: number;
  message: string;
}

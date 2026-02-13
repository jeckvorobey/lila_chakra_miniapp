export interface PaymentPackage {
  amount_rub: number;
  amount_tkn: number;
  bonus_tkn: number;
  label: string;
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

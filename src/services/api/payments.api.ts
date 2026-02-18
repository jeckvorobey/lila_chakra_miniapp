import { api } from 'src/boot/axios';
import type {
  PaymentCreate,
  PaymentInitResponse,
  PaymentPackage,
  PromoCodeApplyResponse,
} from 'src/types/payment.interface';

/**
 * API платежей.
 */
export const paymentsApi = {
  /**
   * Получить пакеты пополнения.
   */
  async listPackages(): Promise<PaymentPackage[]> {
    const response = await api.get<PaymentPackage[]>('/payments/packages');
    return response.data;
  },

  /**
   * Создать платёж.
   */
  async createPayment(data: PaymentCreate): Promise<PaymentInitResponse> {
    const response = await api.post<PaymentInitResponse>('/payments/create', data);
    return response.data;
  },

  /**
   * Применить промокод.
   */
  async applyPromoCode(code: string): Promise<PromoCodeApplyResponse> {
    const response = await api.post<PromoCodeApplyResponse>('/payments/promo/apply', { code });
    return response.data;
  },
};

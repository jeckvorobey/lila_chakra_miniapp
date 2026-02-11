import { api } from 'src/boot/axios';
import type {
  PaymentCreate,
  PaymentInitResponse,
  PaymentPackage,
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
};

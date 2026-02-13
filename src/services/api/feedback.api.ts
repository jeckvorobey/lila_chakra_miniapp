import { api } from 'src/boot/axios';
import type {
  FeedbackListResponse,
  FeedbackRequestCreate,
  FeedbackRequestOut,
} from 'src/types/feedback.interface';

/**
 * API пользовательских обращений.
 */
export const feedbackApi = {
  /**
   * Создать новое обращение.
   */
  async createRequest(payload: FeedbackRequestCreate): Promise<FeedbackRequestOut> {
    const response = await api.post<FeedbackRequestOut>('/feedback/requests', payload);
    return response.data;
  },

  /**
   * Получить список обращений текущего пользователя.
   */
  async getMyRequests(params?: { offset?: number; limit?: number }): Promise<FeedbackListResponse> {
    const response = await api.get<FeedbackListResponse>('/feedback/requests/my', {
      params: {
        offset: params?.offset ?? 0,
        limit: params?.limit ?? 50,
      },
    });
    return response.data;
  },
};

import { api } from 'src/boot/axios';
import type { QuerySuggestionsRequest, QuerySuggestionsResponse } from 'src/types/ai.interface';

/**
 * API для генерации AI-подсказок формулировки запроса.
 */
export const aiApi = {
  /**
   * Сгенерировать 10 вариантов формулировки пользовательского запроса.
   */
  async generateQuerySuggestions(payload: QuerySuggestionsRequest): Promise<QuerySuggestionsResponse> {
    const response = await api.post<QuerySuggestionsResponse>('/ai/query-suggestions', payload);
    return response.data;
  },
};

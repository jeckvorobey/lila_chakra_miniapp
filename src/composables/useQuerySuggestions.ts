import { isAxiosError } from 'axios';
import { aiApi } from 'src/services/api';
import type { QueryCategory } from 'src/stores/game.store';

interface GenerateSuggestionsParams {
  draft: string;
  category: QueryCategory;
  count: number;
}

function normalizeDraft(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeSuggestionText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function mapApiErrorToMessage(error: unknown): string {
  if (!isAxiosError(error)) return 'errors.ai_suggestions_generation_failed';

  const detail = error.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim().length > 0) {
    return detail;
  }

  return 'errors.ai_suggestions_generation_failed';
}

export function useQuerySuggestions() {
  async function generateSuggestions(params: GenerateSuggestionsParams): Promise<string[]> {
    const draft = normalizeDraft(params.draft);
    if (!draft) return [];

    if (params.count !== 10) {
      throw new Error('errors.ai_suggestions_generation_failed');
    }

    try {
      const response = await aiApi.generateQuerySuggestions({
        draft,
        category: params.category,
        count: 10,
      });

      return response.suggestions
        .slice()
        .sort((left, right) => left.rank - right.rank)
        .map((item) => normalizeSuggestionText(item.text))
        .filter((item) => item.length > 0)
        .slice(0, params.count);
    } catch (error) {
      throw new Error(mapApiErrorToMessage(error));
    }
  }

  return {
    generateSuggestions,
  };
}

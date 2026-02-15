import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGenerateQuerySuggestions } = vi.hoisted(() => ({
  mockGenerateQuerySuggestions: vi.fn(),
}));

vi.mock('src/services/api', () => ({
  aiApi: {
    generateQuerySuggestions: mockGenerateQuerySuggestions,
  },
}));

import { useQuerySuggestions } from '../useQuerySuggestions';

describe('useQuerySuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('возвращает отсортированный список из ответа API', async () => {
    mockGenerateQuerySuggestions.mockResolvedValue({
      suggestions: [
        { rank: 2, text: 'Вариант 2' },
        { rank: 1, text: 'Вариант 1' },
        { rank: 3, text: 'Вариант 3' },
        { rank: 4, text: 'Вариант 4' },
        { rank: 5, text: 'Вариант 5' },
        { rank: 6, text: 'Вариант 6' },
        { rank: 7, text: 'Вариант 7' },
        { rank: 8, text: 'Вариант 8' },
        { rank: 9, text: 'Вариант 9' },
        { rank: 10, text: 'Вариант 10' },
      ],
    });

    const { generateSuggestions } = useQuerySuggestions();
    const result = await generateSuggestions({
      draft: 'Мне сложно выбрать направление',
      category: 'career',
      count: 10,
    });

    expect(result).toHaveLength(10);
    expect(result[0]).toBe('Вариант 1');
    expect(result[1]).toBe('Вариант 2');
    expect(mockGenerateQuerySuggestions).toHaveBeenCalledWith({
      draft: 'Мне сложно выбрать направление',
      category: 'career',
      count: 10,
    });
  });

  it('бросает ошибку с backend detail при неудачном запросе', async () => {
    mockGenerateQuerySuggestions.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          detail: 'errors.ai_suggestions_generation_failed',
        },
      },
    });

    const { generateSuggestions } = useQuerySuggestions();

    await expect(
      generateSuggestions({
        draft: 'Черновик',
        category: 'personality',
        count: 10,
      }),
    ).rejects.toThrow('errors.ai_suggestions_generation_failed');
  });
});

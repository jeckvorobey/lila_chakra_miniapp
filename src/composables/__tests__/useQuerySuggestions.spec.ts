import { describe, expect, it } from 'vitest';
import { useQuerySuggestions } from '../useQuerySuggestions';

describe('useQuerySuggestions', () => {
  it('возвращает 10 уникальных вариантов на русском языке', async () => {
    const { generateSuggestions } = useQuerySuggestions();

    const result = await generateSuggestions({
      draft: 'мне сложно выбрать направление',
      category: 'career',
      count: 10,
      locale: 'ru-RU',
    });

    expect(result).toHaveLength(10);
    expect(new Set(result).size).toBe(10);
    expect(result[0]).toContain('мне сложно выбрать направление');
  });

  it('генерирует варианты на английском при en locale', async () => {
    const { generateSuggestions } = useQuerySuggestions();

    const result = await generateSuggestions({
      draft: 'I feel stuck in my routine',
      category: 'personality',
      count: 10,
      locale: 'en-US',
    });

    expect(result).toHaveLength(10);
    expect(result.some((item) => item.startsWith('How'))).toBe(true);
  });
});

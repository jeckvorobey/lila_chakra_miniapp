import type { QueryCategory } from 'src/stores/game.store';

interface GenerateSuggestionsParams {
  draft: string;
  category: QueryCategory;
  count: number;
  locale?: string;
}

const RU_BY_CATEGORY: Record<QueryCategory, string[]> = {
  relationships: [
    'Как мне лучше понять, что происходит в отношениях, если {draft}?',
    'С какой стороны посмотреть на ситуацию в отношениях: {draft}?',
    'Какой главный вопрос мне задать себе про отношения, если {draft}?',
  ],
  career: [
    'Какой следующий карьерный шаг будет самым здоровым, если {draft}?',
    'Что сейчас важнее всего прояснить в работе, если {draft}?',
    'На чем сфокусироваться в карьере в ближайший месяц, если {draft}?',
  ],
  health: [
    'Какой самый бережный первый шаг к восстановлению, если {draft}?',
    'На какую привычку обратить внимание в первую очередь, если {draft}?',
    'Как мне поддержать себя физически и эмоционально, если {draft}?',
  ],
  finance: [
    'Какой практичный финансовый шаг сделать первым, если {draft}?',
    'Что мешает финансовой стабильности именно в ситуации: {draft}?',
    'Как сформулировать денежную цель реалистично, если {draft}?',
  ],
  freedom: [
    'Что ограничивает мою внутреннюю свободу в ситуации: {draft}?',
    'Как мне выбрать более свободный и живой вариант действия, если {draft}?',
    'Как отпустить контроль и сохранить опору, если {draft}?',
  ],
  personality: [
    'Какой внутренний паттерн проявляется в ситуации: {draft}?',
    'Какой мой сильный ресурс поможет пройти это, если {draft}?',
    'Какая точка роста скрыта в запросе: {draft}?',
  ],
};

const EN_BY_CATEGORY: Record<QueryCategory, string[]> = {
  relationships: [
    'How can I better understand my relationship dynamics if {draft}?',
    'What perspective would help me in this relationship situation: {draft}?',
    'What is the most important relationship question to ask myself if {draft}?',
  ],
  career: [
    'What is the healthiest next career step if {draft}?',
    'What should I clarify first at work in this situation: {draft}?',
    'What should I focus on this month in my career if {draft}?',
  ],
  health: [
    'What is the gentlest first step to recover my energy if {draft}?',
    'Which habit should I review first in this situation: {draft}?',
    'How can I support my body and mind better if {draft}?',
  ],
  finance: [
    'What practical money step should I take first if {draft}?',
    'What blocks my financial stability in this situation: {draft}?',
    'How can I phrase a realistic financial goal if {draft}?',
  ],
  freedom: [
    'What limits my inner freedom in this situation: {draft}?',
    'How can I choose a freer and more alive path forward if {draft}?',
    'How can I release control and stay grounded if {draft}?',
  ],
  personality: [
    'What inner pattern is showing up in this situation: {draft}?',
    'Which strength can help me move through this if {draft}?',
    'What growth edge is hidden in this request: {draft}?',
  ],
};

const RU_FALLBACK = [
  'Как сформулировать мой главный вопрос в ситуации: {draft}?',
  'Что для меня сейчас самое важное в этой истории: {draft}?',
  'Какой один шаг даст мне ясность, если {draft}?',
];

const EN_FALLBACK = [
  'How can I phrase my core question in this situation: {draft}?',
  'What matters most for me right now in this story: {draft}?',
  'What one step can bring clarity if {draft}?',
];

function normalizeDraft(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function isEnglishLocale(locale?: string): boolean {
  return Boolean(locale && locale.toLowerCase().startsWith('en'));
}

function pickCategoryTemplates(category: QueryCategory, locale?: string): string[] {
  return isEnglishLocale(locale) ? EN_BY_CATEGORY[category] : RU_BY_CATEGORY[category];
}

function pickFallbackTemplates(locale?: string): string[] {
  return isEnglishLocale(locale) ? EN_FALLBACK : RU_FALLBACK;
}

function formatTemplates(templates: string[], draft: string): string[] {
  return templates.map((template) => template.replace('{draft}', draft));
}

export function useQuerySuggestions() {
  function generateSuggestions(params: GenerateSuggestionsParams): Promise<string[]> {
    const draft = normalizeDraft(params.draft);
    if (!draft) return Promise.resolve([]);

    const categoryTemplates = pickCategoryTemplates(params.category, params.locale);
    const fallbackTemplates = pickFallbackTemplates(params.locale);

    const generated = [
      ...formatTemplates(categoryTemplates, draft),
      ...formatTemplates(fallbackTemplates, draft),
    ];

    const unique = Array.from(new Set(generated));
    if (unique.length >= params.count) {
      return Promise.resolve(unique.slice(0, params.count));
    }

    const refillBase = isEnglishLocale(params.locale)
      ? 'How can I understand this better: {draft}?'
      : 'Как мне глубже понять эту ситуацию: {draft}?';

    let index = 1;
    while (unique.length < params.count) {
      const suggestion = refillBase.replace('{draft}', draft);
      unique.push(`${suggestion} #${index}`);
      index += 1;
    }

    return Promise.resolve(unique);
  }

  return {
    generateSuggestions,
  };
}

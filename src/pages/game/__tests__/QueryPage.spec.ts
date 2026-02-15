import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import QueryPage from '../QueryPage.vue';

const {
  mockCreateGame,
  mockRouterPush,
  mockNotify,
  mockGenerateSuggestions,
} = vi.hoisted(() => ({
  mockCreateGame: vi.fn(),
  mockRouterPush: vi.fn(),
  mockNotify: vi.fn(),
  mockGenerateSuggestions: vi.fn(),
}));

const mockGameStore = {
  createGame: mockCreateGame,
};

vi.mock('src/stores/game.store', () => ({
  useGameStore: () => mockGameStore,
}));

vi.mock('src/composables/useQuerySuggestions', () => ({
  useQuerySuggestions: () => ({
    generateSuggestions: mockGenerateSuggestions,
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    tm: (key: string) =>
      key === 'query.examples_by_category'
        ? {
            personality: ['пример 1', 'пример 2'],
            career: ['пример 3'],
            relationships: ['пример 4'],
            health: ['пример 5'],
            finance: ['пример 6'],
            freedom: ['пример 7'],
          }
        : {},
    locale: ref('ru-RU'),
  }),
}));

vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar');
  return {
    ...actual,
    useQuasar: () => ({
      dark: { isActive: false },
      notify: mockNotify,
    }),
  };
});

const QInputStub = defineComponent({
  name: 'QInputStub',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  template:
    '<div><textarea data-testid="query-input" :value="modelValue" ' +
    '@input="$emit(\'update:modelValue\', $event.target.value)" />' +
    '<slot name="append" /></div>',
});

const QBtnStub = defineComponent({
  name: 'QBtnStub',
  props: {
    label: {
      type: String,
      default: '',
    },
    disable: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  template:
    '<button :data-label="label" :disabled="disable || loading" @click="$emit(\'click\')">{{ label }}</button>',
});

function mountPage() {
  return mount(QueryPage, {
    global: {
      mocks: {
        $t: (key: string) => key,
      },
      stubs: {
        'q-page': {
          template: '<div><slot /></div>',
        },
        'q-card': {
          template: '<div><slot /></div>',
        },
        'q-chip': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
        },
        'q-input': QInputStub,
        'q-list': {
          template: '<div><slot /></div>',
        },
        'q-item': {
          template: '<button class="q-item-stub" @click="$emit(\'click\')"><slot /></button>',
        },
        'q-item-section': {
          template: '<span><slot /></span>',
        },
        'q-item-label': {
          template: '<span><slot /></span>',
        },
        'q-icon': {
          template: '<span />',
        },
        'q-btn': QBtnStub,
        'q-banner': {
          template: '<div><slot /><slot name="action" /></div>',
        },
        'q-spinner-dots': {
          template: '<span />',
        },
      },
    },
  });
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function findButtonByLabel(wrapper: ReturnType<typeof mountPage>, label: string) {
  return wrapper.findAll('button').find((button) => button.attributes('data-label') === label);
}

describe('QueryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateGame.mockResolvedValue(true);
  });

  it('не дает запустить генерацию при вводе менее 5 символов', async () => {
    const wrapper = mountPage();
    const input = wrapper.get('[data-testid="query-input"]');

    await input.setValue('abcd');
    await flushPromises();

    const generateButton = findButtonByLabel(wrapper, 'query.assistant.generate');
    expect(generateButton).toBeDefined();
    expect(generateButton?.attributes('disabled')).toBeDefined();
  });

  it('по кнопке запрашивает 10 вариантов и отображает их списком', async () => {
    mockGenerateSuggestions.mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => `Вариант ${index + 1}`),
    );
    const wrapper = mountPage();

    await wrapper.get('[data-testid="query-input"]').setValue('Мне сложно сформулировать запрос');

    const generateButton = findButtonByLabel(wrapper, 'query.assistant.generate');
    expect(generateButton).toBeDefined();
    await generateButton?.trigger('click');
    await flushPromises();

    expect(mockGenerateSuggestions).toHaveBeenCalledWith({
      draft: 'Мне сложно сформулировать запрос',
      category: 'personality',
      count: 10,
      locale: 'ru-RU',
    });
    expect(wrapper.text()).toContain('Вариант 1');
    expect(wrapper.text()).toContain('Вариант 10');
  });

  it('подставляет выбранный вариант в поле запроса и активирует старт игры', async () => {
    mockGenerateSuggestions.mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => `Готовый запрос номер ${index + 1}`),
    );
    const wrapper = mountPage();

    await wrapper.get('[data-testid="query-input"]').setValue('Начальный текст');
    const generateButton = findButtonByLabel(wrapper, 'query.assistant.generate');
    await generateButton?.trigger('click');
    await flushPromises();

    const suggestionButton = wrapper
      .findAll('.q-item-stub')
      .find((item) => item.text().includes('Готовый запрос номер 2'));
    expect(suggestionButton).toBeDefined();
    await suggestionButton?.trigger('click');
    await flushPromises();

    const input = wrapper.get('[data-testid="query-input"]').element as HTMLTextAreaElement;
    expect(input.value).toBe('Готовый запрос номер 2');

    const startButton = findButtonByLabel(wrapper, 'query.start_game');
    expect(startButton).toBeDefined();
    expect(startButton?.attributes('disabled')).toBeUndefined();
    expect(mockNotify).toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'query.assistant.used_notify' }),
    );
  });
});

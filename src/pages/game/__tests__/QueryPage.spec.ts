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
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  template:
    '<div><textarea :data-testid="placeholder || \'query-input\'" :value="modelValue" ' +
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

  it('не дает отправить ситуацию при вводе менее 5 символов', async () => {
    const wrapper = mountPage();

    const describeButton = findButtonByLabel(wrapper, 'query.assistant.describe');
    expect(describeButton).toBeDefined();
    await describeButton?.trigger('click');

    const situationInput = wrapper.get('[data-testid="query.assistant.situation_placeholder"]');
    await situationInput.setValue('abcd');
    await flushPromises();

    const sendButton = findButtonByLabel(wrapper, 'query.assistant.send');
    expect(sendButton).toBeDefined();
    expect(sendButton?.attributes('disabled')).toBeDefined();
  });

  it('по кнопке отправляет ситуацию и отображает 10 вариантов', async () => {
    mockGenerateSuggestions.mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => `Вариант ${index + 1}`),
    );
    const wrapper = mountPage();

    const describeButton = findButtonByLabel(wrapper, 'query.assistant.describe');
    await describeButton?.trigger('click');

    await wrapper
      .get('[data-testid="query.assistant.situation_placeholder"]')
      .setValue('Мне сложно сформулировать запрос');

    const sendButton = findButtonByLabel(wrapper, 'query.assistant.send');
    expect(sendButton).toBeDefined();
    await sendButton?.trigger('click');
    await flushPromises();

    expect(mockGenerateSuggestions).toHaveBeenCalledWith({
      draft: 'Мне сложно сформулировать запрос',
      category: 'personality',
      count: 10,
    });
    expect(wrapper.text()).toContain('Вариант 1');
    expect(wrapper.text()).toContain('Вариант 10');
  });

  it('подставляет выбранный вариант в основное поле запроса и активирует старт игры', async () => {
    mockGenerateSuggestions.mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => `Готовый запрос номер ${index + 1}`),
    );
    const wrapper = mountPage();

    const describeButton = findButtonByLabel(wrapper, 'query.assistant.describe');
    await describeButton?.trigger('click');

    await wrapper
      .get('[data-testid="query.assistant.situation_placeholder"]')
      .setValue('Начальный текст для описания');

    const sendButton = findButtonByLabel(wrapper, 'query.assistant.send');
    await sendButton?.trigger('click');
    await flushPromises();

    const suggestionButton = wrapper
      .findAll('.q-item-stub')
      .find((item) => item.text().includes('Готовый запрос номер 2'));
    expect(suggestionButton).toBeDefined();
    await suggestionButton?.trigger('click');
    await flushPromises();

    const mainInput = wrapper.get('[data-testid="query.placeholder"]').element as HTMLTextAreaElement;
    expect(mainInput.value).toBe('Готовый запрос номер 2');

    const startButton = findButtonByLabel(wrapper, 'query.start_game');
    expect(startButton).toBeDefined();
    expect(startButton?.attributes('disabled')).toBeUndefined();
  });
});

# Lila Chakra Frontend

Telegram Mini App для цифровой адаптации древней индийской игры самопознания "Лила" с AI-интерпретацией ходов.

## Требования

- **Node.js** >= 20.x
- **Yarn** >= 1.21.1 (рекомендуется) или **npm** >= 6.13.4
- **Git**

## Установка

### 1. Клонирование репозитория

```bash
git clone git@github.com:jeckvorobey/lila_chakra_miniapp.git
cd lila_chakra_miniapp
```

### 2. Установка зависимостей

```bash
yarn install
# или
npm install
```

Команда `postinstall` автоматически запустит `quasar prepare`.

## Запуск

### Разработка с HMR (Hot Module Reloading)

```bash
yarn dev
# или
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:9000` (по умолчанию)

### Линтинг

Проверить код на ошибки:

```bash
yarn lint
# или
npm run lint
```

### Форматирование

Автоматически отформатировать код:

```bash
yarn format
# или
npm run format
```

Полная проверка + форматирование:

```bash
yarn lint && yarn format
```

### Тестирование

Запустить тесты один раз:

```bash
yarn test:unit
# или
npm run test:unit
```

Запустить тесты в режиме наблюдения:

```bash
yarn test
# или
npm run test
```

### Production сборка

```bash
yarn build
# или
npm run build
```

Готовый код будет в папке `dist/spa/` (для SPA) или другой в зависимости от конфигурации.

## Структура проекта

```plaintext
src/
├── assets/        # Статические файлы (изображения, шрифты и т.д.)
├── boot/          # Плагины и инициализация (например, axios.ts)
├── components/    # Переиспользуемые Vue компоненты
├── composables/   # Vue 3 Composition API утилиты
├── css/           # Глобальные стили (SCSS/CSS)
├── data/          # Константы и статические данные (клетки игры, змеи и т.д.)
├── i18n/          # Конфигурация локализации (Vue i18n)
│   ├── en-US.json # Английские переводы
│   └── ru-RU.json # Русские переводы (если есть)
├── layouts/       # Компоненты-макеты страниц (Header, Footer и т.д.)
├── pages/         # Страницы приложения (будут преобразованы в маршруты)
├── router/        # Конфигурация Vue Router
├── services/      # API сервисы и логика вызовов на бэкенд
├── stores/        # Pinia store для состояния приложения
├── types/         # TypeScript типы и интерфейсы
└── App.vue        # Корневой компонент приложения
```

## Технологический стек

### Фреймворк и UI

- **Quasar v2.16** — компонентный UI фреймворк на основе Vue 3
- **Vue 3** — прогрессивный JavaScript фреймворк
- **Vue Router v4** — маршрутизация

### State Management

- **Pinia v3** — управление состоянием (замена Vuex)

### HTTP и интеграции

- **Axios** — HTTP клиент для API запросов (настроен в `src/boot/axios.ts`)

### Локализация

- **Vue i18n v11** — интернационализация интерфейса (поддержка en-US, по умолчанию)

### Стиль и форматирование

- **ESLint 9** — статический анализ кода (flat config)
- **Prettier 3** — форматирование кода
- **Vue ESLint Plugin** — правила для Vue компонентов
- **SCSS/PostCSS** — препроцессор для стилей

### Тестирование

- **Vitest** — unit тесты
- **Vue Test Utils** — утилиты для тестирования Vue компонентов
- **Happy DOM** — лёгкая DOM реализация для тестов

## Стиль кодирования

### TypeScript/Vue

```typescript
// ✅ Правильно: Composition API с <script setup>
<script setup lang="ts">
import type { PropType } from 'vue'

interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

const emit = defineEmits<{
  update: [value: string]
}>()
</script>
```

Стандарты:

- **Отступы**: 2 пробела
- **Кавычки**: одинарные (`'string'`)
- **Максимальная длина строки**: 100 символов
- **API стиль**: Composition API с `<script setup lang="ts">`
- **Type imports**: `import type { X } from 'y'`
- **Null coalescing**: используйте `??` вместо `||` для явного различия falsy значений

## Работа с состоянием (Pinia)

### Создание store

```typescript
// src/stores/game.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  const moves = ref<Move[]>([])
  const currentPosition = ref(0)

  const totalMoves = computed(() => moves.value.length)

  const addMove = (move: Move) => {
    moves.value.push(move)
  }

  return {
    moves,
    currentPosition,
    totalMoves,
    addMove,
  }
})
```

### Использование в компонентах

```typescript
<script setup lang="ts">
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
</script>

<template>
  <div>
    <p>Total moves: {{ gameStore.totalMoves }}</p>
    <button @click="gameStore.addMove(newMove)">Make Move</button>
  </div>
</template>
```

## Работа с API (Axios)

HTTP клиент настроен в `src/boot/axios.ts`:

```typescript
// src/services/api.ts
import axios from 'axios'

export const gameApi = {
  async getGameState() {
    const { data } = await axios.get('/api/game/state')
    return data
  },

  async makeMove(move: Move) {
    const { data } = await axios.post('/api/game/move', move)
    return data
  },
}
```

## Локализация (Vue i18n)

### Добавление новых переводов

```typescript
// src/i18n/en-US.json
{
  "game": {
    "title": "Lila Chakra",
    "startButton": "Start Game"
  }
}
```

### Использование в шаблонах

```vue
<template>
  <h1>{{ $t('game.title') }}</h1>
  <button>{{ $t('game.startButton') }}</button>
</template>
```

### Использование в скриптах

```typescript
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const title = t('game.title')
</script>
```

## Компоненты и типы

### Типы компонентов

```typescript
// src/types/game.ts
export interface Cell {
  id: number
  level: number
  description: string
  isSnakeHead?: boolean
  isArrowBase?: boolean
}

export interface Move {
  playerId: string
  diceResult: number
  newPosition: number
  timestamp: Date
}
```

### Создание нового компонента

```typescript
// src/components/GameBoard.vue
<script setup lang="ts">
import type { Cell } from '@/types/game'

interface Props {
  cells: Cell[]
  currentPosition: number
}

withDefaults(defineProps<Props>(), {
  currentPosition: 0,
})

const emit = defineEmits<{
  cellClick: [id: number]
}>()
</script>

<template>
  <div class="game-board">
    <div
      v-for="cell in cells"
      :key="cell.id"
      class="cell"
      :class="{ active: currentPosition === cell.id }"
      @click="emit('cellClick', cell.id)"
    >
      {{ cell.id }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.game-board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 8px;
}

.cell {
  padding: 16px;
  background: #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &.active {
    background: #667eea;
    color: white;
  }
}
</style>
```

## Telegram Mini App специфика

Это приложение работает как Telegram Mini App. Для локального тестирования используйте режим разработки:

```bash
yarn dev
```

Для production используйте URL приложения в настройках Telegram бота.

## Production deployment

### Сборка для production

```bash
yarn build
```

### Рекомендации при деплое

1. **Переменные окружения** — создайте файл `.env.production`
2. **API URL** — убедитесь, что API URL в `src/boot/axios.ts` указывает на production backend
3. **Минификация** — автоматически включена в Quasar build
4. **CDN** — рассмотрите использование CDN для статических файлов
5. **CORS** — убедитесь, что backend позволяет запросы с вашего production домена

### Checklist перед деплоем

- [ ] Все тесты пройдены: `yarn test:unit`
- [ ] Линтинг пройден: `yarn lint`
- [ ] Код отформатирован: `yarn format`
- [ ] Нет console.log в продакшене
- [ ] API URL и ключи настроены
- [ ] Версия обновлена в `package.json`
- [ ] Сборка создана: `yarn build`

## Решение проблем

### Node modules портятся

```bash
rm -rf node_modules
rm yarn.lock  # или package-lock.json для npm
yarn install
```

### Порт 9000 занят

Укажите другой порт:

```bash
quasar dev --port 3000
```

### TypeScript ошибки в IDE

```bash
# Переустановите зависимости
yarn install

# Перезагрузите IDE
```

### HMR не работает

Проверьте, что используется dev режим:

```bash
yarn dev --poll  # Используйте polling если нужно
```

## Полезные команды

| Команда | Описание |
|---------|---------|
| `yarn dev` | Запустить dev сервер с HMR |
| `yarn lint && yarn format` | Проверить и отформатировать код |
| `yarn test:unit` | Запустить тесты один раз |
| `yarn test` | Запустить тесты в режиме наблюдения |
| `yarn build` | Создать production сборку |
| `quasar info` | Информация о Quasar окружении |

## Документация

- **Quasar docs**: <https://v2.quasar.dev/>
- **Vue 3**: <https://vuejs.org/>
- **Pinia**: <https://pinia.vuejs.org/>
- **Vue Router**: <https://router.vuejs.org/>
- **Vue i18n**: <https://vue-i18n.intlify.dev/>
- **Axios**: <https://axios-http.com/>

## Проект документация

- `../MVP.md` — спецификация MVP, правила игры, все 72 клетки
- `../ROADMAP.md` — план развития (AI Enhancement, подписки, партнёрка)

## Лицензия

Все права защищены.

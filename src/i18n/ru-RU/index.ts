/**
 * Русская локализация для Lila Chakra
 */

export default {
  // Общее
  failed: 'Действие не выполнено',
  success: 'Действие выполнено успешно',

  // Навигация
  nav: {
    game: 'Игра',
    diary: 'Дневник',
    profile: 'Профиль',
  },

  // Заставка
  splash: {
    tagline: 'Путешествие к самопознанию',
  },

  // Тема
  theme: {
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Системная',
  },

  // Введение
  onboarding: {
    welcome_title: 'Добро пожаловать в Лилу',
    welcome_desc: 'Древняя игра самопознания, адаптированная для современного мира',
    start_journey: 'Начать путешествие',
    concept_title: 'Как играть',
    concept_desc: 'Бросайте кубик и перемещайтесь по 72 клеткам, представляющим жизненный опыт',
    portals_title: 'Стрелы и Змеи',
    portals_desc: 'Добродетели поднимают вверх, пороки тянут вниз',
    safety_title: 'Важно для безопасности',
    safety_desc: 'Эта игра работает с вашим подсознанием. Медитации входа и выхода обязательны.',
    understand: 'Понимаю',
    skip: 'Пропустить',
    next: 'Далее',
  },

  // Кубик
  dice: {
    auto: 'Авто бросок',
    manual: 'Ручной ввод',
    select_value: 'Выберите значение кубика',
    roll: 'Бросить кубик',
    confirm: 'Подтвердить',
    roll_again: 'Бросьте ещё раз!',
    burned: 'Три шестёрки — Сгорание!',
    waiting_for_6: 'Выбросите 6, чтобы войти в игру',
  },

  // Игра
  game: {
    title: 'Игра',
    new_game: 'Новая игра',
    continue_game: 'Продолжить',
    end_game: 'Завершить игру',
    end_confirm_title: 'Завершить игру?',
    end_confirm_message: 'Вы уверены, что хотите завершить текущую игру?',
    current_cell: 'Текущая клетка',
    move_count: 'Ход',
    your_position: 'Ваша позиция',
    outside_board: 'Вне поля',
    cell_info_load_error: 'Не удалось загрузить информацию о клетке',
    arrow_notify: 'Стрела! Подъём на клетку {cell}',
    snake_notify: 'Змея! Спуск на клетку {cell}',
  },

  // Запрос
  query: {
    title: 'Ваш запрос',
    your_question: 'Что вы хотите исследовать?',
    placeholder: 'Опишите вашу ситуацию или вопрос...',
    examples: 'Примеры',
    start_game: 'Начать игру',
    category: {
      relationships: 'Отношения',
      career: 'Карьера',
      health: 'Здоровье',
      finance: 'Финансы',
      spirituality: 'Духовность',
      self_development: 'Саморазвитие',
    },
  },

  // Медитация
  meditation: {
    entry: 'Входная медитация',
    entry_title: 'Подготовка сознания',
    exit: 'Выходная медитация',
    exit_title: 'Интеграция',
    instruction: 'Найдите удобное положение и следуйте инструкциям',
    skip: 'Пропустить',
    complete: 'Завершить',
  },

  // Информация о клетке
  cell: {
    description: 'Описание',
    affirmation: 'Аффирмация',
    question: 'Вопрос для размышления',
    sanskrit_name: 'Санскритское название',
    keywords: 'Ключевые слова',
    ai_interpretation: 'AI Интерпретация',
  },

  // Переходы
  transition: {
    arrow_to: 'Подъём на клетку',
    snake_to: 'Спуск на клетку',
    meaning: 'Значение',
    arrow: 'Стрела',
    snake: 'Змея',
  },

  // Дневник
  diary: {
    title: 'Дневник',
    empty: 'Пока нет игр. Начните своё первое путешествие!',
    active: 'Активная',
    completed: 'Завершена',
    abandoned: 'Прервана',
    magic_time: 'Осталось магического времени',
    filter: {
      all: 'Все',
      active: 'Активные',
      completed: 'Завершённые',
    },
  },

  // Профиль
  profile: {
    title: 'Профиль',
    balance: 'Баланс',
    top_up: 'Пополнить',
    games_played: 'Игр сыграно',
    games_completed: 'Завершено',
    highest_level: 'Высший уровень',
    settings: 'Настройки',
    feedback: 'Обратная связь',
    rules: 'Правила игры',
    about: 'О приложении',
    invite: 'Пригласить друга',
    logout: 'Выйти',
  },

  // Оплата
  payment: {
    title: 'Пополнение баланса',
    top_up: 'Пополнить',
    proceed: 'Перейти к оплате',
    promo_code: 'Промокод',
    apply: 'Применить',
    package: {
      small: '5 ВЕ',
      medium: '10 ВЕ',
      large: '20 ВЕ (+5%)',
      xl: '50 ВЕ (+10%)',
    },
  },

  // Победа
  victory: {
    title: 'Просветление!',
    message: 'Вы достигли Космического Сознания',
    meditation: 'Выходная медитация',
    share: 'Поделиться',
  },

  // Конец игры
  end: {
    title: 'Игра завершена',
    meditation: 'Выходная медитация',
    save_later: 'Сохранить на потом',
    magic_time_reminder: 'У вас есть 72 часа для размышлений и действий',
  },

  // Действия
  actions: {
    continue: 'Продолжить',
    cancel: 'Отмена',
    save: 'Сохранить',
    close: 'Закрыть',
    write_insight: 'Записать инсайт',
    share: 'Поделиться',
  },

  // Ошибки
  error: {
    generic: 'Что-то пошло не так',
    network: 'Ошибка сети. Попробуйте снова.',
    auth: 'Ошибка авторизации',
    not_found: 'Не найдено',
  },

  // Telegram
  telegram: {
    required_message: 'Откройте игру из приложения Telegram',
  },

  // Чакры
  chakra: {
    1: 'Муладхара',
    2: 'Свадхистана',
    3: 'Манипура',
    4: 'Анахата',
    5: 'Вишуддха',
    6: 'Аджна',
    7: 'Сахасрара',
    8: 'Абсолют',
  },
};

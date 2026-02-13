/**
 * Локализация английского (США) для Lila Chakra
 */

export default {
  // Общее
  failed: 'Action failed',
  success: 'Action was successful',

  // Навигация
  nav: {
    game: 'Game',
    diary: 'Diary',
    profile: 'Profile',
  },

  // Заставка
  splash: {
    tagline: 'Your journey to self-discovery',
  },

  // Тема
  theme: {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },

  // Введение
  onboarding: {
    welcome_title: 'Welcome to Lila',
    welcome_desc: 'Ancient game of self-knowledge adapted for the modern world',
    start_journey: 'Start Journey',
    concept_title: 'How to Play',
    concept_desc: 'Roll the dice and move across 72 cells representing life experiences',
    portals_title: 'Arrows & Snakes',
    portals_desc: 'Virtues lift you up, vices pull you down',
    safety_title: 'Important Safety',
    safety_desc: 'This game works with your subconscious. Entry and exit meditations are required.',
    understand: 'I Understand',
    skip: 'Skip',
    next: 'Next',
  },

  // Кубик
  dice: {
    auto: 'Auto Roll',
    manual: 'Manual Input',
    select_value: 'Select dice value',
    roll: 'Roll Dice',
    confirm: 'Confirm',
    roll_again: 'Roll again!',
    burned: 'Triple 6 — Burned!',
    waiting_for_6: 'Roll 6 to enter the game',
  },

  // Игра
  game: {
    title: 'Game',
    new_game: 'New Game',
    continue_game: 'Continue',
    end_game: 'End Game',
    end_confirm_title: 'End game?',
    end_confirm_message: 'Are you sure you want to end the current game?',
    current_cell: 'Current Cell',
    move_count: 'Move',
    your_position: 'Your Position',
    outside_board: 'Outside the board',
    progress: 'Progress',
    cell_info_load_error: 'Failed to load cell information',
    arrow_notify: 'Arrow! Move up to cell {cell}',
    snake_notify: 'Snake! Move down to cell {cell}',
  },

  // Запрос
  query: {
    title: 'Your Question',
    your_question: 'What would you like to explore?',
    placeholder: 'Describe your situation or question...',
    examples: 'Examples',
    start_game: 'Start Game',
    category: {
      relationships: 'Relationships',
      career: 'Career',
      health: 'Health',
      finance: 'Finance',
      spirituality: 'Spirituality',
      self_development: 'Self Development',
    },
  },

  // Медитация
  meditation: {
    entry: 'Entry Meditation',
    entry_title: 'Prepare Your Mind',
    exit: 'Exit Meditation',
    exit_title: 'Integration',
    instruction: 'Find a comfortable position and follow the guidance',
    skip: 'Skip',
    complete: 'Complete',
  },

  // Информация о клетке
  cell: {
    description: 'Description',
    affirmation: 'Affirmation',
    question: 'Reflection Question',
    sanskrit_name: 'Sanskrit Name',
    keywords: 'Keywords',
    ai_interpretation: 'AI Interpretation',
  },

  // Переходы
  transition: {
    arrow_to: 'Ascends to cell',
    snake_to: 'Descends to cell',
    meaning: 'Meaning',
    arrow: 'Arrow',
    snake: 'Snake',
  },

  // Дневник
  diary: {
    title: 'Diary',
    empty: 'No games yet. Start your first journey!',
    active: 'Active',
    completed: 'Completed',
    abandoned: 'Abandoned',
    magic_time: 'Magic time remaining',
    filter: {
      all: 'All',
      active: 'Active',
      completed: 'Completed',
    },
  },

  // Профиль
  profile: {
    title: 'Profile',
    balance: 'Balance',
    top_up: 'Top Up',
    games_played: 'Games Played',
    games_completed: 'Completed',
    highest_level: 'Highest Level',
    current_chakra: 'Current Chakra Level',
    no_active_games: 'No active games',
    settings: 'Settings',
    feedback: 'Feedback',
    my_requests: 'My Requests',
    rules: 'Game Rules',
    about: 'About',
    invite: 'Invite Friend',
    logout: 'Logout',
  },

  // Feedback
  feedback: {
    title: 'Feedback',
    subtitle: 'Tell us what we can improve: report an issue or suggest a new feature.',
    input_label: 'Your message',
    placeholder: 'Describe the issue, idea, or suggestion...',
    hint: 'We read every request and try to respond as quickly as possible.',
    submit: 'Send',
    validation_min: 'Please enter at least 10 characters',
    success: 'Thank you! Your request has been sent.',
    error_submit: 'Failed to send your request. Please try again.',
    my_requests_title: 'My Requests',
    empty_title: 'No requests yet',
    empty_text: 'Once you send a message, it will appear here.',
    created_at: 'Created',
    eta_at: 'Estimated completion date',
    admin_comment: 'Support comment',
    error_load: 'Failed to load requests',
    status: {
      new: 'New',
      processed: 'Processed',
      in_progress: 'In progress',
      completed: 'Completed',
      rejected: 'Rejected',
    },
  },

  // Оплата
  payment: {
    title: 'Top Up Balance',
    top_up: 'Top Up',
    proceed: 'Proceed to Payment',
    promo_code: 'Promo Code',
    apply: 'Apply',
    package: {
      small: '5 TKN',
      medium: '10 TKN',
      large: '20 TKN (+5%)',
      xl: '50 TKN (+10%)',
    },
  },

  // Победа
  victory: {
    title: 'Enlightenment!',
    message: 'You have reached Cosmic Consciousness',
    meditation: 'Exit Meditation',
    share: 'Share',
  },

  // Конец игры
  end: {
    title: 'Game Ended',
    meditation: 'Exit Meditation',
    save_later: 'Save for Later',
    magic_time_reminder: 'You have 72 hours for reflection and action',
  },

  // Действия
  actions: {
    continue: 'Continue',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    write_insight: 'Write Insight',
    share: 'Share',
  },

  // Ошибки
  error: {
    generic: 'Something went wrong',
    network: 'Network error. Please try again.',
    auth: 'Authentication failed',
    not_found: 'Not found',
  },

  // Telegram
  telegram: {
    required_message: 'Open the game from the Telegram app',
  },

  // Referral program
  referral: {
    title: 'Invite Friend',
    description: 'Share the game with your friends and get bonuses on your balance!',
    your_link: 'Your referral link',
    copy: 'Copy',
    copied: 'Link copied',
    rules_title: 'How it works?',
    rules: [
      'Send your unique link to a friend.',
      'When a friend registers using your link, you receive a bonus.',
      'For each invited friend, 2 TKN is credited to your balance.',
      'Bonuses can be used to pay for games with AI.',
    ],
    total_referrals: 'Total referrals',
    bonus_earned: 'Bonuses earned',
    share_message: "👋 Hey! 😊 I want to tell you about an amazing game called Lila 🎲 — it really helps you understand yourself and find your path 🌟 It gave me so much clarity and answers to important questions! I'm sure you'll love it too — join us! ✨🙏",
  },

  // Чакры
  chakra: {
    1: 'Muladhara',
    2: 'Svadhisthana',
    3: 'Manipura',
    4: 'Anahata',
    5: 'Vishuddha',
    6: 'Ajna',
    7: 'Sahasrara',
    8: 'Absolute',
  },
};

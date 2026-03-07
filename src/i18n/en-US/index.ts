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
    intro: {
      title: 'Lila: Your Path to Clarity',
      description: 'An ancient game to solve real-life challenges. Find answers within and take action.',
      point1: 'Stuck in choices: the game reveals hidden obstacles and resources.',
      point2: 'Low on energy: see where you lose strength and gain grounding.',
      point3: 'Need an answer: Lila shows your true state and the way to your goal.',
    },
    modes: {
      title: 'Choose your game mode',
      description: 'Each mode offers a different depth of guidance and cost.',
      free: {
        title: 'Free',
        description: 'Play without AI. We recommend taking notes in a diary.',
      },
      ai: {
        title: 'With AI Mentor',
        description: 'Full AI interpretation of every move. All data is saved in your game diary.',
      },
      incognito: {
        title: 'With AI Mentor (Incognito)',
        description: 'AI interpretation of every move. Temporary history storage in the diary — 72 hours after game completion. Interpretations, answers, and insights are permanently deleted.',
      },
    },
    how_to_play: {
      title: 'How to play',
      description: 'Simple flow, step by step, at your own pace.',
      point1: 'Auto dice is on. You can switch to manual in profile.',
      point2: 'If you use physical dice, enter the value manually.',
      point3: 'You enter the game only with a 6. Keep rolling!',
    },
    transitions: {
      title: 'Arrows and snakes',
      description: 'Transitions show your direction in the moment.',
      point1: 'Arrow lifts you up: support and growth.',
      point2: 'Snake takes you down: a signal to pause and rethink.',
      point3: 'It is not about “good or bad”, but about your takeaway.',
    },
    diary: {
      title: 'Game diary',
      description: 'Your move history is available for review.',
      point1: 'Revisit each move in chronological order after the game.',
      point2: 'Save insights during play so thoughts are not lost.',
      point3: 'Repeated cells and transitions reveal patterns.',
    },
    profile: {
      title: 'Profile settings',
      description: 'Adjust the experience in a few taps.',
      point1: 'Sound and vibration.',
      point2: 'Dice mode: auto or manual.',
      point3: 'Chip color and chip text color.',
    },
    accept: {
      title: 'Before you start',
      description: 'The game works deeply with attention and state.',
      point1: 'Entry and exit meditations are required for safety.',
      point2: 'In Incognito mode, data is available for 72 hours only.',
      point3: 'Accept the rules and begin with a clear intention.',
    },
    accept_checkbox: 'I understand and accept',
    accept_button: 'Accept',
    back: 'Back',
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
    no_move: 'No move possible. Roll again next turn',
    change_mode_prefix: 'you can change dice mode in ',
    change_mode_link: 'profile settings',
  },

  // Игра
  game: {
    title: 'Game',
    home_title: 'Home',
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
    category_title: 'Category',
    your_question: 'What would you like to explore?',
    placeholder: 'Write your request...',
    examples: 'Examples',
    examples_by_category: {
      relationships: [
        'How can I improve communication with my partner?',
        'Why is it hard for me to trust people?',
        'How can I build healthier boundaries in relationships?',
        'What helps restore warmth after a conflict?',
        'How do I attract a mature and supportive partner?',
      ],
      career: [
        'How can I find my true professional path?',
        'Should I change my current job now?',
        'How can I grow into a leadership role?',
        'What skill should I focus on this year?',
        'How do I overcome fear of career growth?',
      ],
      health: [
        'How can I restore my energy levels?',
        'What habits are harming my health the most?',
        'How can I balance body and mind daily?',
        'What is the best first step toward better sleep?',
        'How can I reduce stress without burnout?',
      ],
      finance: [
        'How can I increase my income sustainably?',
        'What blocks my financial growth right now?',
        'How can I build a healthier money mindset?',
        'Where should I start with personal budgeting?',
        'How do I stop impulsive spending?',
      ],
      freedom: [
        'Where should I travel to reset my mind?',
        'How can I develop inner freedom?',
        'What keeps me from exploring the world?',
        'How can I live with more flexibility and joy?',
        'What belief limits my sense of freedom most?',
      ],
      personality: [
        'What trait should I strengthen right now?',
        'What pattern keeps me stuck?',
        'How can I become more confident in decisions?',
        'What is my key growth zone this month?',
        'How do I reveal my strongest potential?',
      ],
    },
    start_game: 'Start Game',
    assistant: {
      title: 'Not sure how to phrase your request?',
      subtitle: 'Describe your situation and AI will suggest 10 prompt options.',
      describe: 'Describe situation',
      send: 'Send',
      situation_placeholder: 'Describe your situation or request...',
      generate: 'Suggest 10 options',
      loading: 'Generating prompt ideas...',
      retry: 'Try again',
      error: 'Unable to generate options right now. Please try again.',
      min_chars_hint: 'Enter at least 5 characters to generate options.',
    },
    category: {
      relationships: 'Relationships',
      career: 'Career',
      health: 'Health',
      finance: 'Finance',
      personality: 'Personality',
      freedom: 'Freedom',
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
    instructions_title: 'Instruction',
    entry_steps: {
      settle: {
        title: 'Get comfortable',
        text: 'Sit with a straight back and relaxed shoulders. Rest your hands on your knees or in any position that feels natural.',
      },
      close_eyes: {
        title: 'Close your eyes and breathe deeply',
        text: 'Take several slow, deep inhales and exhales. With each exhale, let the tension of the day go.',
      },
      formulate_question: {
        title: 'Formulate your question',
        text: 'Silently state the question or intention you bring into the game. Keep it clear and concise.',
      },
      let_question_sound: {
        title: 'Let the question resonate',
        text: 'Do not search for an answer or analyze. Hold focus on the question and imagine handing it over to your subconscious.',
      },
      readiness: {
        title: 'Feel your readiness',
        text: 'When you sense inner quiet and readiness to begin, take one final deep inhale and exhale.',
      },
    },
    exit_steps: {
      settle: {
        title: 'Get comfortable',
        text: 'Return to the same comfortable position you had at the beginning.',
      },
      close_eyes: {
        title: 'Close your eyes',
        text: 'Breathe calmly and evenly, returning to your inner center.',
      },
      recall_path: {
        title: 'Recall your journey',
        text: 'Let key moments, insights, and realizations from the game arise freely. Do not analyze, simply observe.',
      },
      highlight_core: {
        title: 'Identify the core insight',
        text: 'From the flow of impressions, choose one insight that matters most right now. What simple action does it suggest?',
      },
      define_step: {
        title: 'Define your next step',
        text: 'Turn this insight into one concrete, small, and doable step you can take soon.',
      },
      gratitude: {
        title: 'Thank the experience',
        text: 'Silently thank the game and yourself for the journey. Take a deep inhale and exhale, then gently open your eyes.',
      },
    },
    skip: 'Skip',
    complete: 'Complete',
  },

  // Информация о клетке
  cell: {
    description: 'Description',
    description_revisit: 'Revisit Description',
    question: 'Reflection Question',
    sanskrit_name: 'Sanskrit Name',
    keywords: 'Keywords',
    ai_interpretation: 'Interpretation of the AI ​​mentor',
    reflection_questions: 'Self-reflection questions',
  },

  clarification: {
    button_free: 'Ask a clarification question (free)',
    button_paid_base: 'Ask a clarification question',
    button_paid_cost: '1 TKN',
    dialog_title: 'Clarifying Question',
    placeholder: 'What would you like to clarify about your current situation?',
    submit: 'Send question',
    loading: 'Mentor is thinking...',
    ask_another: 'Ask another question',
    error: 'Failed to get an answer',
    quota_exceeded: 'AI is overloaded right now. Please try again later.',
    retry: 'Retry',
    insufficient_balance: 'Insufficient TKN balance',
  },

  // Переходы
  transition: {
    arrow_to: 'Ascends to cell',
    snake_to: 'Descends to cell',
    meaning: 'Meaning',
    arrow: 'Arrow',
    snake: 'Snake',
    arrived_by_arrow: 'You ascended by an arrow from cell {from} to cell {to}.',
    arrived_by_snake: 'You descended by a snake from cell {from} to cell {to}.',
    arrow_interpretation: 'In Lila, an arrow symbolizes virtue supporting spiritual ascent.',
    snake_interpretation: 'In Lila, a snake marks a vice lesson and a return for deeper work.',
  },

  // Дневник
  diary: {
    title: 'Diary',
    empty: 'No games yet. Start your first journey!',
    active: 'Active',
    completed: 'Completed',
    abandoned: 'Abandoned',
    magic_time: 'Magic time remaining',
    meditation: 'Meditation',
    report: 'Report',
    ai_mentor_response: 'AI Mentor Response',
    insight_notes: 'Notes (Takeaways)',
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
    top_up_balance: 'Top Up Balance',
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
    invite: 'Share Link',
    chip_settings: 'Chip Settings',
    chip_color: 'Chip Color',
    chip_text_color: 'Text Color',
    transactions_title: 'Transaction History',
    transactions_empty: 'No balance operations yet',
    transaction_sources: {
      user_purchase: 'Purchase',
      admin_grant: 'Admin adjustment',
      promo_code: 'Promo code',
      referral_reward: 'Referral reward',
      game_fee: 'Game fee',
      ai_service_fee: 'AI service fee',
      refund: 'Refund',
    },
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
    token_confirm: {
      title: 'Confirm deduction',
      message: '{amount} TKN will be deducted from your balance to continue.',
      message_game: 'The selected mode costs {amount} TKN. Start the game?',
      message_clarification: '{amount} TKN will be deducted to receive a mentor clarification.',
      confirm_button: 'Confirm',
      cancel_button: 'Cancel',
    },
  },

  // Победа
  victory: {
    title: 'Enlightenment!',
    message: 'You have reached Cosmic Consciousness',
    meditation: 'Exit Meditation',
    share: 'Share',
  },

  finale: {
    title: 'Report',
    summary_title: '🎉 Congratulations! ✨',
    summary_line1: 'Reaching cell 68 means your journey through the space of Lila is complete.',
    summary_line2:
      'This is not just a final point — it is a moment of integrating the experiences, insights and inner transformations that revealed themselves to you throughout the game.',
    summary_line3:
      'I hope this journey helped you find inner clarity, see yourself more deeply and understand exactly what actions will lead you to the realisation of your intention:',
    summary_stats_moves: '{count} steps of awareness and choice',
    summary_stats_arrows: '{count} — moments of support, trust and expansion',
    summary_stats_snakes: '{count} — important lessons returning you to the true direction',
    summary_line4:
      'Every cell was a reflection of your inner state. Every transition — an invitation to awakening. And now you are where you are ready to see more and act consciously.',
    summary_footer: '🌸 The journey is complete. Awakening has begun.',
    plan_block: 'Magical 72 Hours',
    art_block: 'AI Journey Art',
    mentor_button: 'AI Mentor Result',
    mentor_generating: 'AI mentor is preparing your finale...',
    mentor_result_block: 'AI Mentor Result',
    journey_highlights_block: 'Journey Highlights',
    generate_summary: 'Generate Summary',
    generate_image: 'Generate AI Art',
    image_generating: 'Image generation is in progress...',
    image_generation_wait: 'This may take a few minutes. Please wait.',
    image_failed: 'Image generation is unavailable. Please try later.',
    image_ready: 'Image is ready for download and sharing.',
    image_not_started: 'Image has not been generated yet.',
    download: 'Download',
    share: 'Share',
    share_title: 'My Lila Journey',
    share_popup_message: 'Where should the finale art be shared?',
    share_story_option: 'Telegram Story',
    share_friends_option: 'Send to Friends',
    share_story_link: 'Open Lila',
    share_story_unavailable: 'Story sharing is unavailable in this Telegram client.',
    share_friends_unavailable: 'Chat sharing is unavailable in this Telegram client.',
    share_fallback: 'Sharing is unavailable, file downloaded locally.',
    victory_title: 'Cell 68: Cosmic Consciousness',
    victory_message: 'Complete your closing ritual: capture insight and move to exit meditation.',
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
    finish_game: 'Finish Game',
    continue: 'Continue',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    write_insight: 'Write Insight',
    edit_insight: 'Edit Insight',
    add_insight: 'Add to Insight',
    share: 'Share',
  },

  // Ошибки
  error: {
    generic: 'Something went wrong',
    network: 'Network error. Please try again.',
    auth: 'Authentication failed',
    not_found: 'Not found',
    finale_summary_generation_failed: 'Failed to get AI mentor response. Please try again.',
    ai_invalid_request: 'Invalid request to AI service. Please try later.',
    ai_permission_denied: 'Access to AI model was denied.',
    ai_model_not_found: 'AI model is unavailable.',
    ai_rate_limited: 'AI service is rate limited right now. Please retry in a minute.',
    ai_internal_error: 'AI service internal error. Please try again.',
    ai_unavailable: 'AI service is temporarily unavailable. Please try again later.',
    ai_deadline_exceeded: 'AI service timed out. Please retry.',
    ai_transport_error: 'Connection problem with AI service. Check your network and retry.',
    ai_blocked: 'AI response was blocked by safety policies. Try rephrasing.',
    ai_invalid_response_format: 'AI returned an invalid response format. Please retry.',
  },

  // Telegram
  telegram: {
    required_message: 'Open the game from the Telegram app',
  },

  // Messages
  messages: {
    promo_applied: 'Promo code applied successfully',
  },

  // Referral program
  referral: {
    title: 'Invite Friend',
    description: 'Share the game with your friends and get bonuses on your balance!',
    your_link: 'Your referral link',
    copy: 'Copy',
    copied: 'Link copied',
    code_generated: 'Promo code generated successfully',
    rules_title: 'How it works?',
    rules: [
      'Send your unique link to a friend.',
      'When your friend registers using your link, they instantly get 5 TKN (base bonus) + 5 TKN (for your link).',
      'You can share your link an unlimited number of times.'
    ],
    total_referrals: 'Total referrals',
    bonus_earned: 'Bonuses earned',
    share_message:
      "👋 Hey! 😊 I want to tell you about an amazing game called Lila 🎲 — it really helps you understand yourself and find your path 🌟 It gave me so much clarity and answers to important questions! I'm sure you'll love it too — join us! ✨🙏",
  },

  // Game Rules
  rules: {
    title: 'Game Rules',

    // Preparation
    prep_title: 'Preparing for the Game',
    prep_text:
      'Find a place where you will not be disturbed for 2–3 hours. ' +
      'Before starting, it is recommended to do a short meditation or listen to calming music — ' +
      'the goal is to quiet your mind and relax.',

    // Intention
    intention_title: 'Entering the Game — Your Intention',
    intention_text:
      'To start playing, you must enter the game with an intention — the question or situation ' +
      'that matters most to you right now. It must be specific, clearly formulated and reflect a real goal. ' +
      'It can be something practical: "How do I earn a million in the next six months?" ' +
      'or something deeper: "What do I need to do to find my life\'s purpose?" ' +
      'What matters is that it is what concerns you the most at this moment.',
    intention_six:
      'To enter the game, you must roll a 6. If another number comes up — ' +
      'rethink and reformulate your intention. Be prepared: your true intention ' +
      'may turn out to be very different from the one you started with.',

    // Gameplay
    general_title: 'Gameplay',
    general_board: 'Game board: 72 cells, 8 levels (chakras)',
    general_dice_auto: 'Dice roll — automatic, random result',
    general_dice_manual: 'Manual input — for your own dice, you choose the rolled value',
    general_arrows: 'Arrows of virtue — move you up the board',
    general_snakes: 'Snakes of vice — move you down the board',
    general_sixes: 'You need to roll a six to enter the game',
    general_move:
      'When you land on a cell, read its description and reflect on what this cell means ' +
      'specifically for you and your intention.',
    general_arrow_rule:
      'If your token lands on the base of an arrow — it moves up to the tip. ' +
      'For example, landing on "Higher Goal" (№27) sends the player up to "Realization" (№41).',
    general_snake_rule:
      "If your token lands on a snake's head — it slides down to the tail. " +
      'For example, Ego (№55) drops the player to Anger (№3).',
    general_six_bonus: 'If you roll a six — take another turn.',

    // Goal
    goal_title: 'Goal and End of Game',
    goal_text:
      'The game ends when the token lands exactly on cell 68 — Cosmic Consciousness. ' +
      'If the token overshoots and stops on 69, 70 or 71 — wait until the exact number comes up to return to 68. ' +
      'Cell 69 (the Plane of the Absolute) is a special case: you cannot reach 68 directly from it — ' +
      'you must wait for the Tamoguna snake to bring you back down.',

    // Analysis
    analysis_title: 'Analysing the Game',
    analysis_text:
      'After the game, carefully review all the cells you visited. ' + 'Pay special attention to:',
    analysis_snakes: 'Cells with snakes that sent you down',
    analysis_repeat: 'Cells you landed on more than once',
    analysis_emotion: 'Cells that triggered the strongest emotions',
    analysis_note:
      'All these cells represent states that either bring you closer to your goal or push you away. ' +
      'You may return to your notes later — a deeper understanding often reveals itself over time.',

    // After the game
    after_title: 'Working on Yourself After the Game',
    after_text:
      'Within 96 hours after the game, begin working through the issues and mental blocks ' +
      'that surfaced during play. Building a new habit takes about 3 weeks. ' +
      'Useful practices include meditation, yoga, psychotherapy, retreats and other tools.',

    // Modes
    modes_title: 'Game Modes',
    mode_free_title: 'Free',
    mode_free_desc:
      'Play without AI interpretation. We recommend writing your thoughts and insights in a notebook.',
    mode_ai_title: 'With AI Mentor',
    mode_ai_desc:
      'Full AI interpretation of every move. All data is saved in your game diary.',
    mode_incognito_title: 'With AI Mentor (Incognito)',
    mode_incognito_desc:
      'AI interpretation of every move. Temporary history storage in the diary — 72 hours after game completion. Interpretations, answers, and insights are permanently deleted.',

    // Extra question
    extra_question_title: 'Extra Question',
    extra_question_desc:
      'In any mode, you can ask the AI Mentor an additional question to get clarification on the interpretation.',
    tkn: 'TKN',
  },

  // About
  about: {
    title: 'About',
    description_title: 'Description',
    description_text:
      'Lila Chakra is a digital adaptation of the ancient Indian game of self-discovery "Lila" (2000–5000 years old). The app combines the wisdom of tradition with modern AI technology for deep interpretation of your journey.',
    developer_title: 'Developer',
    developer_name: 'Sole proprietor Sergei Alexandrovich Vorobev',
    developer_inn: 'TIN: XXXXXXXXXXXX',
    contacts_title: 'Contact Information',
    contacts_email: 'email@example.com',
    contacts_telegram: '@support_bot',
    legal_title: 'Legal Information',
    legal_personal_data:
      'Personal data processing is carried out in accordance with Federal Law No. 152-FZ "On Personal Data".',
    legal_age_restriction: 'Age restriction: 16+',
    legal_ai_disclaimer:
      'AI interpretations are advisory in nature and do not constitute professional psychological or medical advice.',
    version: 'Version',
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

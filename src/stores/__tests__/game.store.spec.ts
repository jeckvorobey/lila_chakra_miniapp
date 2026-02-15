import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';

import { useGameStore } from 'src/stores/game.store';
import type { AudioByTypeResponse } from 'src/types/audio.interface';

const { mockAudioApi, mockGamesApi, mockMovesApi } = vi.hoisted(() => ({
  mockAudioApi: {
    getByType: vi.fn(),
    getStreamBlob: vi.fn(),
  },
  mockGamesApi: {
    create: vi.fn(),
    get: vi.fn(),
    getMoves: vi.fn(),
    completeEntryMeditation: vi.fn(),
    completeExitMeditation: vi.fn(),
    end: vi.fn(),
    rollDice: vi.fn(),
  },
  mockMovesApi: {
    saveInsight: vi.fn(),
  },
}));

vi.mock('src/services/api', () => ({
  audioApi: mockAudioApi,
  gamesApi: mockGamesApi,
  movesApi: mockMovesApi,
}));

describe('game.store meditation audio', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: () => 'blob:mock',
      });
    }

    if (!URL.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        writable: true,
        value: () => undefined,
      });
    }
  });

  it('создаёт object URL для медитационного аудио', async () => {
    const store = useGameStore();

    const response: AudioByTypeResponse = {
      items: [
        {
          id: 10,
          title: 'Входная медитация',
          type: 'meditation_entry',
          file_url: '/api/audio/10/stream',
          stream_url: '/api/audio/10/stream',
          created_at: '2026-02-08T14:33:14.866798Z',
        },
      ],
      total: 1,
    };

    const createObjectUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:meditation-1');

    mockAudioApi.getByType.mockResolvedValue(response);
    mockAudioApi.getStreamBlob.mockResolvedValue(new Blob(['audio'], { type: 'audio/mpeg' }));

    await store.loadMeditationAudio('meditation_entry');

    expect(mockAudioApi.getByType).toHaveBeenCalledWith('meditation_entry');
    expect(mockAudioApi.getStreamBlob).toHaveBeenCalledWith(10);
    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(store.meditationAudioUrl).toBe('blob:meditation-1');
    expect(store.meditationAudioError).toBeNull();
  });

  it('освобождает предыдущий object URL перед повторной загрузкой', async () => {
    const store = useGameStore();

    const response: AudioByTypeResponse = {
      items: [
        {
          id: 1,
          title: 'Медитация',
          type: 'meditation_entry',
          file_url: '/api/audio/1/stream',
          stream_url: '/api/audio/1/stream',
          created_at: '2026-02-08T14:33:14.866798Z',
        },
      ],
      total: 1,
    };

    const createObjectUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:meditation-1')
      .mockReturnValueOnce('blob:meditation-2');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    mockAudioApi.getByType.mockResolvedValue(response);
    mockAudioApi.getStreamBlob.mockResolvedValue(new Blob(['audio'], { type: 'audio/mpeg' }));

    await store.loadMeditationAudio('meditation_entry');
    await store.loadMeditationAudio('meditation_entry');

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(2);
    expect(revokeSpy).toHaveBeenCalledWith('blob:meditation-1');
    expect(store.meditationAudioUrl).toBe('blob:meditation-2');
  });

  it('очищает URL и выставляет ошибку при неуспешной загрузке', async () => {
    const store = useGameStore();

    const response: AudioByTypeResponse = {
      items: [
        {
          id: 2,
          title: 'Медитация',
          type: 'meditation_entry',
          file_url: '/api/audio/2/stream',
          stream_url: '/api/audio/2/stream',
          created_at: '2026-02-08T14:33:14.866798Z',
        },
      ],
      total: 1,
    };

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:meditation-old');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    mockAudioApi.getByType.mockResolvedValueOnce(response);
    mockAudioApi.getStreamBlob.mockResolvedValueOnce(new Blob(['audio'], { type: 'audio/mpeg' }));
    await store.loadMeditationAudio('meditation_entry');

    mockAudioApi.getByType.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Нет доступа к аудио',
        },
      },
    });

    await store.loadMeditationAudio('meditation_entry');

    expect(revokeSpy).toHaveBeenCalledWith('blob:meditation-old');
    expect(store.meditationAudioUrl).toBe('');
    expect(store.meditationAudioError).toBe('Нет доступа к аудио');
  });
});

describe('game.store rollDice', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('обновляет progressCell только после завершения анимации фишки', async () => {
    const store = useGameStore();

    store.currentGame = {
      id: 77,
      user_id: 15,
      query: 'Тест',
      category: 'career',
      mode: 'free',
      status: 'in_progress',
      current_cell: 10,
      entry_meditation_completed: true,
      exit_meditation_completed: false,
      total_moves: 2,
      arrows_hit: 0,
      snakes_hit: 0,
      highest_cell: 10,
      created_at: '2026-02-08T14:33:14.866798Z',
      completed_at: null,
      magic_time_ends_at: null,
      ai_summary: null,
    };

    await nextTick();
    expect(store.progressCell).toBe(10);

    store.isChipAnimating = true;
    store.currentGame.current_cell = 20;

    await nextTick();
    expect(store.progressCell).toBe(10);

    store.isChipAnimating = false;

    await nextTick();
    expect(store.progressCell).toBe(20);
  });

  it('в ручном режиме отправляет manual_value вместе с previous_manual_rolls', async () => {
    const store = useGameStore();

    store.currentGame = {
      id: 77,
      user_id: 15,
      query: 'Тестовый запрос для ручного броска',
      category: 'career',
      mode: 'free',
      status: 'in_progress',
      current_cell: 10,
      entry_meditation_completed: true,
      exit_meditation_completed: false,
      total_moves: 2,
      arrows_hit: 0,
      snakes_hit: 0,
      highest_cell: 10,
      created_at: '2026-02-08T14:33:14.866798Z',
      completed_at: null,
      magic_time_ends_at: null,
      ai_summary: null,
    };

    store.addManualSix();

    mockGamesApi.rollDice.mockResolvedValue({
      move: {
        id: 5,
        game_id: 77,
        move_number: 3,
        dice_rolls: [6, 4],
        is_triple_six: false,
        is_pending: false,
        start_cell: 10,
        end_cell: 20,
        final_cell: 20,
        transition_type: 'none',
        transition_from: null,
        transition_to: null,
        ai_interpretation: null,
        player_insight: null,
        created_at: '2026-02-08T14:33:14.866798Z',
      },
      cell_info: {
        id: 20,
        name_ru: 'Клетка',
        chakra_level: 2,
        chakra_name: 'Свадхистана',
        affirmation_ru: 'Аффирмация',
        transition_type: 'none',
        transition_to: null,
      },
      game_status: 'in_progress',
      requires_another_roll: false,
      is_entry_move: false,
      is_victory: false,
    });

    await store.rollDiceManual(4);

    expect(mockGamesApi.rollDice).toHaveBeenCalledWith(77, {
      is_manual: true,
      manual_value: 4,
      previous_manual_rolls: [6],
    });
  });

  it('в авто-режиме возвращает промежуточный ответ при выпадении 6', async () => {
    const store = useGameStore();

    store.currentGame = {
      id: 77,
      user_id: 15,
      query: 'Тестовый запрос для авто броска',
      category: 'career',
      mode: 'free',
      status: 'in_progress',
      current_cell: 10,
      entry_meditation_completed: true,
      exit_meditation_completed: false,
      total_moves: 2,
      arrows_hit: 0,
      snakes_hit: 0,
      highest_cell: 10,
      created_at: '2026-02-08T14:33:14.866798Z',
      completed_at: null,
      magic_time_ends_at: null,
      ai_summary: null,
    };

    mockGamesApi.rollDice.mockResolvedValue({
      requires_another_roll: true,
      intermediate: {
        pending_move_id: 12,
        dice_value: 6,
        accumulated_rolls: [6],
        is_triple_six: false,
        requires_another_roll: true,
        message_key: 'dice.rolled_six_roll_again',
      },
      is_entry_move: false,
      is_victory: false,
    });

    const response = await store.rollDiceAuto();

    expect(response?.requires_another_roll).toBe(true);
    expect(store.pendingAutoRolls).toEqual([6]);
    expect(store.currentDiceRolls).toEqual([6]);
  });
});

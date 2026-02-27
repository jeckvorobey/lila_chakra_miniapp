/**
 * Хранилище игры для управления состоянием игры Лила Чакра.
 * Содержит логику игры: броски кубика, ходы, стрелы, змеи.
 */

import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed, watch } from 'vue';
import { audioApi, gamesApi, movesApi } from 'src/services/api';
import { useReferenceStore } from 'src/stores/reference.store';
import type {
  GameDetail,
  MoveOut,
  MoveResponse,
  CellBrief,
  GameCreate,
  TransitionType,
  GameMode,
  QueryCategory,
  DiceRollRequest,
  Cell,
} from 'src/types/game.interface';
import type { MeditationAudioType } from 'src/types/audio.interface';

import { WINNING_CELL, CHAKRA_ROWS, CELLS_PER_ROW, WAITING_ZONE } from 'src/data/game-constants';
import { cellIdToChakraLevel } from 'src/utils/board-geometry';
import { isActiveGameStatus } from 'src/data/game-status';

// Повторный экспорт игровых констант для удобства
export { WINNING_CELL, CHAKRA_ROWS, CELLS_PER_ROW, WAITING_ZONE };

export type { GameMode, QueryCategory };

export const useGameStore = defineStore('game', () => {



  // Состояние
  const currentGame = ref<GameDetail | null>(null);
  const moves = ref<MoveOut[]>([]);
  const currentCellInfo = ref<CellBrief | Cell | null>(null);
  const isLoading = ref(false);
  const isRolling = ref(false);
  const error = ref<string | null>(null);
  const meditationAudioUrl = ref('');
  const isMeditationAudioLoading = ref(false);
  const meditationAudioError = ref<string | null>(null);

  // Состояние кубика
  const currentDiceRolls = ref<number[]>([]);
  const lastTransition = ref<TransitionType>('none');
  const requiresAnotherRoll = ref(false);
  const pendingAutoRolls = ref<number[]>([]);
  const pendingManualRolls = ref<number[]>([]);

  // Анимация фишки на доске
  interface PendingAnimation {
    startCell: number;
    endCell: number;
    finalCell: number;
    transitionType: TransitionType;
  }
  interface ActiveTransition {
    type: 'arrow' | 'snake';
    startCellId: number;
    endCellId: number;
  }
  const displayCell = ref(0);
  const progressCell = ref(0);
  const isChipAnimating = ref(false);
  const activeTransition = ref<ActiveTransition | null>(null);
  const transitionAnimationResolver = ref<(() => void) | null>(null);
  let pendingAnimation: PendingAnimation | null = null;

  // Вычисляемые значения
  const isGameActive = computed(() => {
    if (!currentGame.value) return false;
    if (isActiveGameStatus(currentGame.value.status)) return true;
    // Игра завершена (клетка 68), но выходная медитация ещё не пройдена —
    // держим страницу активной, чтобы показать победный экран в LCellInfo
    if (currentGame.value.status === 'completed' && !currentGame.value.exit_meditation_completed)
      return true;
    return false;
  });

  const isWaitingFor6 = computed(() => currentGame.value?.status === 'waiting_for_6');

  const isInProgress = computed(() => currentGame.value?.status === 'in_progress');

  const isInWaitingZone = computed(() => currentGame.value?.status === 'in_waiting_zone');

  const isGameCompleted = computed(() => currentGame.value?.status === 'completed');

  const isGameAbandoned = computed(() => currentGame.value?.status === 'abandoned');

  const currentCell = computed(() => currentGame.value?.current_cell ?? 0);

  const needsEntryMeditation = computed(
    () => currentGame.value && !currentGame.value.entry_meditation_completed,
  );

  const needsExitMeditation = computed(
    () => currentGame.value?.status === 'completed' && !currentGame.value.exit_meditation_completed,
  );

  const moveHistory = computed(() =>
    [...moves.value].sort((a, b) => b.move_number - a.move_number),
  );

  const totalMoves = computed(() => currentGame.value?.total_moves ?? 0);

  const arrowsHit = computed(() => currentGame.value?.arrows_hit ?? 0);

  const snakesHit = computed(() => currentGame.value?.snakes_hit ?? 0);

  const highestCell = computed(() => currentGame.value?.highest_cell ?? 0);

  const clarificationsFreeLeft = computed(() => {
    return currentGame.value?.clarifications_free_left ?? 0;
  });

  const nextClarificationCost = computed(() => {
    return currentGame.value?.next_clarification_cost ?? 1;
  });

  // Синхронизация displayCell с currentCell вне анимации
  watch(
    currentCell,
    (val) => {
      if (!isChipAnimating.value) {
        displayCell.value = val;
      }
    },
    { immediate: true },
  );

  // Прогресс обновляется только после завершения движения фишки.
  watch(
    [currentCell, isChipAnimating],
    ([cell, animating]) => {
      if (!animating) {
        progressCell.value = cell;
      }
    },
    { immediate: true },
  );

  // Вспомогательные функции

  /**
   * Получить уровень чакры для клетки (1-8)
   */
  function getChakraLevel(cellId: number): number {
    return cellIdToChakraLevel(cellId);
  }

  // Данные о переходах из reference store (SSOT)
  const referenceStore = useReferenceStore();
  const arrowsMap = computed(() => referenceStore.arrowsMap);
  const snakesMap = computed(() => referenceStore.snakesMap);
  const maxCell = computed(() => referenceStore.maxCell);

  /**
   * Проверить, является ли клетка началом стрелы
   */
  function isArrowStart(cellId: number): boolean {
    return cellId in arrowsMap.value;
  }

  /**
   * Проверить, является ли клетка головой змеи
   */
  function isSnakeHead(cellId: number): boolean {
    return cellId in snakesMap.value;
  }

  /**
   * Получить информацию о переходе для клетки
   */
  function getTransition(cellId: number): { type: TransitionType; to: number | null } {
    if (cellId in arrowsMap.value) {
      return { type: 'arrow', to: arrowsMap.value[cellId] ?? null };
    }
    if (cellId in snakesMap.value) {
      return { type: 'snake', to: snakesMap.value[cellId] ?? null };
    }
    return { type: 'none', to: null };
  }

  /**
   * Проверить, находится ли клетка в зоне ожидания (69-71)
   */
  function isInWaitingZoneCell(cellId: number): boolean {
    return WAITING_ZONE.has(cellId);
  }

  /**
   * Освободить object URL, если он создан через URL.createObjectURL.
   */
  function revokeMeditationAudioUrl(): void {
    if (!meditationAudioUrl.value) return;
    if (!meditationAudioUrl.value.startsWith('blob:')) return;
    if (typeof URL === 'undefined') return;

    URL.revokeObjectURL(meditationAudioUrl.value);
  }

  // Действия

  /**
   * Создать новую игру
   */
  async function createGame(payload: GameCreate): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const game = await gamesApi.create(payload);
      currentGame.value = game as GameDetail;
      moves.value = [];
      currentDiceRolls.value = [];
      lastTransition.value = 'none';
      requiresAnotherRoll.value = false;
      pendingAutoRolls.value = [];
      pendingManualRolls.value = [];
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось создать игру';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить существующую игру
   */
  async function loadGame(gameId: number): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const [game, gameMoves] = await Promise.all([
        gamesApi.get(gameId),
        gamesApi.getMoves(gameId),
      ]);

      currentGame.value = game;
      moves.value = gameMoves;
      pendingAutoRolls.value = [];
      pendingManualRolls.value = [];

      if (game.current_cell > 0) {
        currentCellInfo.value = await getCellInfo(game.current_cell);
      } else {
        currentCellInfo.value = null;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось загрузить игру';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить последнюю активную игру пользователя.
   */
  async function loadLatestActiveGame(): Promise<boolean> {
    try {
      const response = await gamesApi.list({ limit: 20, offset: 0 });
      const activeGame = response.items.find((item) => isActiveGameStatus(item.status));

      if (!activeGame) {
        return false;
      }

      return await loadGame(activeGame.id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось загрузить активную игру';
      return false;
    }
  }

  function validateRollPreconditions(): boolean {
    if (!currentGame.value || !isGameActive.value) {
      error.value = 'Нет активной игры';
      return false;
    }

    if (needsEntryMeditation.value) {
      error.value = 'Сначала необходимо выполнить входную медитацию';
      return false;
    }

    return true;
  }

  function applyFinalMoveResponse(response: MoveResponse): boolean {
    if (!currentGame.value || !response.move || !response.cell_info || !response.game_status) {
      error.value = 'Некорректный ответ сервера';
      return false;
    }

    // Обновить состояние
    moves.value.push(response.move);
    currentDiceRolls.value = response.move.dice_rolls;
    lastTransition.value = response.move.transition_type;
    currentCellInfo.value = response.cell_info;
    requiresAnotherRoll.value = response.requires_another_roll;

    // Сохранить данные анимации ДО обновления current_cell
    isChipAnimating.value = true;
    pendingAnimation = {
      startCell: response.move.start_cell,
      endCell: response.move.end_cell,
      finalCell: response.move.final_cell,
      transitionType: response.move.transition_type,
    };

    // Обновить состояние игры
    currentGame.value.status = response.game_status;
    currentGame.value.current_cell = response.move.final_cell;
    currentGame.value.total_moves = response.move.move_number;

    if (response.move.transition_type === 'arrow') {
      currentGame.value.arrows_hit += 1;
    } else if (response.move.transition_type === 'snake') {
      currentGame.value.snakes_hit += 1;
    }

    if (response.move.final_cell > currentGame.value.highest_cell) {
      currentGame.value.highest_cell = response.move.final_cell;
    }

    return true;
  }

  /**
   * Один авто-бросок кубика.
   */
  async function rollDiceAuto(): Promise<MoveResponse | null> {
    if (!validateRollPreconditions() || !currentGame.value) {
      return null;
    }

    isRolling.value = true;
    error.value = null;

    try {
      const response = await gamesApi.rollDice(currentGame.value.id, { is_manual: false });

      if (response.requires_another_roll && response.intermediate) {
        pendingAutoRolls.value = [...response.intermediate.accumulated_rolls];
        currentDiceRolls.value = [...response.intermediate.accumulated_rolls];
        requiresAnotherRoll.value = true;
        return response;
      }

      if (!applyFinalMoveResponse(response)) {
        return null;
      }

      pendingAutoRolls.value = [];
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось сделать ход';
      return null;
    } finally {
      isRolling.value = false;
    }
  }

  /**
   * Финальный ручной бросок с передачей накопленных шестёрок.
   */
  async function rollDiceManual(finalValue: number): Promise<MoveResponse | null> {
    if (!validateRollPreconditions() || !currentGame.value) {
      return null;
    }

    isRolling.value = true;
    error.value = null;

    try {
      const request: DiceRollRequest = {
        is_manual: true,
        manual_value: finalValue,
        previous_manual_rolls: [...pendingManualRolls.value],
      };
      const response = await gamesApi.rollDice(currentGame.value.id, request);

      if (!applyFinalMoveResponse(response)) {
        return null;
      }

      pendingManualRolls.value = [];
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось сделать ход';
      return null;
    } finally {
      isRolling.value = false;
    }
  }

  /**
   * Добавить выбранную вручную 6 без запроса на backend.
   */
  function addManualSix(): number[] {
    pendingManualRolls.value.push(6);
    currentDiceRolls.value = [...pendingManualRolls.value];
    requiresAnotherRoll.value = true;
    return [...pendingManualRolls.value];
  }

  /**
   * Сбросить накопленные ручные броски.
   */
  function resetManualRolls(): void {
    pendingManualRolls.value = [];
    if (pendingAutoRolls.value.length === 0) {
      currentDiceRolls.value = [];
      requiresAnotherRoll.value = false;
    }
  }

  /**
   * @deprecated Используйте rollDiceAuto/rollDiceManual.
   */
  async function rollDice(manualValue?: number): Promise<MoveResponse | null> {
    if (manualValue === undefined) {
      return await rollDiceAuto();
    }
    return await rollDiceManual(manualValue);
  }

  /**
   * Завершить входную медитацию
   */
  async function completeEntryMeditation(): Promise<boolean> {
    if (!currentGame.value) return false;

    try {
      const game = await gamesApi.completeEntryMeditation(currentGame.value.id);
      currentGame.value.entry_meditation_completed = game.entry_meditation_completed;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось завершить медитацию';
      return false;
    }
  }

  /**
   * Завершить выходную медитацию
   */
  async function completeExitMeditation(): Promise<boolean> {
    if (!currentGame.value) return false;

    try {
      const game = await gamesApi.completeExitMeditation(currentGame.value.id);
      currentGame.value.exit_meditation_completed = game.exit_meditation_completed;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось завершить медитацию';
      return false;
    }
  }

  /**
   * Завершить текущую игру
   */
  async function endGame(abandon = false): Promise<boolean> {
    if (!currentGame.value) return false;

    try {
      const game = await gamesApi.end(currentGame.value.id, abandon);
      currentGame.value.status = game.status;
      currentGame.value.completed_at = game.completed_at;
      currentGame.value.magic_time_ends_at = game.magic_time_ends_at;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Не удалось завершить игру';
      return false;
    }
  }

  /**
   * Сохранить озарение для хода
   */
  async function saveInsight(moveId: number, insight: string): Promise<boolean> {
    try {
      const updatedMove = await movesApi.saveInsight(moveId, { insight });

      const move = moves.value.find((m) => m.id === moveId);
      if (move) {
        move.player_insight = updatedMove.player_insight;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Загрузить аудио медитации по типу.
   */
  async function loadMeditationAudio(type: MeditationAudioType): Promise<void> {
    isMeditationAudioLoading.value = true;
    meditationAudioError.value = null;

    try {
      revokeMeditationAudioUrl();
      meditationAudioUrl.value = '';

      const response = await audioApi.getByType(type);
      const firstAudio = response.items[0];
      if (!firstAudio) {
        return;
      }

      const audioBlob = await audioApi.getStreamBlob(firstAudio.id);
      meditationAudioUrl.value = URL.createObjectURL(audioBlob);
    } catch (err: unknown) {
      revokeMeditationAudioUrl();
      meditationAudioUrl.value = '';
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const detail = axiosErr?.response?.data?.detail;
      meditationAudioError.value = detail || 'Не удалось загрузить аудио медитации';
    } finally {
      isMeditationAudioLoading.value = false;
    }
  }

  /**
   * Очистить URL медитационного аудио и освободить ресурсы браузера.
   */
  function clearMeditationAudio(): void {
    revokeMeditationAudioUrl();
    meditationAudioUrl.value = '';
    meditationAudioError.value = null;
  }

  /**
   * Получить полную информацию о клетке по ID (lazy-loading)
   */
  async function getCellInfo(cellId: number, forceRefresh = false): Promise<Cell | null> {
    const referenceStore = useReferenceStore();
    return referenceStore.fetchCellById(cellId, forceRefresh);
  }

  /**
   * Пошаговая анимация фишки по доске.
   * Перемещает displayCell клетка за клеткой от startCell до endCell,
   * при стреле/змее — пауза и прыжок на finalCell.
   */
  async function startChipAnimation(): Promise<void> {
    const anim = pendingAnimation;
    pendingAnimation = null;

    if (!anim) {
      isChipAnimating.value = false;
      return;
    }

    const { startCell: from, endCell: to, finalCell: final, transitionType } = anim;

    // Первый вход на доску (start_cell = 0): появление сразу на endCell
    if (from === 0) {
      await sleep(200);
      displayCell.value = to;
      await sleep(300);
    } else {
      // Пошаговая анимация
      const steps = Math.abs(to - from);
      const stepDelay = steps <= 3 ? 320 : steps <= 6 ? 260 : 200;

      for (let cell = from + 1; cell <= to; cell++) {
        displayCell.value = cell;
        await sleep(stepDelay);
      }
    }

    // Переход (стрела/змея): запускаем SVG-анимацию оверлея
    if (transitionType !== 'none' && final !== to) {
      displayCell.value = -1;
      activeTransition.value = {
        type: transitionType,
        startCellId: to,
        endCellId: final,
      };

      await new Promise<void>((resolve) => {
        let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
        let isResolved = false;
        const safeResolve = () => {
          if (isResolved) return;
          isResolved = true;
          if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
          resolve();
        };

        fallbackTimer = setTimeout(safeResolve, 5000);
        transitionAnimationResolver.value = safeResolve;
      });

      displayCell.value = final;
      activeTransition.value = null;
      transitionAnimationResolver.value = null;
      await sleep(200);
    }

    isChipAnimating.value = false;
  }

  function onTransitionAnimationEnd(): void {
    transitionAnimationResolver.value?.();
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Сбросить хранилище при выходе
   */
  function reset(): void {
    currentGame.value = null;
    moves.value = [];
    currentCellInfo.value = null;
    currentDiceRolls.value = [];
    lastTransition.value = 'none';
    requiresAnotherRoll.value = false;
    pendingAutoRolls.value = [];
    pendingManualRolls.value = [];
    displayCell.value = 0;
    isChipAnimating.value = false;
    activeTransition.value = null;
    transitionAnimationResolver.value = null;
    pendingAnimation = null;
    clearMeditationAudio();
    isMeditationAudioLoading.value = false;
    error.value = null;
  }

  return {
    // Данные переходов (из API)
    arrowsMap,
    snakesMap,
    maxCell,

    // Константы
    WINNING_CELL,
    CHAKRA_ROWS,
    CELLS_PER_ROW,
    WAITING_ZONE,

    // Состояние
    currentGame,
    moves,
    currentCellInfo,
    isLoading,
    isRolling,
    error,
    meditationAudioUrl,
    isMeditationAudioLoading,
    meditationAudioError,
    currentDiceRolls,
    lastTransition,
    requiresAnotherRoll,
    pendingAutoRolls,
    pendingManualRolls,
    displayCell,
    progressCell,
    isChipAnimating,
    activeTransition,

    // Вычисляемые значения
    isGameActive,
    isWaitingFor6,
    isInProgress,
    isInWaitingZone,
    isGameCompleted,
    isGameAbandoned,
    currentCell,
    needsEntryMeditation,
    needsExitMeditation,
    moveHistory,
    totalMoves,
    arrowsHit,
    snakesHit,
    highestCell,
    clarificationsFreeLeft,
    nextClarificationCost,

    // Вспомогательные функции
    getChakraLevel,
    isArrowStart,
    isSnakeHead,
    getTransition,
    isInWaitingZoneCell,

    // Действия
    createGame,
    loadGame,
    loadLatestActiveGame,
    rollDice,
    rollDiceAuto,
    rollDiceManual,
    addManualSix,
    resetManualRolls,
    getCellInfo,
    completeEntryMeditation,
    completeExitMeditation,
    endGame,
    saveInsight,
    loadMeditationAudio,
    clearMeditationAudio,
    startChipAnimation,
    onTransitionAnimationEnd,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGameStore, import.meta.hot));
}

import { api } from 'src/lib/api-client';
import { apiFetch } from './fetch';
import type {
  AIHistoryResponse,
  ClarificationHistoryResponse,
  ClarificationStreamEvent,
  DiceRollRequest,
  FinaleImageStreamEvent,
  GameCreate,
  GameDetail,
  GameDiaryResponse,
  GameFinaleImageJob,
  GameFinaleImageDownloadLink,
  GameFinaleState,
  GameFinaleSummary,
  GameFinaleTelegramSharePayload,
  GameListResponse,
  GameOut,
  MoveOut,
  MoveMentorResponse,
  MoveResponse,
} from 'src/types/game.interface';

interface SseMessage {
  event: string;
  data: string;
}

function readStringField(data: Record<string, unknown>, key: string, fallback = ''): string {
  const value = data[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}

function readNumberField(data: Record<string, unknown>, key: string, fallback = 0): number {
  const value = data[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readObjectField(
  data: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const value = data[key];
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function drainSseMessages(buffer: string): { messages: SseMessage[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const chunks = normalized.split('\n\n');
  const rest = chunks.pop() ?? '';
  const messages = chunks
    .map((chunk): SseMessage | null => {
      const lines = chunk
        .split('\n')
        .map((line) => line.trimEnd())
        .filter(Boolean);
      if (!lines.length) return null;

      let event = 'message';
      const dataParts: string[] = [];
      for (const line of lines) {
        if (line.startsWith('event:')) {
          event = line.slice('event:'.length).trim();
          continue;
        }
        if (line.startsWith('data:')) {
          dataParts.push(line.slice('data:'.length).trimStart());
        }
      }
      if (!dataParts.length) return null;
      return { event, data: dataParts.join('\n') };
    })
    .filter((message): message is SseMessage => message !== null);
  return { messages, rest };
}

function mapClarificationSseEvent(message: SseMessage): ClarificationStreamEvent | null {
  let payload: unknown;
  try {
    payload = JSON.parse(message.data);
  } catch {
    return null;
  }

  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const data = payload as Record<string, unknown>;

  if (message.event === 'meta') {
    return {
      type: 'meta',
      question: readStringField(data, 'question', ''),
      cost_tkn: readNumberField(data, 'cost_tkn', 0),
      balance_tkn: readNumberField(data, 'balance_tkn', 0),
    };
  }
  if (message.event === 'delta') {
    return {
      type: 'delta',
      text: readStringField(data, 'text', ''),
    };
  }
  if (message.event === 'done') {
    return {
      type: 'done',
      answer: readStringField(data, 'answer', ''),
    };
  }
  if (message.event === 'error') {
    return {
      type: 'error',
      message: readStringField(data, 'message', 'errors.ai_clarification_generation_failed'),
    };
  }
  return null;
}

function mapFinaleImageSseEvent(message: SseMessage): FinaleImageStreamEvent | null {
  let payload: unknown;
  try {
    payload = JSON.parse(message.data);
  } catch {
    return null;
  }

  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const data = payload as Record<string, unknown>;
  const job = readObjectField(data, 'job');

  if (message.event === 'meta' && job) {
    return {
      type: 'meta',
      job: job as unknown as GameFinaleImageJob,
    };
  }
  if (message.event === 'progress' && job) {
    return {
      type: 'progress',
      job: job as unknown as GameFinaleImageJob,
    };
  }
  if (message.event === 'artifact') {
    const artifact = readObjectField(data, 'artifact');
    if (!artifact || !job) return null;
    return {
      type: 'artifact',
      artifact: artifact as unknown as GameFinaleImageJob['artifacts'][number],
      job: job as unknown as GameFinaleImageJob,
    };
  }
  if (message.event === 'done' && job) {
    return {
      type: 'done',
      job: job as unknown as GameFinaleImageJob,
    };
  }
  if (message.event === 'error') {
    return {
      type: 'error',
      message: readStringField(data, 'message', 'errors.ai_internal_error'),
    };
  }

  return null;
}

/**
 * API игр.
 */
export const gamesApi = {
  /**
   * Получить список игр пользователя.
   */
  async list(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<GameListResponse> {
    const response = await api.get<GameListResponse>('/games', { params });
    return response.data;
  },

  /**
   * Создать новую игру.
   */
  async create(data: GameCreate): Promise<GameOut> {
    const response = await api.post<GameOut>('/games', data);
    return response.data;
  },

  /**
   * Получить игру по ID.
   */
  async get(gameId: number): Promise<GameDetail> {
    const response = await api.get<GameDetail>(`/games/${gameId}`);
    return response.data;
  },

  /**
   * Получить агрегированные данные для дневника игры.
   */
  async getDiary(gameId: number, sort: 'asc' | 'desc' = 'desc'): Promise<GameDiaryResponse> {
    const response = await api.get<GameDiaryResponse>(`/games/${gameId}/diary`, { params: { sort } });
    return response.data;
  },

  /**
   * Получить агрегированное состояние финала игры.
   */
  async getFinaleState(gameId: number): Promise<GameFinaleState> {
    const response = await api.get<GameFinaleState>(`/games/${gameId}/finale`);
    return response.data;
  },

  /**
   * Идемпотентно сгенерировать итоговый AI summary.
   */
  async generateFinaleSummary(gameId: number): Promise<GameFinaleSummary> {
    const response = await api.post<GameFinaleSummary>(`/games/${gameId}/finale/summary/generate`);
    return response.data;
  },

  /**
   * Сгенерировать финальный ответ AI ментора (итог + план 72 часа).
   * На текущем этапе использует тот же backend endpoint, что и summary.
   */
  async generateFinaleMentor(gameId: number): Promise<GameFinaleSummary> {
    return this.generateFinaleSummary(gameId);
  },

  /**
   * Запустить async-генерацию AI-арта.
   */
  async generateFinaleImage(gameId: number): Promise<GameFinaleImageJob> {
    const response = await api.post<GameFinaleImageJob>(`/games/${gameId}/finale/image/generate`);
    return response.data;
  },

  /**
   * Получить статус фоновой генерации финального AI-арта.
   */
  async getFinaleImageJob(gameId: number, jobId: string): Promise<GameFinaleImageJob> {
    const response = await api.get<GameFinaleImageJob>(
      `/games/${gameId}/finale/image/jobs/${jobId}`,
    );
    return response.data;
  },

  /**
   * Скачать финальный AI-арт как Blob.
   */
  async downloadFinaleImage(gameId: number, artifactId: number): Promise<Blob> {
    const response = await api.get<Blob>(`/games/${gameId}/finale/image/${artifactId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Получить временную Telegram-совместимую ссылку на артефакт.
   */
  async getFinaleImageTelegramFile(
    gameId: number,
    artifactId: number,
  ): Promise<GameFinaleImageDownloadLink> {
    const response = await api.get<GameFinaleImageDownloadLink>(
      `/games/${gameId}/finale/image/${artifactId}/telegram-file`,
    );
    return response.data;
  },

  /**
   * Подготовить Telegram payload для сторис и пересылки в чаты.
   */
  async createFinaleImageTelegramShare(
    gameId: number,
    artifactId: number,
  ): Promise<GameFinaleTelegramSharePayload> {
    const response = await api.post<GameFinaleTelegramSharePayload>(
      `/games/${gameId}/finale/image/${artifactId}/telegram-share`,
    );
    return response.data;
  },

  /**
   * Завершить входную медитацию.
   */
  async completeEntryMeditation(gameId: number): Promise<GameOut> {
    const response = await api.post<GameOut>(`/games/${gameId}/meditation/entry`);
    return response.data;
  },

  /**
   * Завершить выходную медитацию.
   */
  async completeExitMeditation(gameId: number): Promise<GameOut> {
    const response = await api.post<GameOut>(`/games/${gameId}/meditation/exit`);
    return response.data;
  },

  /**
   * Завершить игру.
   */
  async end(gameId: number, abandon = false): Promise<GameOut> {
    const response = await api.post<GameOut>(`/games/${gameId}/end`, null, {
      params: { abandon },
    });
    return response.data;
  },

  /**
   * Получить ходы игры.
   */
  async getMoves(gameId: number, sort: 'asc' | 'desc' = 'desc'): Promise<MoveOut[]> {
    const response = await api.get<MoveOut[]>(`/games/${gameId}/moves`, { params: { sort } });
    return response.data;
  },

  /**
   * Сгенерировать (или получить сохранённую) интерпретацию AI-ментора для хода.
   */
  async generateMoveMentor(gameId: number, moveId: number): Promise<MoveMentorResponse> {
    const response = await api.post<MoveMentorResponse>(`/games/${gameId}/moves/${moveId}/mentor`);
    return response.data;
  },

  /**
   * Получить историю AI-взаимодействий игры.
   */
  async getAiHistory(gameId: number): Promise<AIHistoryResponse> {
    const response = await api.get<AIHistoryResponse>(`/games/${gameId}/ai-history`);
    return response.data;
  },

  /**
   * Получить историю уточняющих вопросов AI Ментору.
   */
  async getClarificationHistory(
    gameId: number,
    cellId?: number,
  ): Promise<ClarificationHistoryResponse> {
    const params = cellId !== undefined ? { cell_id: cellId } : undefined;
    const response = await api.get<ClarificationHistoryResponse>(
      `/ai/games/${gameId}/clarify/history`,
      { params },
    );
    return response.data;
  },

  /**
   * Бросить кубик.
   */
  async rollDice(gameId: number, data?: DiceRollRequest): Promise<MoveResponse> {
    const response = await api.post<MoveResponse>(`/games/${gameId}/moves/roll`, data || {});
    return response.data;
  },

  /**
   * Задать уточняющий вопрос AI Ментору по текущей игре (SSE поток).
   */
  async *askClarificationStream(
    gameId: number,
    question: string,
    signal?: AbortSignal,
  ): AsyncGenerator<ClarificationStreamEvent> {
    const response = await apiFetch(`/ai/games/${gameId}/clarify/stream`, {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
      ...(signal ? { signal } : {}),
    });

    if (!response.ok) {
      let detail = 'errors.ai_clarification_generation_failed';
      try {
        const errorData = (await response.json()) as { detail?: string };
        if (typeof errorData?.detail === 'string' && errorData.detail) {
          detail = errorData.detail;
        }
      } catch {
        // no-op: оставить дефолтный detail
      }
      throw new Error(detail);
    }

    if (!response.body) {
      throw new Error('errors.ai_clarification_generation_failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { messages, rest } = drainSseMessages(buffer);
        buffer = rest;
        for (const message of messages) {
          const event = mapClarificationSseEvent(message);
          if (!event) continue;
          if (event.type === 'error') {
            throw new Error(event.message);
          }
          yield event;
        }
      }

      buffer += decoder.decode();
      const { messages } = drainSseMessages(buffer);
      for (const message of messages) {
        const event = mapClarificationSseEvent(message);
        if (!event) continue;
        if (event.type === 'error') {
          throw new Error(event.message);
        }
        yield event;
      }
    } finally {
      reader.releaseLock();
    }
  },

  /**
   * Подписаться на SSE-стрим статуса генерации финального AI-арта.
   */
  async *streamFinaleImageJob(
    gameId: number,
    jobId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<FinaleImageStreamEvent> {
    const response = await apiFetch(`/games/${gameId}/finale/image/jobs/${jobId}/stream`, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
      },
      ...(signal ? { signal } : {}),
    });

    if (!response.ok) {
      let detail = 'errors.ai_internal_error';
      try {
        const errorData = (await response.json()) as { detail?: string };
        if (typeof errorData?.detail === 'string' && errorData.detail) {
          detail = errorData.detail;
        }
      } catch {
        // no-op: оставить дефолтный detail
      }
      throw new Error(detail);
    }

    if (!response.body) {
      throw new Error('errors.ai_internal_error');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { messages, rest } = drainSseMessages(buffer);
        buffer = rest;
        for (const message of messages) {
          const event = mapFinaleImageSseEvent(message);
          if (!event) continue;
          if (event.type === 'error') {
            throw new Error(event.message);
          }
          yield event;
          if (event.type === 'done') {
            return;
          }
        }
      }

      buffer += decoder.decode();
      const { messages } = drainSseMessages(buffer);
      for (const message of messages) {
        const event = mapFinaleImageSseEvent(message);
        if (!event) continue;
        if (event.type === 'error') {
          throw new Error(event.message);
        }
        yield event;
        if (event.type === 'done') {
          return;
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

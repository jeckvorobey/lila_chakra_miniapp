import { api, buildApiResourceUrl } from 'src/boot/axios';
import type {
  ClarificationStreamEvent,
  DiceRollRequest,
  GameCreate,
  GameDetail,
  GameListResponse,
  GameOut,
  MoveOut,
  MoveResponse,
} from 'src/types/game.interface';

interface SseMessage {
  event: string;
  data: string;
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
      question: String(data.question ?? ''),
      cost_tkn: Number(data.cost_tkn ?? 0),
      balance_tkn: Number(data.balance_tkn ?? 0),
      free_left: Number(data.free_left ?? 0),
    };
  }
  if (message.event === 'delta') {
    return {
      type: 'delta',
      text: String(data.text ?? ''),
    };
  }
  if (message.event === 'done') {
    return {
      type: 'done',
      answer: String(data.answer ?? ''),
    };
  }
  if (message.event === 'error') {
    return {
      type: 'error',
      message: String(data.message ?? 'errors.ai_clarification_generation_failed'),
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
    const authorizationHeader = api.defaults.headers.common['Authorization'];
    const url = buildApiResourceUrl(`/ai/games/${gameId}/clarify/stream`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
        ...(typeof authorizationHeader === 'string'
          ? { Authorization: authorizationHeader }
          : {}),
      },
      body: JSON.stringify({ question }),
      signal: signal ?? null,
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
};

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApi, mockApiFetch } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
  mockApiFetch: vi.fn(),
}));

vi.mock('src/lib/api-client', () => ({
  api: mockApi,
}));

vi.mock('../fetch', () => ({
  apiFetch: mockApiFetch,
}));

import { gamesApi } from '../games.api';

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('gamesApi stream requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('запрашивает статус finale image job через axios helper', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        job_id: 'job-1',
        game_id: 21,
        status: 'processing',
        error: null,
        artifact_id: null,
        artifacts: [],
        artifacts_count: 0,
        errors: [],
        created_at: '2026-03-07T10:00:00Z',
        updated_at: '2026-03-07T10:00:01Z',
      },
    });

    const result = await gamesApi.getFinaleImageJob(21, 'job-1');

    expect(mockApi.get).toHaveBeenCalledWith('/games/21/finale/image/jobs/job-1');
    expect(result).toMatchObject({
      job_id: 'job-1',
      status: 'processing',
    });
  });

  it('открывает finale image stream через общий apiFetch helper', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response('event: done\ndata: {"job":{"job_id":"job-1","status":"completed"}}\n\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
        },
      }),
    );

    const events: Array<{ type: string }> = [];
    for await (const event of gamesApi.streamFinaleImageJob(21, 'job-1')) {
      events.push({ type: event.type });
    }

    expect(mockApiFetch).toHaveBeenCalledWith('/games/21/finale/image/jobs/job-1/stream', {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
      },
    });
    expect(events).toEqual([{ type: 'done' }]);
  });

  it('пробрасывает backend detail при 401 от finale image stream', async () => {
    mockApiFetch.mockResolvedValueOnce(
      createJsonResponse({ detail: 'Неверный или истёкший токен' }, 401),
    );

    await expect(async () => {
      for await (const event of gamesApi.streamFinaleImageJob(21, 'job-1')) {
        void event;
        // no-op
      }
    }).rejects.toThrow('Неверный или истёкший токен');
  });

  it('отправляет clarification stream через тот же helper с body', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(
        'event: meta\ndata: {"question":"Q","cost_tkn":0,"balance_tkn":10}\n\n' +
          'event: done\ndata: {"answer":"A"}\n\n',
        {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
          },
        },
      ),
    );

    const events: Array<{ type: string }> = [];
    for await (const event of gamesApi.askClarificationStream(7, 'Q')) {
      events.push({ type: event.type });
    }

    expect(mockApiFetch).toHaveBeenCalledWith('/ai/games/7/clarify/stream', {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: 'Q' }),
    });
    expect(events).toEqual([{ type: 'meta' }, { type: 'done' }]);
  });
});

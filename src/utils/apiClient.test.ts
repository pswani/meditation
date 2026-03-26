import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError, requestJson } from './apiClient';

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests JSON from the configured API path', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestJson<{ status: string }>('/health', { apiBaseUrl: 'http://localhost:8080/api' })).resolves.toEqual({
      status: 'ok',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/health',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      })
    );
  });

  it('throws a typed error when the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down'))
    );

    await expect(requestJson('/health')).rejects.toMatchObject<ApiClientError>({
      name: 'ApiClientError',
      kind: 'network',
      status: null,
      url: '/api/health',
    });
  });

  it('throws a typed error for non-ok responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'backend unavailable',
      })
    );

    await expect(requestJson('/health')).rejects.toMatchObject<ApiClientError>({
      name: 'ApiClientError',
      kind: 'http',
      status: 503,
      detail: 'backend unavailable',
    });
  });

  it('throws a typed error for invalid JSON responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('bad json');
        },
      })
    );

    await expect(requestJson('/health')).rejects.toMatchObject<ApiClientError>({
      name: 'ApiClientError',
      kind: 'invalid-json',
      status: 200,
    });
  });

  it('sends JSON bodies for write requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ saved: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      requestJson<{ saved: boolean }, { label: string }>('/media/custom-plays', {
        method: 'POST',
        apiBaseUrl: 'http://localhost:8080/api',
        body: { label: 'Evening Sit' },
      })
    ).resolves.toEqual({ saved: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/media/custom-plays',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ label: 'Evening Sit' }),
        headers: expect.objectContaining({
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});

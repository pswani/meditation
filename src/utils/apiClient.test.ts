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
      status: 503,
      detail: 'backend unavailable',
    });
  });
});

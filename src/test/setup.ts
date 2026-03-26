import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { afterEach, beforeEach, expect, vi } from 'vitest';

const defaultTimerSettingsResponse = {
  id: 'default',
  durationMinutes: 20,
  meditationType: '',
  startSound: 'None',
  endSound: 'Temple Bell',
  intervalEnabled: false,
  intervalMinutes: 5,
  intervalSound: 'Temple Bell',
  updatedAt: '2026-03-26T12:00:00.000Z',
};

const defaultMediaCatalogResponse = [
  {
    id: 'media-vipassana-sit-20',
    label: 'Vipassana Sit (20 min)',
    filePath: '/media/custom-plays/vipassana-sit-20.mp3',
    relativePath: 'custom-plays/vipassana-sit-20.mp3',
    durationSeconds: 1200,
    mimeType: 'audio/mpeg',
    sizeBytes: 9200000,
    updatedAt: '2026-03-24T08:00:00.000Z',
  },
  {
    id: 'media-ajapa-breath-15',
    label: 'Ajapa Breath Cycle (15 min)',
    filePath: '/media/custom-plays/ajapa-breath-15.mp3',
    relativePath: 'custom-plays/ajapa-breath-15.mp3',
    durationSeconds: 900,
    mimeType: 'audio/mpeg',
    sizeBytes: 6900000,
    updatedAt: '2026-03-24T08:00:00.000Z',
  },
  {
    id: 'media-tratak-focus-10',
    label: 'Tratak Focus Bellset (10 min)',
    filePath: '/media/custom-plays/tratak-focus-10.mp3',
    relativePath: 'custom-plays/tratak-focus-10.mp3',
    durationSeconds: 600,
    mimeType: 'audio/mpeg',
    sizeBytes: 4500000,
    updatedAt: '2026-03-24T08:00:00.000Z',
  },
];

function createJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

expect.extend(matchers);

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? 'GET';

      if (url.endsWith('/api/settings/timer') && method === 'GET') {
        return createJsonResponse(200, defaultTimerSettingsResponse);
      }

      if (url.endsWith('/api/settings/timer') && method === 'PUT') {
        return createJsonResponse(200, {
          ...defaultTimerSettingsResponse,
          ...(typeof init?.body === 'string' ? JSON.parse(init.body) : {}),
          updatedAt: '2026-03-26T12:05:00.000Z',
        });
      }

      if (url.endsWith('/api/session-logs') && method === 'GET') {
        return createJsonResponse(200, []);
      }

      if (url.includes('/api/session-logs/') && method === 'PUT') {
        return createJsonResponse(200, typeof init?.body === 'string' ? JSON.parse(init.body) : {});
      }

      if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
        return createJsonResponse(200, defaultMediaCatalogResponse);
      }

      return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
    })
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

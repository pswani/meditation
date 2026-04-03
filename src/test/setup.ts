import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import sampleCustomPlayMediaCatalog from '../data/customPlayMediaCatalog.json';

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

const defaultMediaCatalogResponse = sampleCustomPlayMediaCatalog.map((entry) => ({
  ...entry,
  relativePath: entry.filePath.startsWith('/media/') ? entry.filePath.slice('/media/'.length) : entry.filePath,
}));

class TestAudio {
  preload = 'auto';
  currentTime = 0;

  constructor(readonly src: string) {}

  play() {
    void this.src;
    return Promise.resolve();
  }
}

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
  vi.stubGlobal('Audio', TestAudio as unknown as typeof Audio);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

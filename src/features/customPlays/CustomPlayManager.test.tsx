import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetCustomPlayMediaAssetCatalogForTests } from '../../utils/mediaAssetApi';
import { SyncStatusProvider } from '../sync/SyncStatusProvider';
import { TimerProvider } from '../timer/TimerContext';
import CustomPlayRunPage from '../../pages/CustomPlayRunPage';
import PracticePage from '../../pages/PracticePage';

const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';

function createJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

async function waitForPracticeToolsReady() {
  await waitFor(() =>
    expect(screen.queryByText(/loading timer defaults/i)).not.toBeInTheDocument()
  );
  await waitFor(() => expect(screen.queryByText(/loading custom plays/i)).not.toBeInTheDocument());
}

describe('CustomPlayManager UX', () => {
  beforeEach(() => {
    localStorage.clear();
    resetCustomPlayMediaAssetCatalogForTests();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    localStorage.setItem(
      TIMER_SETTINGS_KEY,
      JSON.stringify({
        timerMode: 'fixed',
        durationMinutes: 20,
        lastFixedDurationMinutes: 20,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      })
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return createJsonResponse(200, {
            id: 'default',
            durationMinutes: 20,
            meditationType: 'Vipassana',
            startSound: 'None',
            endSound: 'Temple Bell',
            intervalEnabled: false,
            intervalMinutes: 5,
            intervalSound: 'Temple Bell',
            updatedAt: '2026-03-26T12:00:00.000Z',
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/custom-plays') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
          return createJsonResponse(200, [
            {
              id: 'media-vipassana-sit-20',
              label: 'Vipassana Sit (20 min)',
              meditationType: 'Vipassana',
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
              meditationType: 'Ajapa',
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
              meditationType: 'Tratak',
              filePath: '/media/custom-plays/tratak-focus-10.mp3',
              relativePath: 'custom-plays/tratak-focus-10.mp3',
              durationSeconds: 600,
              mimeType: 'audio/mpeg',
              sizeBytes: 4500000,
              updatedAt: '2026-03-24T08:00:00.000Z',
            },
          ]);
        }

        if (url.includes('/api/custom-plays/') && method === 'PUT') {
          return createJsonResponse(200, JSON.parse(String(init?.body ?? '{}')));
        }

        if (url.includes('/api/custom-plays/') && method === 'DELETE') {
          return {
            ok: true,
            status: 204,
            json: async () => ({}),
            text: async () => '',
          };
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('applies custom play values to timer setup and confirms deletion', async () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/practice/custom-plays/active" element={<CustomPlayRunPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeToolsReady();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));
    expect(await screen.findByText(/3 recordings available\./i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/custom play name/i), { target: { value: 'Morning Focus' } });
    fireEvent.change(screen.getByLabelText(/custom play meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.change(screen.getByLabelText(/custom play start sound \(optional\)/i), { target: { value: 'Temple Bell' } });
    fireEvent.change(screen.getByLabelText(/custom play end sound \(optional\)/i), { target: { value: 'Gong' } });
    expect(screen.getByText(/choose a recording to remember which session this custom play uses/i)).toBeInTheDocument();
    await screen.findByRole('option', { name: /vipassana sit \(20 min\) · vipassana/i });
    fireEvent.change(screen.getByRole('combobox', { name: /recording/i }), {
      target: { value: 'media-vipassana-sit-20' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /create custom play/i })[0]);

    expect(await screen.findByText(/custom play "Morning Focus" saved\./i)).toBeInTheDocument();
    expect(screen.getByText('Morning Focus')).toBeInTheDocument();
    expect(screen.getByText(/recording: vipassana sit \(20 min\) · vipassana/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /apply to timer/i }));
    expect(screen.getAllByText(/custom play "Morning Focus" applied to timer setup/i).length).toBeGreaterThan(0);

    const timerDurationField = screen.getAllByLabelText(/duration \(minutes\)/i)[0] as HTMLInputElement;
    const timerTypeField = screen.getAllByLabelText(/meditation type/i)[0] as HTMLSelectElement;
    expect(timerDurationField.value).toBe('20');
    expect(timerTypeField.value).toBe('Vipassana');

    fireEvent.click(screen.getByRole('button', { name: /show advanced options/i }));
    const timerStartSoundField = screen.getByLabelText(/^Start sound \(optional\)$/i) as HTMLSelectElement;
    const timerEndSoundField = screen.getByLabelText(/^End sound \(optional\)$/i) as HTMLSelectElement;
    expect(timerStartSoundField.value).toBe('Temple Bell');
    expect(timerEndSoundField.value).toBe('Gong');
    expect(JSON.parse(localStorage.getItem(TIMER_SETTINGS_KEY) ?? '{}')).toMatchObject({
      durationMinutes: 20,
      lastFixedDurationMinutes: 20,
      meditationType: 'Vipassana',
      startSound: 'None',
      endSound: 'Temple Bell',
    });

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog', { name: /delete custom play morning focus confirmation/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /keep custom play/i }));
    expect(screen.queryByRole('dialog', { name: /delete custom play morning focus confirmation/i })).not.toBeInTheDocument();
    expect(screen.getByText('Morning Focus')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete custom play/i }));

    await waitFor(() => expect(screen.queryByText('Morning Focus')).not.toBeInTheDocument());
  });

  it('shows explicit success feedback after updating a custom play', async () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/practice/custom-plays/active" element={<CustomPlayRunPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeToolsReady();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));
    fireEvent.change(screen.getByLabelText(/custom play name/i), { target: { value: 'Evening Reset' } });
    fireEvent.change(screen.getByLabelText(/custom play meditation type/i), { target: { value: 'Sahaj' } });
    await screen.findByRole('option', { name: /ajapa breath cycle \(15 min\) · ajapa/i });
    fireEvent.change(screen.getByRole('combobox', { name: /recording/i }), {
      target: { value: 'media-ajapa-breath-15' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /create custom play/i })[0]);

    expect(await screen.findByText(/custom play "Evening Reset" saved\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/custom play name/i), { target: { value: 'Evening Reset Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /update custom play/i }));

    expect(await screen.findByText(/custom play "Evening Reset Updated" updated\./i)).toBeInTheDocument();
  });

  it('shows an explicit integration warning when backend media data is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ unexpected: true }),
      })
    );

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/practice/custom-plays/active" element={<CustomPlayRunPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeToolsReady();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));

    expect(await screen.findByText(/built-in recording options shown while the recording library is unavailable/i)).toBeInTheDocument();
    expect(screen.getAllByText(/recording library data is unavailable right now/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/choose a recording to remember which session this custom play uses/i)).toBeInTheDocument();
  });

  it('keeps the latest custom play available when a queued delete is stale in the backend', async () => {
    let savedCustomPlay: Record<string, unknown> | null = null;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return createJsonResponse(200, {
            id: 'default',
            durationMinutes: 20,
            meditationType: 'Vipassana',
            startSound: 'None',
            endSound: 'Temple Bell',
            intervalEnabled: false,
            intervalMinutes: 5,
            intervalSound: 'Temple Bell',
            updatedAt: '2026-03-26T12:00:00.000Z',
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/custom-plays') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
          return createJsonResponse(200, [
            {
              id: 'media-vipassana-sit-20',
              label: 'Vipassana Sit (20 min)',
              meditationType: 'Vipassana',
              filePath: '/media/custom-plays/vipassana-sit-20.mp3',
              relativePath: 'custom-plays/vipassana-sit-20.mp3',
              durationSeconds: 1200,
              mimeType: 'audio/mpeg',
              sizeBytes: 9200000,
              updatedAt: '2026-03-24T08:00:00.000Z',
            },
          ]);
        }

        if (url.includes('/api/custom-plays/') && method === 'PUT') {
          savedCustomPlay = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
          return createJsonResponse(200, savedCustomPlay);
        }

        if (url.includes('/api/custom-plays/') && method === 'DELETE') {
          return createJsonResponse(200, {
            outcome: 'stale',
            currentCustomPlay: savedCustomPlay,
          });
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/practice/custom-plays/active" element={<CustomPlayRunPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeToolsReady();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));

    fireEvent.change(screen.getByLabelText(/custom play name/i), { target: { value: 'Morning Focus' } });
    fireEvent.change(screen.getByLabelText(/custom play meditation type/i), { target: { value: 'Vipassana' } });
    await screen.findByRole('option', { name: /vipassana sit \(20 min\) · vipassana/i });
    fireEvent.change(screen.getByRole('combobox', { name: /recording/i }), {
      target: { value: 'media-vipassana-sit-20' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /create custom play/i })[0]);

    expect(await screen.findByText(/custom play "Morning Focus" saved\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete custom play/i }));

    expect(
      await screen.findByText(/a newer custom play version already exists in the backend, so this delete was not applied/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Morning Focus')).toBeInTheDocument();
  });

  it('shows an actionable empty-state warning when the managed backend library has no media sessions yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return createJsonResponse(200, {
            id: 'default',
            durationMinutes: 20,
            meditationType: 'Vipassana',
            startSound: 'None',
            endSound: 'Temple Bell',
            intervalEnabled: false,
            intervalMinutes: 5,
            intervalSound: 'Temple Bell',
            updatedAt: '2026-03-26T12:00:00.000Z',
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/custom-plays') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/practice/custom-plays/active" element={<CustomPlayRunPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeToolsReady();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));

    expect(await screen.findByText(/no recordings are available yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/add a recording to the library, then reload this screen/i)
    ).toBeInTheDocument();
  });

  it('starts a saved custom play and navigates to the active custom-play screen', async () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/practice/custom-plays/active" element={<CustomPlayRunPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeToolsReady();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));
    await screen.findByRole('option', { name: /vipassana sit \(20 min\) · vipassana/i });

    fireEvent.change(screen.getByLabelText(/custom play name/i), { target: { value: 'Morning Focus' } });
    fireEvent.change(screen.getByLabelText(/custom play meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.change(screen.getByRole('combobox', { name: /recording/i }), {
      target: { value: 'media-vipassana-sit-20' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /create custom play/i })[0]);

    expect(await screen.findByText(/custom play "Morning Focus" saved\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start custom play/i }));

    expect(await screen.findByRole('heading', { level: 2, name: /morning focus/i })).toBeInTheDocument();
    expect(screen.getByText(/recording: vipassana sit \(20 min\)/i)).toBeInTheDocument();
    expect(screen.getByText(/^playing$/i)).toBeInTheDocument();
  });

  it('disables starting a custom play when its linked recording is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return createJsonResponse(200, {
            id: 'default',
            durationMinutes: 20,
            meditationType: 'Vipassana',
            startSound: 'None',
            endSound: 'Temple Bell',
            intervalEnabled: false,
            intervalMinutes: 5,
            intervalSound: 'Temple Bell',
            updatedAt: '2026-03-26T12:00:00.000Z',
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/custom-plays') && method === 'GET') {
          return createJsonResponse(200, [
            {
              id: 'custom-play-1',
              name: 'Morning Focus',
              meditationType: 'Vipassana',
              durationMinutes: 20,
              startSound: 'None',
              endSound: 'Temple Bell',
              mediaAssetId: 'media-backend-only',
              recordingLabel: '',
              favorite: false,
              createdAt: '2026-03-24T08:00:00.000Z',
              updatedAt: '2026-03-24T08:00:00.000Z',
            },
          ]);
        }

        if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
          return {
            ok: true,
            status: 200,
            json: async () => ({ unexpected: true }),
          };
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/practice/custom-plays/active" element={<CustomPlayRunPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeToolsReady();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));

    expect(await screen.findByText(/recording unavailable here/i)).toBeInTheDocument();
    expect(screen.getByText(/start is unavailable until the linked recording is available again/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start custom play/i })).toBeDisabled();
  });
});

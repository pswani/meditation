import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncStatusProvider } from '../sync/SyncStatusProvider';
import { TimerProvider } from '../timer/TimerContext';
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
    expect(screen.queryByText(/loading timer defaults from the backend before starting a session/i)).not.toBeInTheDocument()
  );
  await waitFor(() => expect(screen.queryByText(/loading custom plays from the backend/i)).not.toBeInTheDocument());
}

describe('CustomPlayManager UX', () => {
  beforeEach(() => {
    localStorage.clear();
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
              filePath: '/media/custom-plays/vipassana-sit-20.mp3',
              durationSeconds: 1200,
              mimeType: 'audio/mpeg',
              sizeBytes: 9200000,
              updatedAt: '2026-03-24T08:00:00.000Z',
            },
            {
              id: 'media-ajapa-breath-15',
              label: 'Ajapa Breath Cycle (15 min)',
              filePath: '/media/custom-plays/ajapa-breath-15.mp3',
              durationSeconds: 900,
              mimeType: 'audio/mpeg',
              sizeBytes: 6900000,
              updatedAt: '2026-03-24T08:00:00.000Z',
            },
            {
              id: 'media-tratak-focus-10',
              label: 'Tratak Focus Bellset (10 min)',
              filePath: '/media/custom-plays/tratak-focus-10.mp3',
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
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeToolsReady();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));

    fireEvent.change(screen.getByLabelText(/custom play name/i), { target: { value: 'Morning Focus' } });
    fireEvent.change(screen.getByLabelText(/custom play meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.change(screen.getByLabelText(/custom play duration \(minutes\)/i), { target: { value: '33' } });
    fireEvent.change(screen.getByLabelText(/custom play start sound \(optional\)/i), { target: { value: 'Temple Bell' } });
    fireEvent.change(screen.getByLabelText(/custom play end sound \(optional\)/i), { target: { value: 'Gong' } });
    expect(screen.getByText(/choose a linked media session to remember which recording this custom play uses/i)).toBeInTheDocument();
    await screen.findByRole('option', { name: /vipassana sit \(20 min\)/i });
    fireEvent.change(screen.getByLabelText(/media session \(optional\)/i), { target: { value: 'media-vipassana-sit-20' } });
    fireEvent.click(screen.getByRole('button', { name: /create custom play/i }));

    expect(await screen.findByText(/custom play "Morning Focus" saved\./i)).toBeInTheDocument();
    expect(screen.getByText('Morning Focus')).toBeInTheDocument();
    expect(screen.getByText(/media session: vipassana sit \(20 min\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/managed path/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /use custom play/i }));
    expect(screen.getByText(/custom play "Morning Focus" applied to timer setup/i)).toBeInTheDocument();

    const timerDurationField = screen.getAllByLabelText(/duration \(minutes\)/i)[0] as HTMLInputElement;
    const timerTypeField = screen.getAllByLabelText(/meditation type/i)[0] as HTMLSelectElement;
    expect(timerDurationField.value).toBe('33');
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
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeToolsReady();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));
    fireEvent.change(screen.getByLabelText(/custom play name/i), { target: { value: 'Evening Reset' } });
    fireEvent.change(screen.getByLabelText(/custom play meditation type/i), { target: { value: 'Sahaj' } });
    fireEvent.change(screen.getByLabelText(/custom play duration \(minutes\)/i), { target: { value: '22' } });
    await screen.findByRole('option', { name: /ajapa breath cycle \(15 min\)/i });
    fireEvent.change(screen.getByLabelText(/media session \(optional\)/i), { target: { value: 'media-ajapa-breath-15' } });
    fireEvent.click(screen.getByRole('button', { name: /create custom play/i }));

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
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeToolsReady();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));

    expect(await screen.findByText(/backend media session data is invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/choose a linked media session to remember which recording this custom play uses/i)).toBeInTheDocument();
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
              filePath: '/media/custom-plays/vipassana-sit-20.mp3',
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
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeToolsReady();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));

    fireEvent.change(screen.getByLabelText(/custom play name/i), { target: { value: 'Morning Focus' } });
    fireEvent.change(screen.getByLabelText(/custom play meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.change(screen.getByLabelText(/custom play duration \(minutes\)/i), { target: { value: '33' } });
    await screen.findByRole('option', { name: /vipassana sit \(20 min\)/i });
    fireEvent.change(screen.getByLabelText(/media session \(optional\)/i), { target: { value: 'media-vipassana-sit-20' } });
    fireEvent.click(screen.getByRole('button', { name: /create custom play/i }));

    expect(await screen.findByText(/custom play "Morning Focus" saved\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete custom play/i }));

    expect(
      await screen.findByText(/a newer custom play version already exists in the backend, so this delete was not applied/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Morning Focus')).toBeInTheDocument();
  });
});

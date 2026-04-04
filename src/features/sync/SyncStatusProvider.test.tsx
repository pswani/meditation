import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSyncQueueEntry } from '../../utils/syncQueue';
import { SyncStatusProvider } from './SyncStatusProvider';
import { useSyncStatus } from './useSyncStatus';

function SyncStatusProbe() {
  const { isOnline, connectionMode, canAttemptBackendSync, summary, replaceQueue, probeBackendReachability } = useSyncStatus();

  return (
    <div>
      <p>online:{isOnline ? 'yes' : 'no'}</p>
      <p>mode:{connectionMode}</p>
      <p>sync:{canAttemptBackendSync ? 'yes' : 'no'}</p>
      <p>pending:{summary.nextRetryCount}</p>
      <button
        type="button"
        onClick={() =>
          replaceQueue([
            createSyncQueueEntry({
              id: 'sync-1',
              entityType: 'session-log',
              operation: 'upsert',
              recordId: 'log-1',
              payload: { id: 'log-1' },
              queuedAt: '2026-03-27T10:00:00.000Z',
            }),
          ])
        }
      >
        Queue
      </button>
      <button type="button" onClick={() => void probeBackendReachability(true)}>
        Probe
      </button>
    </div>
  );
}

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

describe('SyncStatusProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    setNavigatorOnline(true);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts from browser online state and updates queue summary', async () => {
    render(
      <SyncStatusProvider>
        <SyncStatusProbe />
      </SyncStatusProvider>
    );

    expect(screen.getByText('online:yes')).toBeInTheDocument();
    expect(screen.getByText('mode:online')).toBeInTheDocument();
    expect(screen.getByText('sync:yes')).toBeInTheDocument();
    expect(screen.getByText('pending:0')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Queue' }));

    expect(screen.getByText('pending:1')).toBeInTheDocument();
  });

  it('responds to offline and online browser events', async () => {
    render(
      <SyncStatusProvider>
        <SyncStatusProbe />
      </SyncStatusProvider>
    );

    setNavigatorOnline(false);
    fireEvent(window, new Event('offline'));
    expect(screen.getByText('online:no')).toBeInTheDocument();
    expect(screen.getByText('mode:offline')).toBeInTheDocument();
    expect(screen.getByText('sync:no')).toBeInTheDocument();

    setNavigatorOnline(true);
    fireEvent(window, new Event('online'));
    expect(screen.getByText('online:yes')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('mode:online')).toBeInTheDocument());
    expect(screen.getByText('sync:yes')).toBeInTheDocument();
  });

  it('marks backend reachability as unavailable when health probes fail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('backend down'))
    );

    render(
      <SyncStatusProvider>
        <SyncStatusProbe />
      </SyncStatusProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));

    await waitFor(() => expect(screen.getByText('mode:backend-unreachable')).toBeInTheDocument());
    expect(screen.getByText('sync:no')).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSyncQueueEntry } from '../../utils/syncQueue';
import { SyncStatusProvider } from './SyncStatusProvider';
import { useSyncStatus } from './useSyncStatus';

function SyncStatusProbe() {
  const { isOnline, summary, replaceQueue } = useSyncStatus();

  return (
    <div>
      <p>online:{isOnline ? 'yes' : 'no'}</p>
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
  });

  it('starts from browser online state and updates queue summary', () => {
    render(
      <SyncStatusProvider>
        <SyncStatusProbe />
      </SyncStatusProvider>
    );

    expect(screen.getByText('online:yes')).toBeInTheDocument();
    expect(screen.getByText('pending:0')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Queue' }));

    expect(screen.getByText('pending:1')).toBeInTheDocument();
  });

  it('responds to offline and online browser events', () => {
    render(
      <SyncStatusProvider>
        <SyncStatusProbe />
      </SyncStatusProvider>
    );

    setNavigatorOnline(false);
    fireEvent(window, new Event('offline'));
    expect(screen.getByText('online:no')).toBeInTheDocument();

    setNavigatorOnline(true);
    fireEvent(window, new Event('online'));
    expect(screen.getByText('online:yes')).toBeInTheDocument();
  });
});

import { describe, expect, it } from 'vitest';
import {
  generatedSyncContract,
  goalTypes,
  meditationTypes,
  observanceStatuses,
  sessionLogSources,
  sessionLogStatuses,
  syncDeleteCurrentRecordField,
  syncDeleteLegacyAliasFields,
  syncOutcomeApplied,
  syncOutcomeDeleted,
  syncOutcomeStale,
  syncQueuedAtHeader,
  syncResultHeader,
  timeOfDayBuckets,
  timerModes,
} from './syncContract';

describe('syncContract', () => {
  it('has correct schema version', () => {
    expect(generatedSyncContract.schemaVersion).toBe(1);
  });

  it('has correct sync header names', () => {
    expect(syncQueuedAtHeader).toBe('X-Meditation-Sync-Queued-At');
    expect(syncResultHeader).toBe('X-Meditation-Sync-Result');
  });

  it('has correct sync outcome values', () => {
    expect(syncOutcomeApplied).toBe('applied');
    expect(syncOutcomeStale).toBe('stale');
    expect(syncOutcomeDeleted).toBe('deleted');
  });

  it('has correct delete field names', () => {
    expect(syncDeleteCurrentRecordField).toBe('currentRecord');
    expect(syncDeleteLegacyAliasFields.customPlay).toBe('currentCustomPlay');
    expect(syncDeleteLegacyAliasFields.playlist).toBe('currentPlaylist');
    expect(syncDeleteLegacyAliasFields.sankalpa).toBe('currentSankalpa');
  });

  it('has correct meditation types', () => {
    expect(meditationTypes).toEqual(['Vipassana', 'Ajapa', 'Tratak', 'Kriya', 'Sahaj']);
  });

  it('has correct session log sources', () => {
    expect(sessionLogSources).toEqual(['auto log', 'manual log']);
  });

  it('has correct time of day buckets', () => {
    expect(timeOfDayBuckets).toEqual(['morning', 'afternoon', 'evening', 'night']);
  });

  it('has correct goal types', () => {
    expect(goalTypes).toEqual(['duration-based', 'session-count-based', 'observance-based']);
  });

  it('has correct observance statuses', () => {
    expect(observanceStatuses).toEqual(['observed', 'missed']);
  });

  it('has correct timer modes', () => {
    expect(timerModes).toEqual(['fixed', 'open-ended']);
  });

  it('has correct session log statuses', () => {
    expect(sessionLogStatuses).toEqual(['completed', 'ended early']);
  });
});

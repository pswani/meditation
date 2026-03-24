import { describe, expect, it } from 'vitest';
import type { TimerSettings } from '../types/timer';
import { applyCustomPlayToTimerSettings, createCustomPlay, updateCustomPlay, validateCustomPlayDraft } from './customPlay';

describe('custom play helpers', () => {
  it('validates required custom play fields', () => {
    const result = validateCustomPlayDraft({
      name: '',
      meditationType: '',
      durationMinutes: 0,
      startSound: 'None',
      endSound: 'Temple Bell',
      mediaAssetId: '',
      recordingLabel: '',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.name).toMatch(/required/i);
    expect(result.errors.meditationType).toMatch(/required/i);
    expect(result.errors.durationMinutes).toMatch(/greater than 0/i);
  });

  it('creates and updates a custom play', () => {
    const created = createCustomPlay(
      {
        name: 'Morning Focus',
        meditationType: 'Vipassana',
        durationMinutes: 20,
        startSound: 'Soft Chime',
        endSound: 'Wood Block',
        mediaAssetId: 'media-vipassana-sit-20',
        recordingLabel: 'Session A',
      },
      new Date('2026-03-23T10:00:00.000Z')
    );

    const updated = updateCustomPlay(
      created,
      {
        name: 'Morning Focus Updated',
        meditationType: 'Ajapa',
        durationMinutes: 25,
        startSound: 'None',
        endSound: 'Temple Bell',
        mediaAssetId: 'media-ajapa-breath-15',
        recordingLabel: 'Session B',
      },
      new Date('2026-03-23T11:00:00.000Z')
    );

    expect(updated.name).toBe('Morning Focus Updated');
    expect(updated.meditationType).toBe('Ajapa');
    expect(updated.durationMinutes).toBe(25);
    expect(updated.startSound).toBe('None');
    expect(updated.endSound).toBe('Temple Bell');
    expect(updated.mediaAssetLabel).toBe('Ajapa Breath Cycle (15 min)');
    expect(updated.mediaAssetPath).toContain('/media/custom-plays/');
    expect(updated.updatedAt).toBe('2026-03-23T11:00:00.000Z');
  });

  it('applies custom play fields onto timer settings', () => {
    const settings: TimerSettings = {
      durationMinutes: 10,
      meditationType: 'Ajapa',
      startSound: 'Soft Chime',
      endSound: 'Temple Bell',
      intervalEnabled: true,
      intervalMinutes: 4,
      intervalSound: 'Wood Block',
    };

    const next = applyCustomPlayToTimerSettings(settings, {
      durationMinutes: 30,
      meditationType: 'Vipassana',
      startSound: 'None',
      endSound: 'Wood Block',
    });

    expect(next.durationMinutes).toBe(30);
    expect(next.meditationType).toBe('Vipassana');
    expect(next.startSound).toBe('None');
    expect(next.endSound).toBe('Wood Block');
    expect(next.intervalEnabled).toBe(true);
  });

  it('flags unknown media-session selections', () => {
    const result = validateCustomPlayDraft({
      name: 'Evening Winddown',
      meditationType: 'Sahaj',
      durationMinutes: 18,
      startSound: 'None',
      endSound: 'Temple Bell',
      mediaAssetId: 'missing-asset-id',
      recordingLabel: '',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.mediaAssetId).toMatch(/no longer available/i);
  });

  it('trims labels and clears media metadata when media id is not present', () => {
    const created = createCustomPlay(
      {
        name: '  Evening Winddown  ',
        meditationType: 'Sahaj',
        durationMinutes: 18,
        startSound: 'None',
        endSound: 'Temple Bell',
        mediaAssetId: '',
        recordingLabel: '  gentle close  ',
      },
      new Date('2026-03-24T10:00:00.000Z')
    );

    expect(created.name).toBe('Evening Winddown');
    expect(created.recordingLabel).toBe('gentle close');
    expect(created.mediaAssetId).toBe('');
    expect(created.mediaAssetLabel).toBe('');
    expect(created.mediaAssetPath).toBe('');
  });
});

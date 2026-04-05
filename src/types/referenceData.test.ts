import { describe, expect, it } from 'vitest';
import {
  isMeditationType,
  isSessionLogSource,
  isTimeOfDayBucket,
  meditationTypes,
  sessionLogSources,
  timeOfDayBuckets,
} from './referenceData';

describe('reference data', () => {
  it('keeps the shared meditation-type order stable', () => {
    expect(meditationTypes).toEqual(['Vipassana', 'Ajapa', 'Tratak', 'Kriya', 'Sahaj']);
  });

  it('keeps the shared session-log source order stable', () => {
    expect(sessionLogSources).toEqual(['auto log', 'manual log']);
  });

  it('keeps the shared time-of-day bucket order stable', () => {
    expect(timeOfDayBuckets).toEqual(['morning', 'afternoon', 'evening', 'night']);
  });

  it('guards shared reference values consistently', () => {
    expect(isMeditationType('Vipassana')).toBe(true);
    expect(isMeditationType('vipassana')).toBe(false);
    expect(isSessionLogSource('manual log')).toBe(true);
    expect(isSessionLogSource('manual')).toBe(false);
    expect(isTimeOfDayBucket('evening')).toBe(true);
    expect(isTimeOfDayBucket('late-night')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  meditationTypes as generatedMeditationTypes,
  sessionLogSources as generatedSessionLogSources,
  timeOfDayBuckets as generatedTimeOfDayBuckets,
} from '../generated/syncContract';
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
    expect(meditationTypes).toEqual(generatedMeditationTypes);
  });

  it('keeps the shared session-log source order stable', () => {
    expect(sessionLogSources).toEqual(generatedSessionLogSources);
  });

  it('keeps the shared time-of-day bucket order stable', () => {
    expect(timeOfDayBuckets).toEqual(generatedTimeOfDayBuckets);
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

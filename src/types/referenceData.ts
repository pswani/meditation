import {
  meditationTypes as generatedMeditationTypes,
  sessionLogSources as generatedSessionLogSources,
  timeOfDayBuckets as generatedTimeOfDayBuckets,
} from '../generated/syncContract';

export const meditationTypes = generatedMeditationTypes;
export type MeditationType = (typeof meditationTypes)[number];

export const sessionLogSources = generatedSessionLogSources;
export type SessionLogSource = (typeof sessionLogSources)[number];

export const timeOfDayBuckets = generatedTimeOfDayBuckets;
export type TimeOfDayBucket = (typeof timeOfDayBuckets)[number];

const meditationTypeSet = new Set<string>(meditationTypes);
const sessionLogSourceSet = new Set<string>(sessionLogSources);
const timeOfDayBucketSet = new Set<string>(timeOfDayBuckets);

export function isMeditationType(value: unknown): value is MeditationType {
  return typeof value === 'string' && meditationTypeSet.has(value);
}

export function isSessionLogSource(value: unknown): value is SessionLogSource {
  return typeof value === 'string' && sessionLogSourceSet.has(value);
}

export function isTimeOfDayBucket(value: unknown): value is TimeOfDayBucket {
  return typeof value === 'string' && timeOfDayBucketSet.has(value);
}

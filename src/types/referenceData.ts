export const meditationTypes = ['Vipassana', 'Ajapa', 'Tratak', 'Kriya', 'Sahaj'] as const;
export type MeditationType = (typeof meditationTypes)[number];

export const sessionLogSources = ['auto log', 'manual log'] as const;
export type SessionLogSource = (typeof sessionLogSources)[number];

export const timeOfDayBuckets = ['morning', 'afternoon', 'evening', 'night'] as const;
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

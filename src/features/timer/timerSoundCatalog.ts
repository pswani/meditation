import gongFilePath from '../../assets/sounds/gong.mp3?inline';
import templeBellFilePath from '../../assets/sounds/temple-bell.mp3?inline';
import timerSoundCatalogData from '../../data/timerSoundCatalog.json';
import { normalizeTimerSoundLabel, SILENT_TIMER_SOUND_LABEL } from '../../utils/timerSound';

interface TimerSoundCatalogEntryRecord {
  readonly label: string;
  readonly filename: string;
}

export interface TimerSoundCatalogEntry {
  readonly label: string;
  readonly filename: string;
  readonly relativePath: string;
  readonly filePath: string;
}

const bundledTimerSoundFilePaths: Readonly<Record<string, string>> = {
  'gong.mp3': gongFilePath,
  'temple-bell.mp3': templeBellFilePath,
};

const timerSoundCatalog = (timerSoundCatalogData as readonly TimerSoundCatalogEntryRecord[]).map((entry) => ({
  ...entry,
  relativePath: `sounds/${entry.filename}`,
  filePath: bundledTimerSoundFilePaths[entry.filename] ?? `/media/sounds/${entry.filename}`,
})) satisfies readonly TimerSoundCatalogEntry[];

const timerSoundCatalogByLabel = new Map(timerSoundCatalog.map((entry) => [entry.label, entry] as const));

export function resolveTimerSound(label: string): TimerSoundCatalogEntry | null {
  const normalizedLabel = normalizeTimerSoundLabel(label, label);
  if (normalizedLabel === SILENT_TIMER_SOUND_LABEL) {
    return null;
  }

  return timerSoundCatalogByLabel.get(normalizedLabel) ?? null;
}

export function listPlayableTimerSounds(): readonly TimerSoundCatalogEntry[] {
  return timerSoundCatalog;
}

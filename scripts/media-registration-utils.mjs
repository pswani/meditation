import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..');
export const SOUND_OPTIONS_FILE = path.join(ROOT_DIR, 'src/data/soundOptions.json');
export const TIMER_SOUND_CATALOG_FILE = path.join(ROOT_DIR, 'src/data/timerSoundCatalog.json');
export const MEDITATION_TYPES_FILE = path.join(ROOT_DIR, 'src/data/meditationTypes.json');
export const CUSTOM_PLAY_MEDIA_CATALOG_FILE = path.join(ROOT_DIR, 'src/data/customPlayMediaCatalog.json');
export const MIGRATIONS_DIR = path.join(ROOT_DIR, 'backend/src/main/resources/db/migration');

const MIME_TYPE_BY_EXTENSION = new Map([
  ['.mp3', 'audio/mpeg'],
  ['.m4a', 'audio/mp4'],
  ['.aac', 'audio/aac'],
  ['.wav', 'audio/wav'],
  ['.ogg', 'audio/ogg'],
  ['.flac', 'audio/flac'],
]);

function parseEnvFile(content) {
  const env = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

export function loadLocalEnv() {
  const merged = {};

  for (const filename of ['.env', '.env.local']) {
    const fullPath = path.join(ROOT_DIR, filename);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    Object.assign(merged, parseEnvFile(fs.readFileSync(fullPath, 'utf8')));
  }

  return merged;
}

export function resolveProjectPath(candidate) {
  if (path.isAbsolute(candidate)) {
    return candidate;
  }

  return path.join(ROOT_DIR, candidate);
}

export function getConfiguredFrontendCustomPlayRoot() {
  const env = loadLocalEnv();
  return resolveProjectPath(env.MEDITATION_MEDIA_ROOT || 'public/media/custom-plays');
}

export function getConfiguredBackendCustomPlayRoot() {
  const env = loadLocalEnv();
  return path.join(resolveProjectPath(env.MEDITATION_MEDIA_STORAGE_ROOT || 'local-data/media'), 'custom-plays');
}

export function getConfiguredFrontendSoundRoot() {
  return path.join(path.dirname(getConfiguredFrontendCustomPlayRoot()), 'sounds');
}

export function getConfiguredBackendSoundRoot() {
  return path.join(path.dirname(getConfiguredBackendCustomPlayRoot()), 'sounds');
}

export function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected positional argument: ${token}`);
    }

    const key = token.slice(2);
    if (!key) {
      throw new Error('Encountered an empty option name.');
    }

    if (index + 1 >= argv.length || argv[index + 1].startsWith('--')) {
      options[key] = true;
      continue;
    }

    options[key] = argv[index + 1];
    index += 1;
  }

  return options;
}

export function requireStringOption(options, key) {
  const value = options[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required option --${key}`);
  }

  return value.trim();
}

export function optionalStringOption(options, key) {
  const value = options[key];
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function hasFlag(options, key) {
  return options[key] === true;
}

export function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function inferMimeType(filename) {
  const mimeType = MIME_TYPE_BY_EXTENSION.get(path.extname(filename).toLowerCase());
  if (!mimeType) {
    throw new Error(
      `Could not infer a MIME type for ${filename}. Pass --mime-type explicitly or use a supported audio extension.`
    );
  }

  return mimeType;
}

export function normalizeIsoTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${value}`);
  }

  return date.toISOString();
}

export function formatSqlTimestampWithTimeZone(isoTimestamp) {
  const date = new Date(isoTimestamp);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  const hours = `${date.getUTCHours()}`.padStart(2, '0');
  const minutes = `${date.getUTCMinutes()}`.padStart(2, '0');
  const seconds = `${date.getUTCSeconds()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}+00:00`;
}

export function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function findNextMigrationVersion() {
  const filenames = fs.readdirSync(MIGRATIONS_DIR);
  const versions = filenames
    .map((filename) => {
      const match = /^V(\d+)__/.exec(filename);
      return match ? Number(match[1]) : null;
    })
    .filter((value) => Number.isInteger(value));

  return Math.max(...versions, 0) + 1;
}

export function ensureDirectory(directoryPath, dryRun) {
  if (!dryRun) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

export function copyFile(sourcePath, destinationPath, dryRun) {
  ensureDirectory(path.dirname(destinationPath), dryRun);
  if (!dryRun) {
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

export function assertFileExists(filePath, optionName) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`The file passed to --${optionName} does not exist: ${filePath}`);
  }
}

export function readFileSize(filePath) {
  return fs.statSync(filePath).size;
}

export function formatDurationSeconds(options) {
  const durationSecondsRaw = optionalStringOption(options, 'duration-seconds');
  const durationMinutesRaw = optionalStringOption(options, 'duration-minutes');

  if (durationSecondsRaw && durationMinutesRaw) {
    throw new Error('Pass either --duration-seconds or --duration-minutes, but not both.');
  }

  if (!durationSecondsRaw && !durationMinutesRaw) {
    throw new Error('Pass one of --duration-seconds or --duration-minutes.');
  }

  if (durationSecondsRaw) {
    const seconds = Number(durationSecondsRaw);
    if (!Number.isInteger(seconds) || seconds <= 0) {
      throw new Error('--duration-seconds must be a positive integer.');
    }

    return seconds;
  }

  const minutes = Number(durationMinutesRaw);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error('--duration-minutes must be a positive number.');
  }

  return Math.round(minutes * 60);
}

export function parsePositiveIntegerOption(options, key) {
  const rawValue = requireStringOption(options, key);
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${key} must be a positive integer.`);
  }

  return parsed;
}

export function printPlannedChange(label, value) {
  process.stdout.write(`${label}: ${value}\n`);
}

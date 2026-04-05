#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  CUSTOM_PLAY_MEDIA_CATALOG_FILE,
  MIGRATIONS_DIR,
  assertFileExists,
  copyFile,
  findNextMigrationVersion,
  formatDurationSeconds,
  formatSqlTimestampWithTimeZone,
  getConfiguredBackendCustomPlayRoot,
  getConfiguredFrontendCustomPlayRoot,
  getMeditationTypes,
  hasFlag,
  inferMimeType,
  loadLocalEnv,
  normalizeIsoTimestamp,
  optionalStringOption,
  parseArgs,
  parsePositiveIntegerOption,
  printPlannedChange,
  readFileSize,
  readJsonFile,
  requireStringOption,
  resolveProjectPath,
  slugify,
  sqlString,
  writeJsonFile,
} from './media-registration-utils.mjs';

function printHelp() {
  process.stdout.write(`Register a prerecorded custom-play meditation in the repo.

Usage:
  npm run media:add:custom-play -- --id media-sahaj-evening-25 --label "Sahaj Evening Sit (25 min)" --meditation-type Sahaj --file /path/to/sahaj-evening-25.mp3 --duration-minutes 25 [--filename sahaj-evening-25.mp3] [--mime-type audio/mpeg] [--size-bytes 123456] [--updated-at 2026-03-27T18:30:00.000Z] [--skip-frontend-copy] [--dry-run]

Parameters:
  --id                 Required. Stable media asset id, typically prefixed with "media-".
  --label              Required. User-facing label shown in the custom-play media picker.
  --meditation-type    Required. Must match a configured meditation type.
  --file               Optional. Source audio file to copy into the repo media roots.
  --filename           Optional. Target filename under custom-plays/. Defaults to the basename of --file.
  --duration-seconds   Required unless --duration-minutes is passed. Positive integer.
  --duration-minutes   Required unless --duration-seconds is passed. Positive number.
  --mime-type          Optional. Inferred from the filename when omitted.
  --size-bytes         Optional. Inferred from --file when omitted. Required if --file is not provided.
  --updated-at         Optional. ISO timestamp for the catalog entry. Defaults to the current time.
  --skip-frontend-copy Optional. Copy only to the backend media root, not the frontend fallback media root.
  --dry-run            Optional. Print the planned changes without writing files.

What it updates:
  - src/data/customPlayMediaCatalog.json
  - a new Flyway migration under backend/src/main/resources/db/migration/
  - local-data/media/custom-plays/ and optionally public/media/custom-plays/ when --file is provided
`);
}

function buildMigrationSql({ id, label, meditationType, relativePath, durationSeconds, mimeType, sizeBytes, updatedAt }) {
  return `insert into media_asset (
  id,
  asset_kind,
  label,
  meditation_type_code,
  relative_path,
  duration_seconds,
  mime_type,
  size_bytes,
  active,
  updated_at
)
values (
  ${sqlString(id)},
  'custom-play',
  ${sqlString(label)},
  ${sqlString(meditationType)},
  ${sqlString(relativePath)},
  ${durationSeconds},
  ${sqlString(mimeType)},
  ${sizeBytes},
  true,
  timestamp with time zone ${sqlString(formatSqlTimestampWithTimeZone(updatedAt))}
);
`;
}

try {
  const options = parseArgs(process.argv.slice(2));

  if (hasFlag(options, 'help')) {
    printHelp();
    process.exit(0);
  }

  loadLocalEnv();

  const dryRun = hasFlag(options, 'dry-run');
  const skipFrontendCopy = hasFlag(options, 'skip-frontend-copy');
  const id = requireStringOption(options, 'id');
  const label = requireStringOption(options, 'label');
  const meditationType = requireStringOption(options, 'meditation-type');
  const sourceFileOption = optionalStringOption(options, 'file');
  const sourceFile = sourceFileOption ? resolveProjectPath(sourceFileOption) : null;

  if (sourceFile) {
    assertFileExists(sourceFile, 'file');
  }

  const filename = optionalStringOption(options, 'filename') ?? (sourceFile ? path.basename(sourceFile) : null);
  if (!filename) {
    throw new Error('Pass --filename when --file is not provided.');
  }

  const allowedMeditationTypes = getMeditationTypes();
  if (!allowedMeditationTypes.includes(meditationType)) {
    throw new Error(`--meditation-type must be one of: ${allowedMeditationTypes.join(', ')}`);
  }

  const durationSeconds = formatDurationSeconds(options);
  const mimeType = optionalStringOption(options, 'mime-type') ?? inferMimeType(filename);
  const sizeBytes =
    optionalStringOption(options, 'size-bytes') !== null
      ? parsePositiveIntegerOption(options, 'size-bytes')
      : sourceFile
        ? readFileSize(sourceFile)
        : (() => {
            throw new Error('Pass --size-bytes when --file is not provided.');
          })();
  const updatedAt = normalizeIsoTimestamp(optionalStringOption(options, 'updated-at'));

  const publicFilePath = `/media/custom-plays/${filename}`;
  const relativePath = `custom-plays/${filename}`;
  const catalog = readJsonFile(CUSTOM_PLAY_MEDIA_CATALOG_FILE);

  if (!Array.isArray(catalog)) {
    throw new Error('src/data/customPlayMediaCatalog.json must contain an array.');
  }

  if (catalog.some((entry) => entry.id === id)) {
    throw new Error(`A custom-play media asset with id "${id}" already exists.`);
  }

  if (catalog.some((entry) => entry.filePath === publicFilePath)) {
    throw new Error(`A custom-play media asset already uses ${publicFilePath}.`);
  }

  const updatedCatalog = [...catalog, {
    id,
    label,
    meditationType,
    filePath: publicFilePath,
    relativePath,
    durationSeconds,
    mimeType,
    sizeBytes,
    updatedAt,
  }].sort((left, right) => left.label.localeCompare(right.label));

  const migrationVersion = findNextMigrationVersion();
  const migrationFilename = `V${migrationVersion}__add_custom_play_media_${slugify(id.replace(/^media-/, ''))}.sql`;
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFilename);
  const migrationSql = buildMigrationSql({
    id,
    label,
    meditationType,
    relativePath,
    durationSeconds,
    mimeType,
    sizeBytes,
    updatedAt,
  });

  printPlannedChange('Catalog file', CUSTOM_PLAY_MEDIA_CATALOG_FILE);
  printPlannedChange('Migration file', migrationPath);
  printPlannedChange('Media asset id', id);
  printPlannedChange('Public file path', publicFilePath);

  if (sourceFile) {
    printPlannedChange('Backend media copy', path.join(getConfiguredBackendCustomPlayRoot(), filename));
    if (!skipFrontendCopy) {
      printPlannedChange('Frontend fallback copy', path.join(getConfiguredFrontendCustomPlayRoot(), filename));
    }
  } else {
    printPlannedChange('Manual media placement required', path.join(getConfiguredBackendCustomPlayRoot(), filename));
  }

  if (dryRun) {
    process.stdout.write('Dry run complete. No files were changed.\n');
    process.exit(0);
  }

  writeJsonFile(CUSTOM_PLAY_MEDIA_CATALOG_FILE, updatedCatalog);
  fs.writeFileSync(migrationPath, migrationSql);

  if (sourceFile) {
    copyFile(sourceFile, path.join(getConfiguredBackendCustomPlayRoot(), filename), false);
    if (!skipFrontendCopy) {
      copyFile(sourceFile, path.join(getConfiguredFrontendCustomPlayRoot(), filename), false);
    }
  }

  process.stdout.write(`Registered prerecorded meditation "${label}" as ${id}.\n`);
  process.stdout.write(`Restart the backend to apply ${migrationFilename}, then reload the frontend.\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

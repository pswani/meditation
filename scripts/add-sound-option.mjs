#!/usr/bin/env node

import path from 'node:path';
import {
  TIMER_SOUND_CATALOG_FILE,
  assertFileExists,
  copyFile,
  getConfiguredBackendSoundRoot,
  getConfiguredFrontendSoundRoot,
  hasFlag,
  loadLocalEnv,
  optionalStringOption,
  parseArgs,
  printPlannedChange,
  readJsonFile,
  requireStringOption,
  resolveProjectPath,
  slugify,
  writeJsonFile,
} from './media-registration-utils.mjs';

function printHelp() {
  process.stdout.write(`Add a timer sound option to the app.

Usage:
  npm run sound:add -- --label "Crystal Bowl" [--file /path/to/crystal-bowl.wav] [--filename crystal-bowl.wav] [--skip-copy] [--dry-run]

Parameters:
  --label       Required. The user-facing sound label added to the selectable timer sound list.
  --file        Optional. Source audio file to copy into the local backend/frontend media roots.
  --filename    Optional. Target filename for playback mapping and file copy. Defaults to the basename of --file or a slugified .wav filename from --label.
  --skip-copy   Optional. Do not copy the sound file even if --file is provided.
  --dry-run     Optional. Print the planned changes without writing files.

Notes:
  - A production sound option must always register a playable file mapping.
  - New script-managed sounds resolve through /media/sounds/<filename>; shipped sounds stay bundled in src/assets/sounds/.
`);
}

try {
  const options = parseArgs(process.argv.slice(2));

  if (hasFlag(options, 'help')) {
    printHelp();
    process.exit(0);
  }

  loadLocalEnv();

  const dryRun = hasFlag(options, 'dry-run');
  const skipCopy = hasFlag(options, 'skip-copy');
  const label = requireStringOption(options, 'label');
  const timerSoundCatalog = readJsonFile(TIMER_SOUND_CATALOG_FILE);

  if (!Array.isArray(timerSoundCatalog)) {
    throw new Error('src/data/timerSoundCatalog.json must contain an array.');
  }

  if (timerSoundCatalog.some((entry) => entry?.label === label)) {
    throw new Error(`Sound option "${label}" already exists.`);
  }

  const sourceFile = optionalStringOption(options, 'file');
  const explicitFilename = optionalStringOption(options, 'filename');
  if (!sourceFile && !explicitFilename) {
    throw new Error('Pass --file or --filename so the new sound remains selectable and playable.');
  }

  const filename =
    explicitFilename ??
    (sourceFile ? path.basename(sourceFile) : `${slugify(label)}.wav`);
  if (timerSoundCatalog.some((entry) => entry?.filename === filename)) {
    throw new Error(`Playback filename "${filename}" is already registered.`);
  }

  const updatedTimerSoundCatalog = [
    ...timerSoundCatalog,
    {
      label,
      filename,
      source: 'media',
    },
  ];

  printPlannedChange('Sound label', label);
  printPlannedChange('Playback mapping file', TIMER_SOUND_CATALOG_FILE);
  printPlannedChange('Playback path', `/media/sounds/${filename}`);

  if (sourceFile && !skipCopy) {
    const resolvedSourceFile = resolveProjectPath(sourceFile);
    assertFileExists(resolvedSourceFile, 'file');

    printPlannedChange('Backend sound copy', path.join(getConfiguredBackendSoundRoot(), filename));
    printPlannedChange('Frontend fallback sound copy', path.join(getConfiguredFrontendSoundRoot(), filename));
  }

  if (dryRun) {
    process.stdout.write('Dry run complete. No files were changed.\n');
    process.exit(0);
  }

  writeJsonFile(TIMER_SOUND_CATALOG_FILE, updatedTimerSoundCatalog);

  if (sourceFile && !skipCopy) {
    const resolvedSourceFile = resolveProjectPath(sourceFile);
    const resolvedFilename = filename ?? path.basename(resolvedSourceFile);
    copyFile(resolvedSourceFile, path.join(getConfiguredBackendSoundRoot(), resolvedFilename), false);
    copyFile(resolvedSourceFile, path.join(getConfiguredFrontendSoundRoot(), resolvedFilename), false);
  }

  process.stdout.write(`Added sound option "${label}".\n`);
  process.stdout.write(`Registered timer playback mapping at /media/sounds/${filename}.\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

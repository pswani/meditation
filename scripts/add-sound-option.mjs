#!/usr/bin/env node

import path from 'node:path';
import {
  SOUND_OPTIONS_FILE,
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
  - When --filename or --file is provided, the script also registers the label -> file mapping used for timer playback.
  - If you omit both --file and --filename, the sound remains selectable but playback will fail safely until a file mapping is added later.
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
  const soundOptions = readJsonFile(SOUND_OPTIONS_FILE);
  const timerSoundCatalog = readJsonFile(TIMER_SOUND_CATALOG_FILE);

  if (!Array.isArray(soundOptions)) {
    throw new Error('src/data/soundOptions.json must contain an array.');
  }

  if (!Array.isArray(timerSoundCatalog)) {
    throw new Error('src/data/timerSoundCatalog.json must contain an array.');
  }

  if (soundOptions.includes(label)) {
    throw new Error(`Sound option "${label}" already exists.`);
  }

  const updatedSoundOptions = [...soundOptions, label];
  const sourceFile = optionalStringOption(options, 'file');
  const filename =
    optionalStringOption(options, 'filename') ??
    (sourceFile ? path.basename(sourceFile) : `${slugify(label)}.wav`);
  const shouldRegisterPlayback = Boolean(sourceFile || optionalStringOption(options, 'filename'));

  if (shouldRegisterPlayback) {
    if (timerSoundCatalog.some((entry) => entry?.label === label)) {
      throw new Error(`Playback mapping for "${label}" already exists.`);
    }
    if (timerSoundCatalog.some((entry) => entry?.filename === filename)) {
      throw new Error(`Playback filename "${filename}" is already registered.`);
    }
  }

  const updatedTimerSoundCatalog = shouldRegisterPlayback
    ? [
        ...timerSoundCatalog,
        {
          label,
          filename,
        },
      ]
    : timerSoundCatalog;

  printPlannedChange('Catalog file', SOUND_OPTIONS_FILE);
  printPlannedChange('Sound label', label);
  if (shouldRegisterPlayback) {
    printPlannedChange('Playback mapping file', TIMER_SOUND_CATALOG_FILE);
    printPlannedChange('Playback path', `/media/sounds/${filename}`);
  }

  if (sourceFile && !skipCopy) {
    const resolvedSourceFile = resolveProjectPath(sourceFile);
    assertFileExists(resolvedSourceFile, 'file');

    if (!filename) {
      throw new Error('Could not determine a target filename for the sound file.');
    }

    printPlannedChange('Backend sound copy', path.join(getConfiguredBackendSoundRoot(), filename));
    printPlannedChange('Frontend fallback sound copy', path.join(getConfiguredFrontendSoundRoot(), filename));
  }

  if (dryRun) {
    process.stdout.write('Dry run complete. No files were changed.\n');
    process.exit(0);
  }

  writeJsonFile(SOUND_OPTIONS_FILE, updatedSoundOptions);
  if (shouldRegisterPlayback) {
    writeJsonFile(TIMER_SOUND_CATALOG_FILE, updatedTimerSoundCatalog);
  }

  if (sourceFile && !skipCopy) {
    const resolvedSourceFile = resolveProjectPath(sourceFile);
    const resolvedFilename = filename ?? path.basename(resolvedSourceFile);
    copyFile(resolvedSourceFile, path.join(getConfiguredBackendSoundRoot(), resolvedFilename), false);
    copyFile(resolvedSourceFile, path.join(getConfiguredFrontendSoundRoot(), resolvedFilename), false);
  }

  process.stdout.write(`Added sound option "${label}".\n`);
  if (shouldRegisterPlayback) {
    process.stdout.write(`Registered timer playback mapping at /media/sounds/${filename}.\n`);
  } else {
    process.stdout.write('No playback mapping was added. The sound is selectable, but playback will fail safely until you add one.\n');
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

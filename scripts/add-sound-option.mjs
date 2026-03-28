#!/usr/bin/env node

import path from 'node:path';
import {
  SOUND_OPTIONS_FILE,
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
  writeJsonFile,
} from './media-registration-utils.mjs';

function printHelp() {
  process.stdout.write(`Add a timer sound option to the app.

Usage:
  npm run sound:add -- --label "Crystal Bowl" [--file /path/to/crystal-bowl.mp3] [--filename crystal-bowl.mp3] [--skip-copy] [--dry-run]

Parameters:
  --label       Required. The user-facing sound label added to the selectable timer sound list.
  --file        Optional. Source audio file to copy into the local backend/frontend media roots for future playback work.
  --filename    Optional. Target filename when copying a sound file. Defaults to the basename of --file.
  --skip-copy   Optional. Do not copy the sound file even if --file is provided.
  --dry-run     Optional. Print the planned changes without writing files.

Notes:
  - This repo currently stores timer sounds as labels only.
  - Adding a sound option makes it selectable in the UI, but it does not implement playback.
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

  if (!Array.isArray(soundOptions)) {
    throw new Error('src/data/soundOptions.json must contain an array.');
  }

  if (soundOptions.includes(label)) {
    throw new Error(`Sound option "${label}" already exists.`);
  }

  const updatedSoundOptions = [...soundOptions, label];
  const sourceFile = optionalStringOption(options, 'file');
  const filename = optionalStringOption(options, 'filename') ?? (sourceFile ? path.basename(sourceFile) : null);

  printPlannedChange('Catalog file', SOUND_OPTIONS_FILE);
  printPlannedChange('Sound label', label);

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

  if (sourceFile && !skipCopy) {
    const resolvedSourceFile = resolveProjectPath(sourceFile);
    const resolvedFilename = filename ?? path.basename(resolvedSourceFile);
    copyFile(resolvedSourceFile, path.join(getConfiguredBackendSoundRoot(), resolvedFilename), false);
    copyFile(resolvedSourceFile, path.join(getConfiguredFrontendSoundRoot(), resolvedFilename), false);
  }

  process.stdout.write(`Added sound option "${label}".\n`);
  process.stdout.write('The sound is now selectable in the UI, but playback is still not implemented in this repo.\n');
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

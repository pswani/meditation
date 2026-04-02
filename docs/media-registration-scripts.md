# Media Registration Scripts

Use these helpers when you want to add:
- a new selectable timer sound label
- a new prerecorded `custom play` meditation asset

They are intentionally honest about the current product state:
- timer sound playback now uses a label -> `/media/sounds/<filename>` mapping
- prerecorded meditations are currently used as linked media metadata for `custom play`

## Commands

### Add a sound option

```bash
npm run sound:add -- --label "Crystal Bowl"
```

Playable sound example with automatic copy:

```bash
npm run sound:add -- \
  --label "Crystal Bowl" \
  --file /absolute/path/to/crystal-bowl.wav
```

Mapping-only example when the file is already staged under the repo media roots:

```bash
npm run sound:add -- \
  --label "Crystal Bowl" \
  --filename crystal-bowl.wav
```

Parameters:

- `--label`
  - required
  - the user-facing label added to the timer sound dropdowns
- `--file`
  - optional
  - source audio file to copy into the repo's `sounds/` media roots
- `--filename`
  - optional
  - target filename for playback mapping and file copy
  - defaults to the basename of `--file`
- `--skip-copy`
  - optional flag
  - do not copy the file even if `--file` is provided
- `--dry-run`
  - optional flag
  - prints the planned changes without writing files

What it changes:

- updates [`src/data/soundOptions.json`](/Users/prashantwani/wrk/meditation/src/data/soundOptions.json)
- updates [`src/data/timerSoundCatalog.json`](/Users/prashantwani/wrk/meditation/src/data/timerSoundCatalog.json) when `--file` or `--filename` is provided
- optionally copies the file to:
  - `local-data/media/sounds/`
  - `public/media/sounds/`

How playback wiring works:

- timer setup, saved timer settings, active timer runtime, and `custom play` -> timer apply all keep using the stored label
- the runtime resolves that label through `src/data/timerSoundCatalog.json`
- shipped timer sounds resolve to inline frontend-bundled asset data so playback does not depend on the backend media route or a second static-file request
- repo-local copies under `public/media/sounds/` and `local-data/media/sounds/` can still be kept for development parity and operational convenience
- the current shipped selectable sounds are `None`, `Temple Bell`, and `Gong`
- legacy saved labels still load safely:
  - `Soft Chime` -> `Temple Bell`
  - `Wood Block` -> `Gong`

Current limitations:

- if you add only a label and omit both `--file` and `--filename`, the timer will fail safely because the label has no playback mapping yet
- browser autoplay policies can still block playback
- playlist runtime playback is still not implemented

## Add a prerecorded meditation

Example with automatic file copy and duration in minutes:

```bash
npm run media:add:custom-play -- \
  --id media-sahaj-evening-25 \
  --label "Sahaj Evening Sit (25 min)" \
  --meditation-type Sahaj \
  --file /absolute/path/to/sahaj-evening-25.mp3 \
  --duration-minutes 25
```

Example when the file is already in place and you only want metadata plus migration:

```bash
npm run media:add:custom-play -- \
  --id media-sahaj-evening-25 \
  --label "Sahaj Evening Sit (25 min)" \
  --meditation-type Sahaj \
  --filename sahaj-evening-25.mp3 \
  --duration-seconds 1500 \
  --size-bytes 11000000
```

Parameters:

- `--id`
  - required
  - stable media asset id, typically prefixed with `media-`
- `--label`
  - required
  - user-facing label shown in the custom-play media picker
- `--meditation-type`
  - required
  - must match one of the configured meditation types
- `--file`
  - optional
  - source audio file to copy into the configured media roots
- `--filename`
  - required when `--file` is not provided
  - target filename stored under `custom-plays/`
- `--duration-seconds`
  - required unless `--duration-minutes` is passed
  - positive integer
- `--duration-minutes`
  - required unless `--duration-seconds` is passed
  - positive number, converted to seconds
- `--mime-type`
  - optional
  - inferred from the filename when omitted
- `--size-bytes`
  - optional when `--file` is provided
  - required when `--file` is omitted
- `--updated-at`
  - optional
  - ISO timestamp stored in the frontend fallback catalog and generated migration
- `--skip-frontend-copy`
  - optional flag
  - copy only to the backend media root, not `public/media/custom-plays/`
- `--dry-run`
  - optional flag
  - prints the planned changes without writing files

What it changes:

- updates [`src/data/customPlayMediaCatalog.json`](/Users/prashantwani/wrk/meditation/src/data/customPlayMediaCatalog.json)
- creates a new Flyway migration in [`backend/src/main/resources/db/migration`](/Users/prashantwani/wrk/meditation/backend/src/main/resources/db/migration)
- optionally copies the audio file to:
  - `local-data/media/custom-plays/`
  - `public/media/custom-plays/`

How it works:

1. The frontend fallback catalog is updated so backend-unavailable flows know about the new recording.
2. A brand-new Flyway migration is created instead of modifying the old seed migration.
3. On the next backend startup, Flyway inserts the new `media_asset` row into H2.
4. The custom-play media API then returns the new asset from `/api/media/custom-plays`.
5. The `Custom Plays` UI can select it by `mediaAssetId`.

Why it creates a new migration:

- existing local databases may already have applied `V2__seed_reference_data.sql`
- editing an old applied migration would create checksum drift and an unreliable operator workflow
- a new migration keeps the change safe for both clean DBs and already-used local DBs

## Recommended workflow

1. Run the script with `--dry-run` first.
2. Re-run without `--dry-run`.
3. Restart the backend so Flyway applies any new media migration.
4. Reload the frontend.
5. Verify:
  - `http://localhost:8080/api/media/custom-plays`
  - `Practice` -> `Show Tools` -> `Custom Plays`

## Source of truth

These files are now the editable catalogs used by the scripts:

- [`src/data/soundOptions.json`](/Users/prashantwani/wrk/meditation/src/data/soundOptions.json)
- [`src/data/timerSoundCatalog.json`](/Users/prashantwani/wrk/meditation/src/data/timerSoundCatalog.json)
- [`src/data/customPlayMediaCatalog.json`](/Users/prashantwani/wrk/meditation/src/data/customPlayMediaCatalog.json)

The scripts update those files so the repo stays consistent without manual copy-paste edits across multiple modules.

# Media Cache Hygiene ExecPlan

Date: 2026-04-05

## Objective

Clarify ownership of timer sounds and fallback media assets, and replace hand-edited offline cache version strings with a safer derived version strategy.

## Why

- Timer-sound ownership is split across bundled assets, public media copies, JSON catalogs, and scripts, which makes it hard to tell what is actually authoritative.
- `soundOptions.json` and `timerSoundCatalog.json` both participate in timer-sound behavior, creating unnecessary drift risk.
- The offline app currently depends on matching hard-coded cache version strings in both `offlineApp.ts` and `public/offline-sw.js`.
- The custom-play media registration script still expects a removed meditation-types JSON file, so the current script/runtime asset workflow is already drifting.

## Scope

Included:
- one clear ownership model for shipped timer sounds, media-backed timer sounds, and fallback `custom play` metadata
- removal or simplification of redundant timer-sound catalog declarations
- repair of script-side asset validation and registration paths that are part of the current media workflow
- derived offline cache versioning wired through the service-worker registration path
- focused tests for timer-sound catalog behavior, cache-version behavior, and registration workflow helpers
- durable docs updates for asset ownership and cache versioning

Excluded:
- browser upload/import workflows
- broad media-library redesign
- backend query work
- large runtime decomposition
- broad UI changes

## Source documents

- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/media-registration-scripts.md`
- `prompts/production-grade-hardening-phased-plan.md`
- `prompts/media-cache-hygiene-feature-bundle-with-branching/00-create-branch.md`
- `prompts/media-cache-hygiene-feature-bundle-with-branching/01-implement-media-cache-hygiene.md`

## Affected files and modules

- `src/features/timer/timerSoundCatalog.ts`
- `src/features/timer/constants.ts`
- `src/utils/timerSound.ts`
- `src/data/timerSoundCatalog.json`
- `src/data/customPlayMediaCatalog.json`
- `src/features/sync/offlineApp.ts`
- `src/features/sync/offlineCacheVersion.ts`
- `public/offline-sw.js`
- `src/vite-env.d.ts`
- `vite.config.ts`
- `scripts/media-registration-utils.mjs`
- `scripts/add-sound-option.mjs`
- `scripts/add-custom-play-media.mjs`
- `scripts/setup-media-root.sh`
- `docs/media-registration-scripts.md`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## UX behavior

- Shipped timer sounds must still behave exactly as before for `Temple Bell`, `Gong`, and legacy saved labels.
- Timer-sound selection lists must stay calm and unchanged from the user perspective.
- Backend-unavailable `custom play` flows must still fall back to the built-in sample metadata catalog.
- Offline app-shell reopening must continue to work without introducing new user-visible prompts or noise.

## Data and state model

- Timer-sound metadata should become the single source for playable timer-sound labels and runtime resolution.
- Shipped timer sounds should be explicitly marked as bundled assets instead of being inferred from filename coincidence.
- Media-backed timer sounds should continue to resolve through `/media/sounds/<filename>` and the script-managed roots.
- Fallback `custom play` metadata should remain source-controlled in `src/data/customPlayMediaCatalog.json`, while actual recording files continue to live under backend and optional public media roots.
- Service-worker cache versioning should derive from a computed app asset version rather than duplicated string literals.

## Risks

- Simplifying sound metadata could break timer-sound dropdowns or legacy-label normalization if the catalog and helper logic drift.
- Removing tracked public sound files could break expectations if runtime code still depends on them somewhere unexpected.
- Changing service-worker versioning can cause stale cache behavior or excess invalidation if the derived version is wired incorrectly.
- Repairing the registration scripts must stay compatible with the current script-driven operator workflow.

## Milestones

1. Capture the current asset, script, and cache-version seams in this ExecPlan.
2. Centralize timer-sound metadata and clarify bundled-vs-media ownership.
3. Repair asset registration scripts and related docs around the chosen ownership model.
4. Replace hard-coded offline cache version strings with a derived app asset version.
5. Add or update focused tests.
6. Run verification, review findings, fix any real issues, and update durable docs.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- focused dry-run script checks for:
  - `npm run sound:add -- --label "..." --dry-run ...`
  - `npm run media:add:custom-play -- ... --dry-run ...`

## Decision log

- 2026-04-05: Treat `codex/cleanup` as the safe parent because it already contains the production-reference cleanup bundle required by Phase 4.
- 2026-04-05: Aim for one timer-sound metadata catalog that distinguishes bundled sounds from media-backed sounds instead of keeping a separate selectable-label file.
- 2026-04-05: Keep fallback `custom play` metadata source-controlled for backend-unavailable flows, but make that fallback ownership explicit rather than implying it is the primary media authority.
- 2026-04-05: Make the canonical timer-sound catalog strictly selectable and playable so operator tooling does not create label-only dead ends in production.
- 2026-04-05: Derive the offline cache namespace from one computed frontend asset version in `vite.config.ts`, then read that version from the service-worker registration URL inside `public/offline-sw.js`.
- 2026-04-05: Repair `add-custom-play-media.mjs` by reading the shared frontend meditation-type export from `src/types/referenceData.ts` instead of relying on a removed JSON file.

## Progress log

- 2026-04-05: Read the runner prompt, the media-cache bundle prompts, and the required repo/product docs.
- 2026-04-05: Confirmed `codex/cleanup` is a clean parent and created `codex/media-cache-hygiene-feature-bundle-with-branching`.
- 2026-04-05: Audited current drift points:
  - duplicated timer-sound metadata across `soundOptions.json` and `timerSoundCatalog.json`
  - shipped sounds present both as bundled assets and tracked public-media copies
  - `offlineApp.ts` and `public/offline-sw.js` sharing a hand-edited cache version string
  - `add-custom-play-media.mjs` still referencing the removed `src/data/meditationTypes.json`
- 2026-04-05: Implemented the new runtime model:
  - removed `src/data/soundOptions.json` and now derive selectable labels from `src/data/timerSoundCatalog.json` plus `None`
  - marked shipped timer sounds as `bundled` and removed the redundant tracked `public/media/sounds/*` copies
  - introduced `src/features/sync/offlineCacheVersion.ts` plus a Vite-computed `__APP_ASSET_VERSION__`
  - updated the service worker to derive cache names from its `?v=` registration URL
  - repaired `add-custom-play-media.mjs` to validate meditation types from `src/types/referenceData.ts`
- 2026-04-05: Verification passed for the final branch state:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test` with 47 files and 320 tests
  - `npm run build`
  - focused dry runs for `npm run sound:add -- ... --dry-run` and `npm run media:add:custom-play -- ... --dry-run`
  - built-artifact inspection confirmed the old hard-coded offline cache token is absent and the app bundle carries one computed asset version

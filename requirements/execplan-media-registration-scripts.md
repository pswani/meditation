# ExecPlan: Sound And Prerecorded Meditation Registration Scripts

## 1. Objective
Add documented local scripts that let operators:
- register a new selectable timer sound label
- register a new prerecorded `custom play` meditation asset
- avoid manual multi-file edits for frontend fallback catalogs and backend H2 media metadata

## 2. Why
The repository already documents how media and sound data is represented, but adding new entries still requires manual edits across multiple files. A small scripting layer reduces operator friction and keeps the catalog changes more trustworthy.

## 3. Scope
Included:
- create script-friendly source-of-truth files for:
  - meditation types
  - sound options
  - frontend fallback prerecorded-media catalog
- add CLI helpers for:
  - timer sound option registration
  - prerecorded `custom play` media registration
- make prerecorded-media registration create a new Flyway migration instead of rewriting the old seed migration
- document CLI parameters, workflow, and current limitations
- update decisions and session handoff

Excluded:
- implementing timer or playlist audio playback
- building a full admin media-management UI
- adding upload APIs
- refactoring unrelated domain logic

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/prompts.md`

## 5. Affected files and modules
- `package.json`
- `README.md`
- `docs/media-registration-scripts.md`
- `requirements/execplan-media-registration-scripts.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `src/data/meditationTypes.json`
- `src/data/soundOptions.json`
- `src/data/customPlayMediaCatalog.json`
- `src/features/timer/constants.ts`
- `src/utils/mediaAssetApi.ts`
- `src/test/setup.ts`
- `scripts/media-registration-utils.mjs`
- `scripts/add-sound-option.mjs`
- `scripts/add-custom-play-media.mjs`

## 6. UX behavior
- No product UI redesign is expected.
- A newly added sound label should appear automatically in the existing timer, settings, and `custom play` sound selectors.
- A newly registered prerecorded meditation should appear in the `Custom Plays` media picker after the backend restart applies the generated Flyway migration.
- The docs must explain clearly that:
  - sound registration adds a selectable label only
  - prerecorded-media registration adds linked-media metadata, not playback

## 7. Data and state model
- `src/data/soundOptions.json` becomes the editable source for selectable sound labels.
- `src/data/customPlayMediaCatalog.json` becomes the editable frontend fallback catalog for prerecorded media.
- Backend media additions are applied through new Flyway migrations in `backend/src/main/resources/db/migration/`.
- Existing DB history must remain append-only; do not mutate old applied migrations for new assets.

## 8. Risks
- Editing the original seed migration would create Flyway checksum drift for already-used local DBs.
- If the docs imply playback exists for timer sounds, users will expect behavior the product does not yet implement.
- File-copy helpers must remain optional so operators can register metadata even when media files are already staged manually.

## 9. Milestones
1. Create script-friendly source catalogs and update the app/test imports.
2. Implement `sound:add` and `media:add:custom-play`.
3. Document parameters, output files, and limitations.
4. Verify quality commands plus script dry-run flows.
5. Update decisions and handoff.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run sound:add -- --help`
- `npm run sound:add -- --label "Crystal Bowl" --dry-run`
- `npm run media:add:custom-play -- --help`
- `npm run media:add:custom-play -- --id media-sahaj-evening-25 --label "Sahaj Evening Sit (25 min)" --meditation-type Sahaj --filename sahaj-evening-25.mp3 --duration-minutes 25 --size-bytes 11000000 --dry-run`

## 11. Decision log
- Use JSON source files for editable sound and fallback media catalogs so the scripts can update one source of truth instead of patching multiple TypeScript arrays.
- Keep backend media additions append-only through new Flyway migrations rather than rewriting `V2__seed_reference_data.sql`.
- Let the sound-registration script optionally stage audio files for future playback work, but document clearly that the current app still treats sounds as labels only.

## 12. Progress log
- 2026-03-27: reviewed the current media catalog, sound-option, backend media-entity, and migration setup.
- 2026-03-27: moved editable sound and fallback media catalogs into JSON source files and updated the app/test imports.
- 2026-03-27: implemented `sound:add` and `media:add:custom-play`, including new Flyway migration generation for prerecorded media.
- 2026-03-27: documented CLI parameters, workflow, and current limitations in README and a dedicated media-script doc.
- 2026-03-27: passed `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
- 2026-03-27: verified `sound:add` and `media:add:custom-play` help output plus dry-run behavior.

# ExecPlan: Prototype Cleanup Pass 1

## 1. Objective
Remove the highest-priority prototype-only UX and journey scaffolding identified in `docs/prototype-cleanup-assessment.md` while preserving intentional sample data, reusable app flows, and the current local-first product behavior.

## 2. Why
The app is already a functioning product prototype, but a few leftover implementation details still leak into the user experience and persisted data shape. Cleaning those now improves trust, keeps the UI calmer, and makes the repo guidance more truthful for future contributors.

## 3. Scope
Included:
- remove unused placeholder-era styling
- update stale active prompt guidance that still instructs placeholder-screen work
- remove technical media-path and MIME-type leakage from the custom play UI
- stop persisting prototype-only custom-play media label/path fields in product records
- keep backward compatibility when loading existing stored custom plays
- update focused tests and touched docs

Excluded:
- backend or upload implementation
- live REST transport changes
- actual audio playback
- broad archive/reorganization of historical review or ExecPlan docs
- unrelated route, navigation, or shell refactors

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/prototype-cleanup-assessment.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/prompts.md`

## 5. Affected files and modules
- `src/types/customPlay.ts`
- `src/utils/customPlay.ts`
- `src/utils/storage.ts`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/index.css`
- `src/features/customPlays/CustomPlayManager.test.tsx`
- `src/utils/customPlay.test.ts`
- `src/utils/storage.test.ts`
- `src/App.test.tsx`
- `README.md`
- `requirements/prompts.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Custom play media selection should stay available as a real app flow.
- The UI should show human-readable linked media details only, not managed file paths or MIME types.
- Existing custom play create/edit/use/delete flows should behave exactly as before from a user perspective.
- Empty states and form placeholders that still serve real UX should remain.

## 7. Data and state model
- Keep `mediaAssetId` as the stored link between a custom play and the media catalog.
- Stop storing denormalized `mediaAssetLabel` and `mediaAssetPath` inside `CustomPlay` records.
- Derive display metadata from `mediaAssetId` and the current media catalog at render time.
- Continue to accept legacy stored custom-play records that still contain label/path fields, but normalize them into the slimmer runtime shape.

## 8. Risks
- Existing tests assume the old custom-play shape and will need coordinated updates.
- Legacy local storage entries may still contain old fields, so load normalization must remain permissive.
- README sections that currently describe path persistence need careful updates so the repo stays truthful after the model change.

## 9. Milestones
1. Simplify the custom play domain model and legacy normalization.
2. Update custom play UI copy and rendering to remove technical implementation leakage.
3. Remove the dead CSS remnant and stale placeholder prompt guidance.
4. Refresh tests and touched docs.
5. Run verification and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- manual code-path check that custom play create/edit/use/delete flows still use `mediaAssetId`
- manual code-path check that no touched UI still renders managed paths or MIME types
- confirm no backend commands are present in the repo

## 11. Decision log
- Keep the fixed custom-play media catalog for now as intentional sample/reference data.
- Treat media-path persistence as prototype-only scaffolding and remove it from product records.
- Keep the local playlist and sankalpa API seams untouched in this pass.

## 12. Progress log
- 2026-03-25: reviewed required docs and cleanup assessment.
- 2026-03-25: confirmed the cleanup slice can stay focused on custom-play persistence/UI plus stale guidance cleanup.
- 2026-03-25: implemented the custom-play model cleanup, removed dead placeholder-era remnants, and updated touched docs.
- 2026-03-25: passed `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

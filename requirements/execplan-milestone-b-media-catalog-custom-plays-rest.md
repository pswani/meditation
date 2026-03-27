# ExecPlan: Milestone B Media Catalog And Custom Plays REST

## 1. Objective
Implement the second Milestone B slice by keeping the existing backend media catalog and filesystem-backed media-root conventions, while moving `custom play` persistence from browser-local storage to backend-backed H2 + REST.

## 2. Why
The app already has a backend media catalog and configured media-root path handling, but saved `custom play` records still live only in the browser. Persisting `custom play` data in the backend makes Practice composition more trustworthy across reloads, aligns media references with the seeded catalog source of truth, and prepares playlists to reference backend-backed `custom play` records in the next slice.

## 3. Scope
Included:
- dedicated backend `custom play` persistence and REST endpoints
- H2 schema support for any missing `custom play` fields required by the current frontend model
- frontend API-boundary module for `custom play` list/upsert/delete
- frontend hydration and save/delete/favorite integration for `custom play` state
- calm load/sync feedback in the Practice tools area
- documentation for media-root placement and media-asset mapping
- focused backend and frontend tests
- docs, decisions, and session handoff updates

Excluded:
- playlist REST persistence
- sankalpa REST persistence
- media upload/import flows
- audio playback
- broad `TimerContext` decomposition
- unrelated UX redesigns outside the `custom play` area

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/milestone-b-practice-composition-fullstack/02-media-catalog-custom-plays-rest.md`

## 5. Affected files and modules
- `requirements/execplan-milestone-b-media-catalog-custom-plays-rest.md`
- `backend/src/main/resources/db/migration/*`
- `backend/src/main/java/com/meditation/backend/media/**`
- `backend/src/main/java/com/meditation/backend/customplay/**`
- `backend/src/test/java/com/meditation/backend/media/**`
- `backend/src/test/java/com/meditation/backend/customplay/**`
- `src/types/customPlay.ts`
- `src/utils/customPlay.ts`
- `src/utils/customPlayApi.ts`
- `src/utils/customPlayApi.test.ts`
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerContextObject.ts`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/features/customPlays/CustomPlayManager.test.tsx`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Practice continues to expose `custom play` management inside the existing Practice tools disclosure.
- Media session choices continue to come from the backend media catalog, with existing fallback behavior preserved when needed.
- `Custom play` save, update, favorite, and delete actions should reflect backend persistence truthfully.
- Practice should show calm load/sync states for `custom play` data:
  - loading backend custom plays
  - saving backend custom plays
  - inline warning when backend load/save/delete fails
- Layout and controls remain responsive and touch-friendly across phone, tablet, and desktop.

## 7. Data and state model
- Backend:
  - persist `custom play` rows in H2 using the existing `custom_play` table, extended as needed for current sound fields
  - validate optional `mediaAssetId` against available media assets
  - expose:
    - `GET /api/custom-plays`
    - `PUT /api/custom-plays/{id}`
    - `DELETE /api/custom-plays/{id}`
- Frontend:
  - keep `CustomPlay` shape stable for screen consumers
  - hydrate `custom plays` from backend on provider mount
  - preserve local storage as a migration source and fallback cache
  - persist create/update/favorite/delete actions through the new API boundary

## 8. Risks
- The current `custom_play` table predates the latest frontend model, so schema drift must be closed carefully.
- Async `custom play` persistence can create misleading save feedback if UI messaging is not updated.
- Existing local `custom play` records must not be silently lost during first backend hydration.
- `TimerContext` already carries many responsibilities, so the integration should stay deliberately small.

## 9. Milestones
1. Add the ExecPlan and inspect the current custom-play/media/backend seams.
2. Add backend schema/domain/repository/controller support for `custom play` persistence.
3. Add frontend `custom play` API-boundary helpers and provider hydration/persistence integration.
4. Update Practice custom-play UX feedback to reflect backend state truthfully.
5. Add focused backend/frontend tests.
6. Run full verification, update docs/handoff, and commit the slice.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## 11. Decision log
- Reuse the existing backend media catalog and media-root/file-path conventions instead of redesigning media handling in this slice.
- Preserve the current frontend `CustomPlay` contract and map backend DTOs to it rather than rewriting multiple consumers.
- Use backend detail upserts and deletes for `custom play` persistence so current IDs can migrate from local storage cleanly during first hydration.

## 12. Progress log
- 2026-03-26: reviewed the milestone prompt, the current backend media catalog implementation, the existing `custom play` frontend model/UI, and the current local-storage persistence path in `TimerContext`.
- 2026-03-26: implemented backend `custom play` persistence with H2 migration `V4__add_custom_play_sound_fields.sql`, controller/service/repository support, and validation for optional linked `media asset` ids.
- 2026-03-26: added frontend `custom play` REST helpers, backend hydration plus local-cache migration in `TimerContext`, and truthful async Practice feedback for `custom play` load/save/delete/favorite actions.
- 2026-03-26: completed prompt verification with:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 test`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify`

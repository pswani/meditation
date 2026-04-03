# ExecPlan: Custom-Play Media Library Foundation

## 1. Objective
Start the next managed media-library slice for `custom play` recordings by enriching the backend media asset model and making the frontend treat the backend-backed library as a first-class, informative selection source instead of a thin seeded catalog.

## 2. Why
The repo already has a `media_asset` table, a list API, and registration scripts, but the user-facing experience still feels like a seeded list with fallback data rather than a broader managed library. This slice should make the library more trustworthy and visible without broadening into upload/import UI.

## 3. Scope
Included:
- enrich custom-play media asset API responses with meditation type metadata
- preserve relative-path awareness across backend and frontend types
- improve the frontend media picker and library messaging so it reflects backend-managed library state, source, and empty/error conditions more clearly
- keep the existing registration script flow as the operator path and document it as part of the managed-library foundation
- focused frontend/backend tests and durable docs

Excluded:
- browser-based audio upload/import
- brand-new write APIs for media assets
- broad refactors of `TimerContext`
- unrelated playlist or runtime redesigns

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/media-registration-scripts.md`
- `prompts/run-milestone-bundle.md`
- `prompts/custom-play-media-library-feature-bundle/*.md`

## 5. Affected files and modules
- `backend/src/main/java/com/meditation/backend/media/*`
- backend media tests under `backend/src/test/java/com/meditation/backend/media/`
- `src/types/mediaAsset.ts`
- `src/utils/mediaAssetApi.ts`
- `src/utils/mediaAssetApi.test.ts`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/features/customPlays/CustomPlayManager.test.tsx`
- durable docs under `README.md`, `docs/architecture.md`, `docs/ux-spec.md`, `requirements/decisions.md`, `requirements/session-handoff.md`
- review/test artifacts under `docs/`

## 6. UX behavior
- The `custom play` manager should present the linked media session list as a managed library, not just a generic dropdown.
- Users should see clearer context for each media item, including meditation type where available.
- Empty library states should explain the next useful operator action without pretending the library is fully self-managed yet.
- Backend-unavailable or invalid-data states should stay calm and explicit.

## 7. Data and state model
- Extend media asset metadata to carry `meditationType`.
- Preserve `relativePath` through the API boundary so the managed library has complete reference metadata.
- Keep list loading read-only for this slice.
- Continue using the current registration script + Flyway migration path as the write path for managed media assets.

## 8. Risks
- The current sample fallback is convenient for local resilience, but it can blur whether the backend library is the source of truth.
- Adding richer metadata must not break existing `custom play` validation or linked-playlist runtime resolution.
- Empty-state copy must stay honest about current operator-driven registration rather than implying end-user upload exists already.

## 9. Milestones
1. Extend backend media asset response metadata and tests.
2. Extend frontend media asset types/API normalization and tests.
3. Improve `CustomPlayManager` media library UX and empty/error states.
4. Update docs, review, and verification artifacts.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

## 11. Decision log
- Keep this slice read-only from the browser; registration remains script-driven for now.
- Use richer metadata and clearer UX as the first managed-library step instead of adding premature upload infrastructure.

## 12. Progress log
- 2026-04-03: Reviewed bundle prompts, repo docs, current media registration scripts, backend media API, and frontend `custom play` media picker. Branch `feat/custom-play-media-library` created from `pending-wrk` at `2c02280`.
- 2026-04-03: Implemented the managed-library foundation slice across backend response metadata, frontend API normalization, `CustomPlayManager` UX messaging, fallback/empty/loading states, and registration-script catalog updates. Full frontend and backend verification completed successfully.

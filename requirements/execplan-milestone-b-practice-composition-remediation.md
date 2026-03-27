# ExecPlan: Milestone B Practice Composition Review Remediation

## 1. Objective
Fix the critical and important issues identified in `docs/review-practice-composition-fullstack.md`, while keeping scope bounded to Milestone B playlist trust, REST hygiene, and user feedback.

## 2. Why
The playlist slice now persists through H2 + REST, but the review found a few gaps that can still undermine trust:
- playlist delete failures can tell the user the wrong thing
- playlist runs can start from stale browser cache before backend hydration completes
- playlist-item id conflicts can still surface as raw database errors instead of clean validation

## 3. Scope
Included:
- truthful playlist delete failure feedback
- backend-hydration gating for playlist-run launch surfaces
- backend validation/schema changes needed to avoid cross-playlist external-id collisions
- focused tests for the changed playlist behavior
- docs, decisions, and session handoff updates

Excluded:
- sankalpa REST persistence
- nice-to-have `TimerContext` decomposition
- audio playback
- optional playlist item gaps
- unrelated UX redesigns outside playlist trust and feedback

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/review-practice-composition-fullstack.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/milestone-b-practice-composition-fullstack/05-remediate-practice-composition-fullstack.md`

## 5. Affected files and modules
- `requirements/execplan-milestone-b-practice-composition-remediation.md`
- `backend/src/main/resources/db/migration/*`
- `backend/src/main/java/com/meditation/backend/playlist/**`
- `backend/src/test/java/com/meditation/backend/playlist/**`
- `src/types/playlist.ts`
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerContextObject.ts`
- `src/features/playlists/PlaylistManager.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/PlaylistsPage.test.tsx`
- `src/App.test.tsx`
- `src/features/playlists/PlaylistManager.test.tsx` if needed
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Playlist delete failures should report the real problem:
  - active playlist run block
  - backend save/delete failure
- Playlist run actions should not start from stale cached definitions before backend playlist hydration completes.
- If playlists are still hydrating, launch surfaces should show calm guidance rather than silently doing nothing.

## 7. Data and state model
- Keep playlist definitions backend-backed with local cache fallback.
- Add explicit playlist-start block reason for backend hydration in progress.
- Keep playlist delete results expressive enough for UI feedback.
- Relax playlist-item external-id uniqueness to the playlist boundary rather than the whole table.

## 8. Risks
- Tightening playlist-run gating can change existing tests and shortcut behavior on Home/Playlists.
- Changing the playlist-item uniqueness constraint must preserve migrated data and keep updates safe.
- Error-message plumbing can regress if context result types and UI assumptions drift apart.

## 9. Milestones
1. Add the ExecPlan and inspect the reviewed failure paths.
2. Fix playlist delete result plumbing and user feedback.
3. Gate playlist-run launches on backend hydration and update launch feedback.
4. Fix playlist-item external-id hygiene in schema/backend validation.
5. Add/update focused tests.
6. Run full relevant verification, update docs, and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## 11. Decision log
- Keep remediation focused on important trust issues only; defer the `TimerContext` size concern as a later maintainability slice.
- Prefer explicit UI result shapes over inferring backend failure from a generic boolean outcome.
- Treat backend playlist hydration as the gate for playlist-run launch actions so H2 remains the source of truth.

## 12. Progress log
- 2026-03-26: reviewed `docs/review-practice-composition-fullstack.md`, the playlist launch/delete flows, and the backend playlist-item migration/validation path.
- 2026-03-26: updated playlist run/delete result plumbing so launch surfaces wait for backend hydration and delete failures no longer masquerade as active-run conflicts.
- 2026-03-26: added `V6__scope_playlist_item_external_id_uniqueness.sql` plus backend controller coverage proving different playlists can reuse the same playlist-item id safely.
- 2026-03-26: passed `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `mvn -Dmaven.repo.local=../local-data/m2 test`, and `mvn -Dmaven.repo.local=../local-data/m2 verify`.

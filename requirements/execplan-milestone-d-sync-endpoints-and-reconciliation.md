# ExecPlan: Milestone D Prompt 03 - Sync Endpoints And Reconciliation

## Objective
Add backend reconciliation behavior for the existing offline sync queue so queued writes can retry safely, avoid duplicate creation, and avoid overwriting newer backend state with stale offline mutations.

## Why this matters
Prompt 02 made the implemented frontend domains usable offline through local-first queue-backed writes. Prompt 03 needs the backend half of that model so retries and delayed flushes are safe instead of blindly replaying stale mutations onto H2-backed data.

## Scope
- Keep the existing REST routes in place and make them sync-safe.
- Add queued-mutation metadata from the frontend API boundaries during queue flushes.
- Add backend reconciliation rules for:
  - timer settings
  - session logs
  - custom plays
  - playlists
- Keep `sankalpa` queue replay compatible with the new sync metadata path, while relying on the current id-based upsert semantics because this milestone still has create-only `sankalpa` UI behavior.
- Add focused tests around stale-write protection, retry/idempotent replay behavior, and duplicate-safe flows.
- Update docs, decisions, and session handoff for prompt 03.

## Explicit exclusions
- No new external sync service or background worker.
- No multi-user collaboration or complex conflict UI.
- No tombstone-heavy deletion model unless the current prompt proves it is necessary.
- No unrelated refactor of route components or existing frontend screen structure.

## Source docs reviewed
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
- `prompts/milestone-d-offline-sync-fullstack/03-sync-endpoints-and-reconciliation.md`

## Affected files and modules
- Frontend API boundaries under `src/utils/`
- Offline queue flush orchestration in `src/features/timer/TimerContext.tsx`
- Offline queue flush orchestration in `src/features/sankalpa/useSankalpaProgress.ts`
- Backend REST controllers and services under:
  - `backend/src/main/java/com/meditation/backend/settings/`
  - `backend/src/main/java/com/meditation/backend/sessionlog/`
  - `backend/src/main/java/com/meditation/backend/customplay/`
  - `backend/src/main/java/com/meditation/backend/playlist/`
  - `backend/src/main/java/com/meditation/backend/sankalpa/`
- Backend tests under `backend/src/test/java/com/meditation/backend/**`

## UX behavior and validations
- Offline saves should continue to feel immediate and calm in the UI.
- Successful retry replay should quietly clear the queue and preserve the latest saved local state.
- Stale queued mutations must not overwrite newer backend state.
- When a mutation is considered stale, the backend should resolve it safely through existing REST responses rather than crashing or duplicating rows.
- Queue failure copy should stay explicit and lightweight.

## Data, state, and API model
- Use one queued-mutation timestamp carried from the frontend queue flush into REST requests.
- Prefer sync-safe behavior on existing endpoints over adding parallel `/sync/*` endpoints.
- Mutable backend-backed records should treat newer backend timestamps as authoritative for stale queued writes.
- Append-style or id-stable records should remain idempotent under retry.

## Risks and tradeoffs
- Silent stale-mutation no-ops can be calmer than hard conflicts, but the local UI may briefly differ until the next hydration brings server truth back in.
- Extending request contracts must stay backward-compatible with existing direct saves and current tests.
- `sankalpa` currently lacks true edit flows, so conflict behavior there should stay minimal and explicit rather than overengineering a premature model.

## Milestones
1. Add sync metadata plumbing to frontend API boundaries and queue flush callers.
2. Add backend reconciliation helpers and sync-safe service behavior on existing routes.
3. Add focused frontend and backend tests for retry, duplicate, and stale-write handling.
4. Run verification and update milestone docs.

## Verification plan
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## Decision log
- Prefer sync-safe behavior on the current REST endpoints instead of introducing a separate sync transport in this prompt.
- Use queued-mutation metadata from the browser queue as the reconciliation hint for stale-write protection.
- Treat timer settings, custom plays, and playlists as mutable records needing stale-write protection; rely on id-stable upsert behavior for session logs and the current create-only `sankalpa` flow.

## Progress log
- 2026-03-27: Reviewed prompt 03, current offline queue flush behavior, frontend API boundaries, and the existing backend services/controllers to define the smallest sync-safe reconciliation slice.

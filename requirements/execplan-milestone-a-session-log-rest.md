# ExecPlan: Milestone A Session Log REST And Core Settings

## 1. Objective
Implement the first end-to-end Milestone A full-stack slice by adding backend persistence and REST APIs for `session log` data and core timer settings/preferences, then wiring the frontend timer completion and History flow to those APIs with calm loading and error states.

## 2. Why
The repository now has a real Spring Boot + H2 foundation, but the core practice engine still stores `session log` history and timer defaults in browser storage. Moving this first slice to the backend makes the app more truthful as a full-stack product, strengthens History trust, and prepares Home, Practice, and Settings to share one persisted core data model.

## 3. Scope
Included:
- backend persistence and REST APIs for:
  - `session log`
  - core timer settings/preferences used by the timer flow
- Flyway migration updates needed for this slice
- frontend API boundaries for session logs and timer settings
- frontend integration so:
  - timer completion posts `session log` entries to the backend
  - manual log creation posts to the backend
  - History reads from the backend
  - timer settings load from and save to the backend
- calm loading and error states around backend-backed session-log flows
- focused backend and frontend tests
- docs, decisions, and session handoff updates

Excluded:
- playlist REST migration
- sankalpa REST migration
- custom-play CRUD REST migration
- summary backend aggregation
- audio playback
- auth, accounts, or remote deployment work
- unrelated refactors outside the Milestone A core flow

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
- `prompts/milestone-a-core-fullstack/01-session-log-domain-and-rest.md`

## 5. Affected files and modules
- `requirements/execplan-milestone-a-session-log-rest.md`
- `backend/src/main/resources/db/migration/*`
- `backend/src/main/java/com/meditation/backend/sessionlog/**`
- `backend/src/main/java/com/meditation/backend/settings/**`
- `backend/src/test/java/com/meditation/backend/sessionlog/**`
- `backend/src/test/java/com/meditation/backend/settings/**`
- `src/utils/sessionLogApi.ts`
- `src/utils/timerSettingsApi.ts`
- `src/utils/sessionLogApi.test.ts`
- `src/utils/timerSettingsApi.test.ts`
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerReducer.ts`
- `src/features/timer/timerContextObject.ts`
- `src/pages/HistoryPage.tsx`
- `src/pages/ActiveTimerPage.tsx`
- `src/pages/PracticePage.tsx`
- `src/pages/SettingsPage.tsx`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- History should load backend-backed `session log` data with explicit states:
  - loading
  - ready
  - save/load error guidance
- Timer completion and ended-early actions should only show success in History once the backend-backed log is saved.
- Manual log submission should surface backend-save failures clearly and keep the calm structure of the current form.
- Timer setup and settings should keep the current calm, responsive layout while using backend-backed timer preferences.
- Existing local recovery for active timer and active playlist state should remain local so interruption resilience does not regress in this slice.

## 7. Data and state model
- Backend:
  - extend `session_log` persistence to store the timer sound/interval fields already present in the frontend model
  - expose list/create endpoints for `session log`
  - add one persisted timer-settings/preferences record for the current single-user local app model
- Frontend:
  - keep active runtime state local in `TimerContext`
  - hydrate `settings` and `sessionLogs` from backend APIs after provider mount
  - keep local storage as a cache only where it still supports unaffected flows
  - add explicit sync state for backend-backed `session log` / settings operations

## 8. Risks
- Async hydration in `TimerContext` can create confusing UI flashes if loading state is not explicit.
- Timer completion currently happens inside reducer logic; moving log persistence to REST must not break timer correctness.
- Session-log REST shapes need to stay aligned with the existing frontend `SessionLog` domain model, including playlist metadata and timer sound settings.
- Current `settings` state is shared by Practice and Settings, so backend persistence must avoid unsafe regressions while preserving existing UX expectations for this slice.

## 9. Milestones
1. Add the ExecPlan and inspect the existing timer/session-log/settings boundaries.
2. Add backend migration and domain packages for `session log` and timer settings/preferences.
3. Add frontend REST boundary utilities and response normalization.
4. Rework `TimerContext` so session-log and timer-settings data hydrate and persist through the backend.
5. Add focused backend and frontend tests for the new contracts and flow.
6. Run verification, update docs/handoff, and commit the slice.

## 10. Verification
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Use one backend-backed timer-settings/preferences record for the current single-user local workflow instead of adding multi-profile complexity in Milestone A.
- Keep active-session recovery local-first and move only persisted `session log` / settings data to REST in this slice.
- Keep the frontend `SessionLog` shape stable and make backend DTOs adapt to that contract instead of rewriting UI consumers now.

## 12. Progress log
- 2026-03-26: reviewed milestone prompt 01, required docs, current backend schema, frontend timer/history/settings flows, and existing API-boundary patterns.

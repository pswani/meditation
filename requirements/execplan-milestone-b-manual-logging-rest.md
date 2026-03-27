# ExecPlan: Milestone B Manual Logging REST Support

## 1. Objective
Implement the first Milestone B slice by moving manual-log creation into the backend while preserving the existing calm History flow and unified `session log` history view.

## 2. Why
Manual logs already appear in backend-backed history, but they are still assembled entirely in the frontend and uploaded through the generic `session log` detail endpoint. Making manual-log creation backend-owned improves REST clarity, keeps validation trustworthy, and prepares the remaining practice-composition features to follow cleaner full-stack boundaries.

## 3. Scope
Included:
- dedicated backend REST create support for manual logs
- backend validation and construction of manual-log `session log` entries
- H2 persistence through the existing `session_log` table
- frontend History manual-log submission wired to the new backend create flow
- focused backend and frontend tests
- documentation, decisions, and session handoff updates

Excluded:
- custom play REST persistence
- media catalog expansion
- playlist REST persistence
- timer-settings changes
- broader `TimerContext` refactors
- audio playback work

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
- `prompts/milestone-b-practice-composition-fullstack/01-manual-logging-rest.md`

## 5. Affected files and modules
- `requirements/execplan-milestone-b-manual-logging-rest.md`
- `backend/src/main/java/com/meditation/backend/sessionlog/**`
- `backend/src/test/java/com/meditation/backend/sessionlog/**`
- `src/utils/manualLog.ts`
- `src/utils/manualLog.test.ts`
- `src/utils/sessionLogApi.ts`
- `src/utils/sessionLogApi.test.ts`
- `src/features/timer/TimerContext.tsx`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- History keeps the same manual-log form fields:
  - duration
  - meditation type
  - session timestamp
- Validation remains clear and human-readable before submission.
- Successful manual-log saves still show up in unified History immediately with `manual log` source labeling.
- Backend failures still surface calm warning copy without pretending the manual log was saved.

## 7. Data and state model
- The frontend continues to use `ManualLogInput` for the History form.
- The frontend sends a dedicated manual-log create request instead of a full `SessionLog` payload.
- The backend derives the persisted `session log` fields for manual logs:
  - generated id
  - `source = manual log`
  - `status = completed`
  - derived `startedAt` / `endedAt`
  - default sound/interval values
- The resulting persisted record remains part of the same `session_log` table and response model used by History.

## 8. Risks
- Manual timestamp parsing can drift if frontend and backend interpret local values differently.
- Changing only the manual-log flow must not break existing auto-log and playlist-log sync behavior.
- The new endpoint should stay additive so current `session log` sync for auto logs remains stable.

## 9. Milestones
1. Add the ExecPlan and confirm the current manual-log/frontend/backend boundaries.
2. Add backend request modeling, validation, and controller/service support for creating manual logs.
3. Add frontend API-boundary support for manual-log creation and wire History through `TimerContext`.
4. Add focused backend/frontend tests for the new flow.
5. Run full verification, update docs/handoff, and commit the slice.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## 11. Decision log
- Keep manual logs in the shared `session_log` table and response contract instead of introducing a separate persistence model.
- Add a dedicated create endpoint for manual logs while keeping the existing generic `session log` detail upsert endpoint for auto-log sync.
- Keep the History screen UX unchanged unless the backend-owned flow requires clearer save/error feedback.

## 12. Progress log
- 2026-03-26: reviewed the milestone prompt, repo docs, current History manual-log UX, `TimerContext` sync behavior, and the existing backend `session log` REST shape.
- 2026-03-26: added backend-owned manual-log creation at `POST /api/session-logs/manual` while keeping manual logs in the shared `session_log` table and shared response contract.
- 2026-03-26: switched History manual-log submission to the dedicated backend create route and added focused frontend/backend coverage for the new flow.
- 2026-03-26: completed verification:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 test`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify`

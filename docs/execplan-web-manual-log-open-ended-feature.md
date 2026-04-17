# ExecPlan: Web Manual Log Open-Ended Support

## 1. Objective
Allow the web History `manual log` flow to create `open-ended` session log entries while preserving fixed-duration manual logging, existing History readability, offline queue behavior, and backend reconciliation.

## 2. Why
The product requirements explicitly support open-ended meditation. The web app already supports open-ended timer sessions, but off-app practice logged from History is still forced into a fixed-duration shape. That makes manual history less truthful for users who practiced without a planned duration.

## 3. Scope
Included:
- History manual-log form support for selecting `fixed` or `open-ended`
- manual-log helper updates so saved entries carry the correct timer mode and planned-duration shape
- backend manual-log API alignment if needed to keep the explicit REST contract coherent
- focused frontend and backend tests
- review, test, and session-handoff docs for this slice

Excluded:
- broader History redesign
- native iPhone work
- sankalpa threshold or cadence work
- unrelated backend test-isolation changes

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
- `prompts/defects-enhancements-16Apr-phased-plan.md`
- `prompts/web-manual-log-open-ended-feature-bundle-with-branching/00-create-branch.md`
- `prompts/web-manual-log-open-ended-feature-bundle-with-branching/01-implement-web-manual-log-open-ended.md`

## 5. Affected files and modules
- `src/pages/HistoryPage.tsx`
- `src/utils/manualLog.ts`
- `src/utils/manualLog.test.ts`
- `src/pages/HistoryPage.test.tsx`
- `src/utils/sessionLogApi.ts`
- `src/utils/sessionLogApi.test.ts`
- `src/App.test.tsx`
- `backend/src/main/java/com/meditation/backend/sessionlog/ManualSessionLogCreateRequest.java`
- `backend/src/main/java/com/meditation/backend/sessionlog/SessionLogService.java`
- `backend/src/test/java/com/meditation/backend/sessionlog/SessionLogControllerTest.java`
- `requirements/session-handoff.md`
- `docs/review-web-manual-log-open-ended-feature.md`
- `docs/test-web-manual-log-open-ended-feature.md`

## 6. UX behavior
- History manual logging will expose a clear mode choice between `Fixed Duration` and `Open-Ended`.
- Fixed mode keeps the current duration field semantics and helper copy.
- Open-ended mode still requires actual completed duration and session end timestamp, but the saved record should show the `open-ended` badge and `Planned: Open-ended`.
- Validation remains calm and explicit:
  - duration must be greater than 0
  - meditation type is required
  - session timestamp is required and cannot be in the future

## 7. Data and state model
- Extend `ManualLogInput` with `timerMode`.
- Build manual `SessionLog` entries with:
  - `timerMode: "fixed"` and `intendedDurationSeconds = completedDurationSeconds` for fixed manual logs
  - `timerMode: "open-ended"` and `intendedDurationSeconds = null` for open-ended manual logs
- Preserve `startedAt = endedAt - completedDurationSeconds`.
- Offline queue replay can continue using the existing `session-log` upsert flow because the general session-log contract already supports open-ended entries.
- The dedicated backend manual-create request may need the same `timerMode` field so the explicit REST boundary does not lag behind the UI contract.

## 8. Risks
- History copy could become confusing if open-ended logs still talk like fixed planned sessions.
- A partial change only in the frontend helper could leave the dedicated manual-create API inconsistent with the rest of the session-log contract.
- Existing manual-log tests are mostly fixed-mode focused, so regressions could slip through without updating both UI and persistence coverage.

## 9. Milestones
1. Add the manual-log mode field and helper logic for open-ended entry construction.
2. Update History UI to collect and explain the new mode without regressing existing validation.
3. Align the dedicated backend manual-log contract if needed.
4. Add focused frontend and backend tests.
5. Review, verify, and document the final slice.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/` if the backend manual-log contract changes
- Manual check of History manual-log creation for fixed and open-ended flows if practical

## 11. Decision log
- 2026-04-16: Initial contract review shows the persisted `SessionLog` model and backend `PUT /api/session-logs/{id}` flow already support `timerMode: "open-ended"` with `intendedDurationSeconds: null`.
- 2026-04-16: The current gap is concentrated in the manual-log input path, which still hard-codes fixed mode in `src/utils/manualLog.ts` and in the History form.
- 2026-04-16: The dedicated `POST /api/session-logs/manual` request currently only models fixed-duration input, so it should be reviewed for alignment even though the current app path primarily uses queued `PUT` upserts.
- 2026-04-16: The backend manual-create request now accepts `timerMode`, but omitted values still default to `fixed` so older callers remain compatible while open-ended manual logs become expressible through the explicit REST boundary.
- Parent branch: `codex/defects-enhancements-16Apr`
- Feature branch: `codex/web-manual-log-open-ended-feature-bundle-with-branching`

## 12. Progress log
- 2026-04-16: Read required product, architecture, UX, roadmap, and handoff docs.
- 2026-04-16: Inspected History, manual-log helpers, session-log helpers, API boundaries, TimerContext manual-log save flow, and backend session-log controller or service tests.
- 2026-04-16: Confirmed that the existing backend session-log storage contract already supports open-ended logs; implementation can stay narrowly scoped to manual-log input and contract alignment.
- 2026-04-16: Implemented fixed/open-ended mode selection for History manual logs, updated manual-log entry construction, aligned the backend manual-create contract, and added focused frontend plus backend tests.
- 2026-04-16: Reviewed the branch with no remaining findings, then passed `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and `mvn -Dmaven.repo.local=../local-data/m2 verify`.

# ExecPlan: History Meditation-Type Edit Feature

## Objective
Align the History meditation-type correction flow across web, backend, and native by making one explicit product rule: only `manual log` records may change meditation type after they are saved.

## Why
History has to stay trustworthy. The native iPhone app already treats auto-created timer, `custom play`, and playlist logs as read-only, but the web app does not yet expose a matching correction flow and the backend `session log` upsert route still accepts broader rewrites. This slice closes that drift without widening edits beyond what the product can defend.

## Scope
- add a discoverable web History meditation-type correction flow for eligible `manual log` entries
- keep auto-created history entries read-only
- enforce the same rule at the backend session-log boundary
- add focused positive and negative tests around allowed and disallowed edits
- update durable docs and slice artifacts

Explicit exclusions:
- broad History redesign
- manual-log duration or timestamp editing
- unrelated native UX work unless parity docs or tests need light alignment
- audio, sankalpa, branding, or reminder changes

## Source Documents
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/history-meditation-type-edit-feature-bundle-with-branching/*`
- `docs/execplan-ios-native-history-goals-build-branding-defects-feature.md`

## Affected Files And Modules
- `src/pages/HistoryPage.tsx`
- `src/pages/HistoryPage.test.tsx`
- `src/utils/sessionLog.ts`
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerContextObject.ts`
- `backend/src/main/java/com/meditation/backend/sessionlog/SessionLogService.java`
- `backend/src/test/java/com/meditation/backend/sessionlog/SessionLogControllerTest.java`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-history-meditation-type-edit-feature.md`
- `docs/test-history-meditation-type-edit-feature.md`

## UX Behavior
- History explains calmly that only `manual log` entries can change meditation type later.
- Eligible `manual log` entries expose a clear `Change meditation type` action.
- The edit flow changes only the meditation type and keeps duration, session time, source, and status unchanged.
- Auto-created timer, `custom play`, and playlist logs remain read-only and are not presented as editable.
- Offline or backend-unavailable saves stay local-first and queue-backed, using the existing calm sync messaging.

## Data And State Model
- The editable rule is derived from `SessionLog.source === "manual log"`.
- Web History will stage one local meditation-type edit at a time and commit it through the shared `session log` upsert queue.
- Existing manual-log edits remain id-stable by reusing the stored `SessionLog.id`.
- Backend validation should allow:
  - creating new `session log` records
  - idempotent replays of unchanged existing records
  - meditation-type-only edits for existing `manual log` records
- Backend validation should reject mutable rewrites for existing auto-created records and broader field mutations on existing manual logs.

## Risks
- Over-tightening backend validation could break ordinary queued session-log replay if idempotent retries are misclassified as edits.
- Under-tightening backend validation would leave the trust gap open even if the UI looks correct.
- Web History copy must stay clear without cluttering every row.

## Milestones
1. Capture the final manual-log-only rule in this plan and confirm existing native parity.
2. Add shared web eligibility helpers plus a History correction UI for manual logs.
3. Add a Timer context mutation path for local-first meditation-type corrections.
4. Tighten backend session-log validation around existing-record edits.
5. Add focused frontend and backend tests, then update docs and bundle artifacts.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- targeted backend verification through existing Spring tests
- `swift test --package-path ios-native`
- native build verification only if any native files change

## Decision Log
- 2026-04-17: Keep the final product rule as manual-log-only meditation-type correction. This matches the current native implementation and the repo’s existing native decision trail, while preserving history trustworthiness across timer, `custom play`, and playlist logs.

## Progress Log
- 2026-04-17: Reviewed bundle prompts and repo docs, audited current History behavior on web, backend, and native, and confirmed the current drift: native already enforces manual-log-only edits, web lacks the correction flow, and backend upsert validation is still too permissive for existing records.
- 2026-04-17: Implemented the web manual-log correction flow, added shared History edit helpers plus local-first queue-backed mutation wiring, tightened backend existing-record validation, and added focused frontend and backend coverage.
- 2026-04-17: Verification passed with `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `mvn -Dmaven.repo.local=../local-data/m2 -Dtest=SessionLogControllerTest test`, and `swift test --package-path ios-native`.
- 2026-04-17: Bundle rerun from `codex/defects-enhancements-16Apr` confirmed the parent branch already contains the intended manual-log-only behavior with matching web, backend, and native enforcement. Re-ran the same verification on `codex/history-meditation-type-edit-feature-bundle-with-branching` and refreshed the slice test artifact with the current native package-test totals.

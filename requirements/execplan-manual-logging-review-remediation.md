# ExecPlan: Manual Logging Review Remediation

## 1. Objective
Fix critical and important issues from `docs/review-manual-logging.md` for manual logging and minimum supporting history behavior.

## 2. Why
Manual logging is a trust-critical capture flow for off-app meditation. Incorrect timestamp semantics or misleading recency ordering undermines user confidence and summary accuracy.

## 3. Scope
Included:
- manual log timestamp semantics fix
- manual log timestamp validation hardening
- history ordering fix for mixed manual/auto entries based on recency
- focused tests for changed utility/reducer behavior

Excluded:
- custom play behavior
- playlist UX changes
- summary UI redesign
- backend integration

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- docs/review-manual-logging.md

## 5. Affected files and modules
- `src/utils/manualLog.ts`
- `src/features/timer/timerReducer.ts`
- `src/utils/manualLog.test.ts`
- `src/features/timer/timerReducer.test.ts`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- `Session timestamp` in manual logging is interpreted as the local time the session ended.
- Validation blocks malformed timestamps with clear, human-readable guidance.
- `Recent Session Logs` reflects actual recency by session end time across manual and auto logs.

## 7. Data and state model
- Manual entry construction derives:
  - `endedAt` from input timestamp
  - `startedAt` as `endedAt - duration`
- Manual timestamp validity is validated prior to save.
- Session log insertion pipeline sorts by `endedAt` descending and then truncates to max history length.

## 8. Risks
- Sorting change could alter assumptions in UI/tests that depended on insertion order.
- Date parsing behavior can vary if parsing is not constrained to valid `datetime-local` values.

## 9. Milestones
1. Add/update review artifact and finalize remediation plan.
2. Implement manual timestamp validation + entry construction fixes.
3. Implement recency ordering in shared log reducer path.
4. Update focused tests.
5. Run required verification commands.
6. Update decisions and session handoff docs.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - save valid manual log and confirm source/status labels remain correct
  - reject malformed timestamp with clear error text
  - verify older manual backfill does not appear above newer logs

## 11. Decision log
- Keep remediation scoped to manual logging + minimum shared history behavior.
- Treat manual `session timestamp` as end time to match UI copy and user expectation.
- Apply ordering in reducer-level append path to keep behavior consistent for all log writers.

## 12. Progress log
- Completed: source-doc review for prompt and scope.
- Completed: created `docs/review-manual-logging.md` with critical/important findings used for this remediation.
- Completed: manual log timestamp semantics fix (`session timestamp` interpreted as end time).
- Completed: manual timestamp validation hardening for malformed datetime values.
- Completed: session log reducer insertion ordering by `endedAt` recency.
- Completed: focused tests for manual log validation/derivation and recency ordering.
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Completed: documentation updates in `requirements/decisions.md` and `requirements/session-handoff.md`.

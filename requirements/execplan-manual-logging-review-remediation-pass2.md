# ExecPlan: Manual Logging Review Remediation (Pass 2)

## 1. Objective
Fix the remaining important issues from `docs/review-manual-logging.md` while keeping scope bounded to manual logging and minimal supporting history behavior.

## 2. Why
Manual logging is a trust-sensitive flow. Future-dated entries and weak persistence-boundary validation can undermine confidence in summaries and history correctness.

## 3. Scope
Included:
- block future `session timestamp` values in manual log validation
- add session-log shape validation during storage load
- preserve valid stored entries while discarding malformed entries
- update focused tests for changed validation and storage behavior

Excluded:
- history filtering UX enhancements
- focus/scroll polish after save
- playlist/custom-play changes
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
- `src/utils/storage.ts`
- `src/utils/manualLog.test.ts`
- `src/utils/storage.test.ts`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Manual log submission rejects timestamps later than current time with clear human-readable feedback.
- History data loading ignores malformed stored session log entries instead of admitting invalid rows into UI state.

## 7. Data and state model
- Manual log validation compares parsed `sessionTimestamp` against `now`.
- Session log storage loading now enforces a minimal required shape:
  - id/timestamps/type/duration/status/source/sound fields
  - valid `status` and `source` enum values

## 8. Risks
- Time-dependent validation can produce flaky tests unless current time is controlled.
- Too-strict storage validation could drop legacy-but-usable entries if guard is not carefully scoped.

## 9. Milestones
1. Add ExecPlan and confirm bounded remediation scope.
2. Implement future-timestamp validation guardrail.
3. Implement session-log load shape guard and filtering.
4. Update focused tests.
5. Run required verification commands.
6. Update decisions and session handoff.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - entering a future timestamp surfaces validation error
  - malformed local session logs are ignored while valid entries still render

## 11. Decision log
- Keep remediation strictly to critical/important items from current review artifact.
- Favor local validation guardrails over silent acceptance for future timestamps.

## 12. Progress log
- Completed: reviewed prompt and required source documents.
- Completed: reviewed current findings in `docs/review-manual-logging.md`.
- Completed: implemented manual-log future timestamp guardrail.
- Completed: implemented session-log shape validation and malformed-entry filtering in storage loader.
- Completed: added focused tests for manual-log future timestamp validation and storage malformed-entry filtering.
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Completed: updated decisions and session handoff documentation.

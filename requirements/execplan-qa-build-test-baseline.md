# ExecPlan: QA Build/Test Baseline

## 1. Objective
Establish a stable, repeatable local baseline for install, typecheck, lint, test, build, and local run readiness before milestone implementation.

## 2. Why
Milestone feature work depends on a trustworthy baseline. If setup or tests are flaky, future slices slow down and regressions become harder to isolate.

## 3. Scope
Included:
- verify `npm install`, typecheck, lint, test, and build
- tighten foundational test reliability where fragile
- update README setup/verification guidance
- update decisions and session handoff

Excluded:
- major feature implementation
- backend/cloud sync work
- unrelated refactors

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
- prompts/foundation/03-qa-build-test-baseline.md

## 5. Affected files and modules
- `src/test/setup.ts`
- `README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/execplan-qa-build-test-baseline.md` (new)

## 6. UX behavior
- No user-facing feature changes are expected in this slice.
- Goal is operational confidence for existing UX through reliable checks.

## 7. Data and state model
- No domain model or persistence contract changes.
- Test environment baseline is strengthened by consistent per-test cleanup/local storage reset.

## 8. Risks
- Over-correcting tests and touching too many files for a baseline slice.
- Hidden environment assumptions (Node/npm versions) causing inconsistent local behavior.

## 9. Milestones
1. Review prompt and required docs.
2. Run baseline verification commands and capture status.
3. Apply minimal reliability hardening in shared test setup.
4. Update README, decisions, and session handoff.
5. Re-run full verification.

## 10. Verification
- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Prefer shared test setup hardening over scattered per-file fixes to keep reliability improvements maintainable.
- Keep this slice focused on execution readiness, not feature expansion.

## 12. Progress log
- Completed: reviewed required prompt and repository documents.
- Completed: baseline verification succeeded for install/typecheck/lint/test/build.
- Completed: introduced shared test setup isolation (`localStorage.clear()` before each test and `cleanup()` after each test).
- Completed: updated README and handoff/decision docs for baseline status and next prompt guidance.

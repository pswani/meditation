# ExecPlan: Milestone C Discipline and Insight Testing QA

## 1. Objective
Strengthen Milestone C test reliability and coverage for summaries and sankalpa flows, including date-range behavior, time-of-day behavior, counting rules, and relevant REST-style boundaries.

## 2. Why
Milestone C behavior is implemented and recently remediated for UX clarity. This pass hardens confidence by increasing targeted coverage around edge cases and integration boundaries that can silently regress.

## 3. Scope
Included:
- Focused tests for summary derivation/date-range edge behavior
- Focused tests for sankalpa counting and time-of-day filter behavior
- Focused tests for sankalpa REST-style API boundary behavior
- Fragility improvements in touched tests if needed
- Required verification and docs updates

Excluded:
- Feature behavior redesigns
- New routes or UI architecture changes
- Backend integration implementation
- Unrelated timer/history/playlist/custom-play feature changes

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
- prompts/milestone-c-discipline-and-insight/07-test-discipline-and-insight.md

## 5. Affected files and modules
- `src/utils/summary.test.ts`
- `src/utils/sankalpa.test.ts`
- `src/utils/sankalpaApi.test.ts`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
No user-facing UX changes are intended in this pass. Validation is test-only and should preserve current summary and sankalpa behavior.

## 7. Data and state model
No runtime model changes. This pass verifies existing summary/sankalpa derivation and storage/API boundary contracts.

## 8. Risks
- Overly-coupled assertions can make tests brittle against harmless copy/ordering changes.
- Time-sensitive tests can flake if date boundaries are not controlled carefully.
- Boundary tests can duplicate existing coverage if not scoped to new edge cases.

## 9. Milestones
1. Add ExecPlan and map target QA gaps.
2. Strengthen summary/date-range/by-type test coverage.
3. Strengthen sankalpa counting/time-of-day filter test coverage.
4. Strengthen sankalpa API-boundary test coverage.
5. Run full verification and fix regressions.
6. Update decisions/session-handoff and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Keep this pass strictly QA-focused with no intentional product-behavior changes.
- Prioritize deterministic utility-level tests for edge conditions over broad UI snapshot expansion.

## 12. Progress log
- Completed: required document review and current Milestone C test surface audit.
- Completed: strengthened summary tests in `src/utils/summary.test.ts` for:
  - same-day boundary inclusivity
  - by-type counts under filtered date ranges
  - malformed `endedAt` exclusion.
- Completed: strengthened sankalpa tests in `src/utils/sankalpa.test.ts` for:
  - time-of-day bucket boundary matching
  - completed-vs-expired status precedence after deadline
  - explicit `getTimeOfDayBucket` boundary mapping.
- Completed: strengthened API-boundary tests in `src/utils/sankalpaApi.test.ts` for malformed persisted payload handling.
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`

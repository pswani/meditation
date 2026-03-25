# ExecPlan: Milestone C Sankalpa Goals

## 1. Objective
Implement and harden the sankalpa goal slice with clear counting rules, robust local-first persistence boundaries, and focused sankalpa logic/API tests.

## 2. Why
Sankalpa is the discipline layer of the app. Users need confidence that goals, filters, and progress are computed consistently and saved safely.

## 3. Scope
Included:
- Duration-based and session-count-based sankalpa behavior hardening
- Optional `meditation type` and `time-of-day` filter support validation/coverage
- Clear in-UI definition of what counts toward progress
- Local-first REST-style sankalpa API boundary utility
- Sankalpa storage normalization to drop malformed persisted goals
- Focused sankalpa counting and API-boundary tests

Excluded:
- backend/cloud persistence implementation
- reminders/notifications
- unrelated summary/history/timer refactors

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
- prompts/milestone-c-discipline-and-insight/04-implement-sankalpa.md

## 5. Affected files and modules
- `src/utils/sankalpa.ts`
- `src/utils/sankalpa.test.ts`
- `src/utils/sankalpaApi.ts` (new)
- `src/utils/sankalpaApi.test.ts` (new)
- `src/utils/storage.ts`
- `src/utils/storage.test.ts`
- `src/pages/SankalpaPage.tsx`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Sankalpa creation supports:
  - duration-based goals
  - session-count-based goals
  - optional meditation type filter
  - optional time-of-day filter
- UI explicitly states what counts toward progress:
  - both auto and manual logs
  - ended-early duration included for duration goals
  - goal window boundaries and optional filters applied
- Progress and remaining requirement display remain readable on phone/tablet/desktop.

## 7. Data and state model
- Sankalpas remain local-first.
- Add REST-style boundary for future backend alignment:
  - collection endpoint `/api/sankalpas`
  - detail endpoint `/api/sankalpas/:id`
- Harden storage load path by validating persisted sankalpa shape and enums before use.

## 8. Risks
- Tightening validation can drop legacy malformed records that were previously accepted.
- Mixed goal-type validation rules (integer vs non-integer targets) can introduce UX confusion if copy is unclear.

## 9. Milestones
1. Add sankalpa API boundary utility and tests.
2. Harden sankalpa validation and counting-rule tests.
3. Harden sankalpa storage normalization and tests.
4. Update Sankalpa page copy + persistence wiring through API boundary.
5. Run verification, update docs, and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Keep sankalpa persistence local-first but route through an API boundary utility for backend readiness.
- Validate stored sankalpa records at load boundary to preserve progress trustworthiness.

## 12. Progress log
- Completed: source-doc review and scope alignment.
- Completed: sankalpa API boundary utility + endpoint contracts.
- Completed: sankalpa validation hardening for:
  - integer `days`
  - integer `session-count-based` targets
- Completed: sankalpa storage normalization and malformed-entry filtering.
- Completed: Sankalpa page updates:
  - persistence routed through sankalpa API boundary
  - expanded counting-rule copy clarity
  - integer input stepping for `days` and session-count targets
- Completed: focused tests added/updated:
  - `src/utils/sankalpa.test.ts`
  - `src/utils/storage.test.ts`
  - `src/pages/SankalpaPage.test.tsx`
  - `src/utils/sankalpaApi.test.ts`
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`

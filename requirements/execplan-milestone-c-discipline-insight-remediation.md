# ExecPlan: Milestone C Discipline Insight Remediation

## 1. Objective
Remediate the important Milestone C review findings so `sankalpa` persistence stays aligned with the backend source of truth and time-of-day bucketing stays consistent between backend-backed and fallback insight behavior.

## 2. Why
Milestone C introduced the full-stack `summary` and `sankalpa` slices, but the review found two trust risks:
- `sankalpa` saves can fork local UI state away from H2-backed truth on non-network API failures
- backend time-of-day bucketing can disagree with browser-local fallback behavior

These are exactly the kinds of subtle inconsistencies that would make an insight feature feel less reliable.

## 3. Scope
Included:
- tighten `sankalpa` save fallback behavior so only true offline/unreachable cases can save locally
- preserve truthful user feedback for backend save failures
- add an explicit time-zone input to the new backend summary and `sankalpa` routes
- send browser time-zone context from the frontend summary and `sankalpa` clients
- add focused frontend and backend tests for the remediated behavior
- update docs, decisions, and session-handoff

Excluded:
- new `sankalpa` edit/archive/delete UI
- broader analytics redesign
- unrelated timer, playlist, or media refactors

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/review-discipline-insight-fullstack.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/milestone-c-discipline-insight-fullstack/04-remediate-discipline-insight-fullstack.md`

## 5. Affected files and modules
- `backend/src/main/java/com/meditation/backend/summary/*`
- `backend/src/main/java/com/meditation/backend/sankalpa/*`
- `backend/src/test/java/com/meditation/backend/summary/*`
- `backend/src/test/java/com/meditation/backend/sankalpa/*`
- `src/features/sankalpa/useSankalpaProgress.ts`
- `src/pages/SankalpaPage.tsx`
- `src/pages/SankalpaPage.test.tsx`
- `src/utils/sankalpaApi.ts`
- `src/utils/sankalpaApi.test.ts`
- `src/utils/summaryApi.ts`
- `src/utils/summaryApi.test.ts`
- `src/utils/timeZone.ts`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- If the backend cannot be reached while saving a `sankalpa`, the app may still save locally, but it must say so plainly and style the result as degraded persistence rather than clean success.
- If the backend rejects a `sankalpa` save with a non-network error, the app should not silently save a divergent local goal.
- `summary` and `sankalpa` time-of-day behavior should stay consistent with the user’s browser-local timezone instead of silently depending on the backend host timezone.

## 7. Data and state model
- Backend summary and `sankalpa` routes should accept an explicit browser time-zone identifier for bucketing logic.
- Frontend `summary` and `sankalpa` clients should pass the browser time zone when available.
- `sankalpa` local-save fallback remains a network-unavailable contingency, not a blanket backup path for any API failure.

## 8. Risks
- Time-zone parsing must fail cleanly for invalid zone ids.
- Save-flow changes can easily introduce duplicate or missing user feedback if page and hook responsibilities are not separated clearly.
- Adding query parameters to new routes must preserve the existing endpoint shape and tests.

## 9. Milestones
1. Define the remediation contract for save fallback and time-zone input.
2. Patch backend summary and `sankalpa` services/controllers to use explicit time-zone context.
3. Patch frontend `summary` and `sankalpa` clients plus the shared hook/save feedback behavior.
4. Add focused tests for rejected saves, offline fallback, and time-zone-aware route behavior.
5. Run verification, update docs, and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## 11. Decision log
- Keep the remediation bounded to review findings that materially affect data trust and behavioral consistency.
- Prefer explicit browser time-zone input over silently relying on backend host timezone for time-of-day insight buckets.
- Preserve local `sankalpa` fallback only for real backend unreachability, not for any non-2xx API response.

## 12. Progress log
- Completed: review findings triage and remediation scoping.
- Completed: remediation contract and execution plan.
- Completed: backend `summary` and `sankalpa` time-of-day bucketing now accept explicit browser time-zone input.
- Completed: frontend `summary` and `sankalpa` API boundaries now send browser time-zone context when available.
- Completed: `sankalpa` save fallback now stays local-only for network failures, while backend rejections remain inline errors.
- Completed: focused frontend and backend remediation coverage added for rejected saves and time-zone-aware bucketing.
- Completed: verification passed with `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `mvn -Dmaven.repo.local=../local-data/m2 test`, and `mvn -Dmaven.repo.local=../local-data/m2 verify`.

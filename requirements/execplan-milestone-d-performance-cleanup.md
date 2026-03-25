# ExecPlan: Milestone D Performance Cleanup

## 1. Objective
Remove obvious front-end inefficiencies in state bootstrapping and persistence behavior without changing product behavior or introducing speculative optimizations.

## 2. Why
This app is local-first, so unnecessary persistence and repeated startup work directly add noise and cost to common flows. Production-readiness should trim those obvious inefficiencies while keeping behavior stable and trustworthy.

## 3. Scope
Included:
- Review current provider/page persistence patterns for no-op writes
- Reduce duplicated startup loading work where practical
- Skip redundant first-render persistence when loaded state is already current
- Preserve safety for active-session recovery paths that do need corrective persistence
- Add focused tests for the optimized persistence behavior

Excluded:
- Broad architectural refactors
- Speculative rendering micro-optimizations
- New feature work
- Backend implementation beyond existing local-first API-style boundaries

## 4. Source documents
- AGENTS.md
- PLANS.md
- README.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/milestone-d-production-readiness/03-performance-cleanup.md

## 5. Affected files and modules
- `src/features/timer/TimerContext.tsx`
- `src/pages/SankalpaPage.tsx`
- `src/utils/storage.ts`
- `src/App.test.tsx`
- `src/pages/SankalpaPage.test.tsx`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
No intended UX changes. This slice should only reduce unnecessary work behind the scenes while preserving current behavior, especially around:
- active-session recovery
- local-first persistence
- sankalpa summary/goal rendering

## 7. Data and state model
No domain-model changes intended. This slice refines:
- how initial persisted state is loaded
- when local persistence writes occur
- how unchanged data avoids redundant writes on startup

## 8. Risks
- Over-skipping persistence could accidentally prevent recovery corrections from being saved.
- Startup refactors can be subtle because the provider currently mixes loading, hydration, and persistence.
- Performance changes without tests are easy to regress silently.

## 9. Milestones
1. Audit current bootstrapping and persistence boundaries for obvious waste.
2. Refactor provider/page startup to skip no-op persistence writes while preserving required recovery writes.
3. Add focused tests for stable-mount no-op behavior.
4. Run required verification and update handoff docs.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Focus this slice on wasteful persistence/update patterns rather than broad render refactors.
- Preserve corrective writes for recovered or cleared active runtime state on first mount.
- Prefer targeted startup optimizations with regression tests over speculative component memoization.

## 12. Progress log
- Completed: prompt and required-doc review.
- Completed: audit of current provider/page persistence flow.
- Completed: implemented bounded startup persistence cleanup in timer provider bootstrapping and sankalpa persistence flow.
- Completed: added regression tests for stable-mount no-op persistence behavior.
- Completed: required verification run (`typecheck`, `lint`, `test`, `build`) with all checks passing.

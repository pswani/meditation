# ExecPlan: Milestone D Prompt 05 - Offline Sync Remediation

## Objective
Remediate the important issues identified in `docs/review-offline-sync-fullstack.md` without broadening Milestone D beyond its offline-sync scope.

## Why this matters
Prompt 04 confirmed that the current offline sync slice works, but still has two meaningful gaps:
- `sankalpa` queue replay churn can hide failed sync state and create extra backend traffic
- stale queued deletes can look successful and then surprise the user when a newer backend record reappears

Prompt 05 should fix those specific issues before the milestone moves on to final testing and merge work.

## Scope
- Stop `sankalpa` hydration from re-enqueueing already queued goals and from reloading on queue state-only churn.
- Make stale queued deletes for `custom play` and playlist records explicit to the frontend instead of silent no-ops.
- Restore newer backend-backed records locally when a stale delete loses conflict resolution, with calm warning copy.
- Add focused tests for the new queue and stale-delete behavior.
- Update docs and session handoff for prompt 05.

## Explicit exclusions
- No multi-user conflict system.
- No tombstone persistence model unless required to fix the current prompt findings.
- No broader sync redesign or background worker.
- No remediation of the prompt 04 nice-to-have findings in this prompt.

## Source docs reviewed
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/review-offline-sync-fullstack.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/milestone-d-offline-sync-fullstack/05-remediate-offline-sync-fullstack.md`

## Affected files and modules
- `src/features/sankalpa/useSankalpaProgress.ts`
- `src/features/timer/TimerContext.tsx`
- `src/utils/customPlayApi.ts`
- `src/utils/playlistApi.ts`
- focused frontend tests around `sankalpa`, `custom play`, and playlist sync behavior
- backend delete reconciliation behavior under:
  - `backend/src/main/java/com/meditation/backend/customplay/`
  - `backend/src/main/java/com/meditation/backend/playlist/`

## UX behavior and validations
- Failed or stale `sankalpa` replay should keep truthful pending or warning state instead of silently resetting.
- If a queued delete loses to a newer backend record, the user should see clear warning copy explaining that the delete was not applied.
- The restored backend-backed record should be visible again immediately instead of only after a later hydration surprise.
- Keep banners calm and localized; do not introduce new dashboard-style sync UI.

## Data, state, and API model
- Narrow `sankalpa` hydration triggers to the queue information that actually affects displayed overlay state.
- Avoid re-enqueueing goals that are already present in the `sankalpa` queue.
- Return explicit stale-delete outcomes from backend delete flows for mutable records so the frontend can restore the winning record cleanly.

## Risks and tradeoffs
- Returning richer delete outcomes adds contract complexity, but it prevents a more confusing user-visible resurrection later.
- `sankalpa` queue remediation must avoid reintroducing the prompt 02 race conditions that were already stabilized in `TimerContext`.

## Milestones
1. Refine `sankalpa` queue hydration and helper logic.
2. Add explicit stale-delete outcomes for `custom play` and playlist delete flows.
3. Add focused tests for the new behaviors.
4. Run verification and update prompt 05 docs.

## Verification plan
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## Decision log
- Remediate only the important review findings in this prompt.
- Prefer explicit stale-delete resolution over silent no-op delete success.
- Keep `sankalpa` remediation in frontend queue orchestration rather than redesigning the backend `sankalpa` contract.

## Progress log
- 2026-03-27: Reviewed prompt 05 scope and narrowed remediation to `sankalpa` queue churn and stale-delete conflict visibility.

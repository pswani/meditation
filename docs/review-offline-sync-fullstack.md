# Review: Offline Sync Full-Stack

## Scope reviewed
- UX and usability of offline and pending-sync behavior
- Frontend queue and hydration logic
- Backend reconciliation behavior on existing REST routes
- Performance and hygiene risks introduced by Milestone D prompts 01-03

## Critical issues
- None identified in this review pass.

## Important issues
- `sankalpa` queue replay currently re-fetches and re-enqueues on every queue mutation, which can reset failed entries back to pending and create unnecessary `/api/sankalpas` traffic.
  - Affected files:
    - `src/features/sankalpa/useSankalpaProgress.ts`
  - Why it matters:
    - the load effect depends on the full `queue`
    - when the backend list still does not contain a locally cached goal, the effect enqueues that goal again without checking whether it is already queued or failed
    - this can hide failure state, churn `queuedAt`, and trigger extra remote reloads during the same reconciliation cycle
- Stale queued deletes currently resolve as silent success, so a deleted `custom play` or playlist can later reappear without an explicit conflict message.
  - Affected files:
    - `backend/src/main/java/com/meditation/backend/customplay/CustomPlayService.java`
    - `backend/src/main/java/com/meditation/backend/playlist/PlaylistService.java`
    - `src/features/timer/TimerContext.tsx`
  - Why it matters:
    - the backend treats stale deletes as no-ops and still returns success semantics
    - the frontend removes the queue entry and clears sync error state on that success path
    - a newer backend-backed record can therefore look fully deleted locally until the next hydration brings it back, with no dedicated explanation of why it returned

## Nice-to-have issues
- Stale-write protection depends entirely on client-supplied queued timestamps, so meaningful device clock skew could misclassify a legitimate latest write as stale.
  - Affected files:
    - `backend/src/main/java/com/meditation/backend/sync/SyncRequestSupport.java`
  - Why it matters:
    - the current single-user local-development model keeps the risk bounded
    - but the policy is still vulnerable to skewed browser clocks because no server receipt or monotonic version is stored
- `session log` reconciliation currently uses `createdAt` as its stale-retry guard, which is sufficient for the current append-style flow but would not safely cover a future same-id update workflow.
  - Affected files:
    - `backend/src/main/java/com/meditation/backend/sessionlog/SessionLogService.java`
  - Why it matters:
    - retries of the current create-once `session log` flow are safe
    - but if a later slice introduces same-id edits, the current stale-write guard would be too weak to prevent an older retry from replacing newer data

## Recommended next prompt
- `prompts/milestone-d-offline-sync-fullstack/05-remediate-offline-sync-fullstack.md`

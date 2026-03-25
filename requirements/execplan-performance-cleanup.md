# ExecPlan: Performance Cleanup

## 1. Objective
Clean up a small set of obvious front-end inefficiencies in the meditation app without changing product behavior or introducing speculative optimizations.

## 2. Why
The app now has production-readiness passes for testing and accessibility, so the next high-value step is to remove a few wasteful patterns that add avoidable work:
- persistence effects rewrite local storage on initial hydration even when nothing changed
- playlist persistence fires on mount even when the stored payload is already current
- sankalpa state is loaded separately in multiple screens, which duplicates storage reads and leaves Home with a stale snapshot during the same app session

Addressing these issues keeps the codebase calmer and more predictable while improving responsiveness in real usage.

## 3. Scope
Included:
- dedupe initial persistence writes in shared app state
- avoid no-op persistence when serialized payloads are unchanged
- centralize sankalpa state ownership so Home and Sankalpa use one in-memory source of truth
- focused tests for the cleanup behavior

Excluded:
- broad context splitting or state-management refactors
- speculative memoization or micro-optimizations
- backend/API redesign
- major component decomposition unrelated to the identified inefficiencies

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/milestone-d-production-readiness/03-performance-cleanup.md`

## 5. Affected files and modules
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerContextObject.ts`
- `src/pages/HomePage.tsx`
- `src/pages/SankalpaPage.tsx`
- focused tests in `src/features/timer` and `src/pages`
- docs/handoff files

## 6. UX behavior
- Home should immediately reflect newly created sankalpas during the same app session.
- Existing timer, playlist, history, and sankalpa flows should behave the same for users.
- Persistence-backed flows should continue to recover and save correctly, while avoiding redundant writes when hydrated state already matches storage.

## 7. Data and state model
- TimerProvider remains the shared local-first state owner.
- Sankalpas move into provider-owned state so route-level screens consume one shared collection.
- Persistence effects compare serialized snapshots against the last persisted value to skip redundant writes while still saving meaningful changes.
- Active timer and playlist recovery must still persist corrections when the recovered state differs from the stored snapshot.

## 8. Risks
- Persistence deduping can accidentally suppress required saves if snapshot comparisons are wrong.
- Moving sankalpas into shared state changes ownership, so Home and Sankalpa tests need to cover in-session updates.
- Recovery flows for paused or expired active sessions must keep their current behavior.

## 9. Milestones
1. Define the bounded cleanup slice and confirm the highest-signal inefficiencies.
2. Update shared provider state to dedupe persistence and own sankalpas.
3. Wire Home and Sankalpa to the shared sankalpa source.
4. Add focused tests for mount deduping and in-session sankalpa updates.
5. Run verification and update decisions/handoff.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual sanity through code review of persistence/recovery behavior and Home-to-Sankalpa state updates

## 11. Decision log
- Favor snapshot-based persistence deduping over broader reducer/context refactors.
- Keep sankalpa creation and validation logic in the page for now, while moving collection ownership into shared state.

## 12. Progress log
- 2026-03-24: Reviewed prompt, required docs, and current worktree state.
- 2026-03-24: Audited shared provider persistence effects plus Home and Sankalpa state ownership.
- 2026-03-24: Identified the bounded cleanup slice: dedupe persistence writes and remove duplicated sankalpa storage reads.
- 2026-03-24: Added snapshot-based persistence deduping in `TimerProvider` and moved `sankalpa` collection ownership into shared app state.
- 2026-03-24: Updated Home and Sankalpa to consume the shared sankalpa collection instead of loading storage independently.
- 2026-03-24: Added focused tests for mount-time persistence deduping and in-session Home sankalpa updates.
- 2026-03-24: Verified with `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

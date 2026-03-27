# ExecPlan: Milestone E Hardening Remediation

## 1. Objective
Remediate the important release-hardening findings by reducing `TimerContext` change risk and aligning media setup behavior with the documented full-stack runtime.

## 2. Why
Milestone E should leave the repo easier to maintain and easier to verify. Right now the biggest avoidable risk is concentrated in one oversized frontend orchestration file, and the most confusing local setup step is the split between frontend fallback media and backend-served media roots.

## 3. Scope
Included:
- Extract duplicated queue-backed collection sync logic out of `TimerContext`
- Replace JSON-stringification-based queue signatures and collection equality checks with narrower reusable helpers
- Keep existing timer, `session log`, `custom play`, and playlist behavior stable while improving maintainability
- Align media-setup helpers and documentation so local setup prepares both the frontend fallback path and the backend-served media path clearly
- Add focused tests for the new sync helpers and updated media-root behavior
- Run the full relevant verification suite and update handoff/decision docs

Excluded:
- New product features
- Accessibility or responsive design changes beyond what is required to preserve current behavior
- New end-to-end tooling beyond what later Milestone E prompts cover
- Backend API contract changes unrelated to media-root setup clarity

## 4. Source documents
- AGENTS.md
- PLANS.md
- README.md
- docs/architecture.md
- docs/product-requirements.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/review-release-hardening.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/milestone-e-hardening-release/02-remediate-code-quality-performance-hygiene.md

## 5. Affected files and modules
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/queueCollectionSync.ts` or equivalent extracted helper module
- `src/utils/customPlay.ts`
- `src/utils/playlist.ts`
- `src/utils/sessionLog.ts`
- `src/utils/syncQueue.ts`
- `scripts/common.sh`
- `scripts/setup-media-root.sh`
- `scripts/dev-frontend.sh`
- `scripts/build-local.sh`
- `scripts/preview-local.sh`
- `README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
User-facing behavior should stay the same in this prompt:
- timer, playlist, `custom play`, and `session log` flows continue to hydrate and sync as they do today
- offline and pending-sync messaging remains calm and lightweight
- media setup becomes easier to follow because the repo prepares the frontend fallback path and backend-served path consistently

## 7. Data and state model
No domain model changes are intended. This slice should preserve:
- current queue-backed local-first sync semantics
- existing REST contracts
- current frontend fallback media path shape (`/media/custom-plays/...`)
- current backend media-root contract (`local-data/media/custom-plays` by default)

## 8. Risks
- Refactoring shared sync logic could introduce subtle regressions in hydration ordering or offline replay behavior.
- Over-generalizing the extracted helper could make it harder to follow than the duplicated logic it replaces.
- Media-root helper changes must preserve frontend-only fallback expectations while also matching backend-served defaults.

## 9. Milestones
1. Extract focused queue-backed collection helpers and domain equality helpers.
2. Refactor `TimerContext` to use those helpers for `custom play`, playlist, and `session log` sync paths.
3. Update media-root helpers/scripts so setup prepares both relevant directories and the console output stays clear.
4. Update README and handoff docs to reflect the corrected setup model.
5. Add focused tests, run verification, review the diff, and commit the remediation slice.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## 11. Decision log
- Prefer extracting the repeated queue-backed collection rules into helpers instead of attempting a much larger provider rewrite in this milestone.
- Replace broad `JSON.stringify` comparisons with reusable domain-aware equality/signature helpers to reduce unnecessary serialization work while keeping behavior explicit.
- Prepare both the frontend fallback media directory and the backend-served media directory so local setup becomes truthful without removing the existing sample-fallback path.

## 12. Progress log
- Completed: reviewed the Milestone E remediation prompt, release-hardening findings, and current runtime/docs.
- Completed: extracted shared queue-backed collection helpers and replaced JSON-stringification-based collection equality checks with domain-aware helpers.
- Completed: refactored `TimerContext` to reuse the shared collection sync helpers for `custom play`, playlist, and `session log` hydration flows.
- Completed: updated media-root helper scripts so local setup prepares both the frontend fallback path and backend-served path.
- Completed: updated README guidance and verified `npm run media:setup` reports both roots clearly.
- Completed: full verification passed (`typecheck`, `lint`, `test`, `build`, backend `test`, backend `verify`).

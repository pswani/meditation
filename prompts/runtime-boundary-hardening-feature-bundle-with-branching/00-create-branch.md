Read before doing anything else:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/production-grade-hardening-phased-plan.md`

Task:
- Create a dedicated feature branch for the runtime-boundary hardening phase.
- Default branch name: `codex/runtime-boundary-hardening-feature-bundle-with-branching`

Scope for this bundle:
- split `src/features/timer/TimerContext.tsx` into smaller runtime, sync, and persistence boundaries
- split `src/utils/storage.ts` into smaller per-domain persistence modules or a similarly clean structure
- audit and reduce avoidable synchronous browser-persistence writes without changing user-visible correctness
- add route-level code splitting for the primary application routes
- perform only the supporting `AppShell` or route-helper decomposition required to complete the runtime split cleanly

Explicitly out of scope:
- backend query redesign
- `session log` or summary pagination work
- shared reference-data consolidation
- media asset source-of-truth cleanup
- service-worker cache version redesign
- broad screen-by-screen decomposition beyond what the runtime split directly requires

Branching instructions:
1. Confirm the current branch is a safe parent for this bounded slice.
2. Create and switch to `codex/runtime-boundary-hardening-feature-bundle-with-branching`.
3. Do not change production code in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.


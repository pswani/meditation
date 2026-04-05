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
- Create a dedicated feature branch for the production reference and build cleanup phase.
- Default branch name: `codex/production-reference-cleanup-feature-bundle-with-branching`

Scope for this bundle:
- consolidate duplicated reference data and enums across frontend and backend
- remove the duplicate Vite config and keep one authoritative configuration path
- align README and related durable docs with actual config and runtime behavior
- stop tracking generated build metadata or similar accidental artifacts
- tighten one repeatable verification entrypoint so frontend, backend, and smoke checks run through one documented path

Explicitly out of scope:
- backend query redesign
- large frontend runtime decomposition
- media asset ownership cleanup
- service-worker cache version redesign
- broad UI redesign

Branching instructions:
1. Confirm the current branch is a safe parent for this bounded slice.
2. Prefer branching after the Phase 2 backend-scale bundle is merged, unless the current branch already contains the necessary prior state.
3. Create and switch to `codex/production-reference-cleanup-feature-bundle-with-branching`.
4. Do not change production code in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.


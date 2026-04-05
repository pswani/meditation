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
- Create a dedicated feature branch for the backend scale and API hardening phase.
- Default branch name: `codex/backend-scale-hardening-feature-bundle-with-branching`

Scope for this bundle:
- replace naive full-history in-memory aggregation where a repository- or query-level approach is more production-appropriate
- add practical filtering or pagination for `session log` and summary APIs
- batch playlist linked-`custom play` validation
- tighten frontend API-client timeout, cancellation, and failure behavior in ways that support the new API surface cleanly
- make only the minimal frontend wiring changes required to consume the new API behavior

Explicitly out of scope:
- large frontend runtime decomposition
- shared reference-data consolidation
- Vite/config cleanup
- media asset source-of-truth cleanup
- service-worker cache version redesign
- broad screen redesign

Branching instructions:
1. Confirm the current branch is a safe parent for this bounded slice.
2. Prefer branching after the Phase 1 runtime bundle is merged, unless the current branch already contains the equivalent foundation.
3. Create and switch to `codex/backend-scale-hardening-feature-bundle-with-branching`.
4. Do not change production code in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.


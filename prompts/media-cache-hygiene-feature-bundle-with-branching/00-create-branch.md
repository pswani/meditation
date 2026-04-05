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
- Create a dedicated feature branch for the media and cache hygiene phase.
- Default branch name: `codex/media-cache-hygiene-feature-bundle-with-branching`

Scope for this bundle:
- audit and clean up timer sound and media asset source-of-truth responsibilities across bundled assets, public assets, scripts, and runtime metadata
- replace hand-managed offline cache version strings with a build-derived or artifact-derived strategy
- update the related runtime, script, and documentation surfaces so they agree on the same asset and cache model

Explicitly out of scope:
- browser upload or import workflows
- large frontend runtime decomposition
- backend query redesign
- shared reference-data consolidation outside what is strictly required for asset ownership
- broad UI redesign

Branching instructions:
1. Confirm the current branch is a safe parent for this bounded slice.
2. Prefer branching after the Phase 3 production-reference bundle is merged, unless the current branch already contains the necessary prior state.
3. Create and switch to `codex/media-cache-hygiene-feature-bundle-with-branching`.
4. Do not change production code in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.


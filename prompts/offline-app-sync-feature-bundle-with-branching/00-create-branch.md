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

Task:
- Create a dedicated feature branch for a bounded offline-availability and backend-reconciliation slice.
- Default branch name: `codex/offline-app-sync-feature-bundle-with-branching`

Scope for this bundle:
- Make the app load and remain useful when the browser is offline or the backend cannot be reached.
- Preserve the current local-first write model and replay queued changes once the backend becomes reachable again.
- Add explicit app-shell and sync-state behavior so offline/degraded use feels calm and trustworthy.

Explicitly out of scope:
- adding a second `/sync/*` backend API surface
- redesigning the major screen structure or navigation model
- replacing the current H2 or REST architecture
- building browser upload/import for media files
- pre-caching the entire managed media library without a bounded policy
- broad refactors unrelated to offline availability and reconciliation

Branching instructions:
1. Confirm the current branch is a safe parent for this bounded slice.
2. Create and switch to `codex/offline-app-sync-feature-bundle-with-branching`.
3. Do not change production code in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.

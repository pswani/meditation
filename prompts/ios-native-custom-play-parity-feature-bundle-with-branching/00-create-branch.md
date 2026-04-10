Read before doing anything else:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-parity-gap-phased-plan.md`
- `docs/ios-native/README.md`

Task:
- Create a dedicated feature branch for the native iOS `custom play` parity slice.
- Default branch name: `codex/ios-native-custom-play-parity-feature-bundle-with-branching`

Scope for this bundle:
- align native `custom play` modeling and UX with the richer web surface
- add missing `custom play` metadata and actions that are already present in the HTML front end

Explicitly out of scope:
- full backend sync
- broad History or summary rework
- Home parity work outside what is strictly needed for `custom play` reuse
- unrelated large refactors

Branching instructions:
1. Confirm the prior parity slices are merged or otherwise safely available as the parent if they were executed first.
2. Create and switch to `codex/ios-native-custom-play-parity-feature-bundle-with-branching`.
3. Do not change unrelated web or backend behavior in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.

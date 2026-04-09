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
- `prompts/ios-native-app-phased-plan.md`
- `docs/ios-native/README.md`

Task:
- Create a dedicated feature branch for the native iOS `custom play` and playlist milestone.
- Default branch name: `codex/ios-native-custom-play-playlist-feature-bundle-with-branching`

Scope for this bundle:
- add `custom play` creation and playback
- add playlist editing and ordered playback
- keep `session log` integration explicit for these journeys

Explicitly out of scope:
- summary
- `sankalpa`
- backend sync

Branching instructions:
1. Confirm the timer and history milestone is already merged or otherwise safely available as the parent.
2. Create and switch to `codex/ios-native-custom-play-playlist-feature-bundle-with-branching`.
3. Do not widen into unrelated web or backend refactors in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.

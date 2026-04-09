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
- Create a dedicated feature branch for the native iOS summary and `sankalpa` milestone.
- Default branch name: `codex/ios-native-summary-sankalpa-feature-bundle-with-branching`

Scope for this bundle:
- add summary views and useful Home progress context
- add `sankalpa` creation, progress, and observance tracking

Explicitly out of scope:
- backend sync

Branching instructions:
1. Confirm the earlier native iOS milestones are already merged or otherwise safely available as the parent.
2. Create and switch to `codex/ios-native-summary-sankalpa-feature-bundle-with-branching`.
3. Do not widen into unrelated web or backend refactors in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.

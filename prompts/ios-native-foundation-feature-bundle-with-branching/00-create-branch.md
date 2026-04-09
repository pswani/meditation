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
- `prompts/ios-native-app-step-by-step.md`
- `docs/ios-native/README.md`

Task:
- Create a dedicated feature branch for the native iOS foundation milestone.
- Default branch name: `codex/ios-native-foundation-feature-bundle-with-branching`

Scope for this bundle:
- create the native iOS workspace under `ios-native/`
- establish the app shell, project structure, and domain foundations
- prepare local persistence and environment configuration boundaries
- keep the app runnable in Xcode without requiring backend connectivity

Explicitly out of scope:
- timer runtime behavior
- session logging flows
- `custom play`
- playlist
- summary
- `sankalpa`
- backend sync

Branching instructions:
1. Confirm the current branch is a safe parent for this bounded slice.
2. Create and switch to `codex/ios-native-foundation-feature-bundle-with-branching`.
3. Do not change production web or backend behavior in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.

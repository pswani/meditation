Read before doing anything else:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-parity-gap-phased-plan.md`
- `docs/ios-native/README.md`

Task:
- Create a dedicated feature branch for the native iOS runtime-safety hardening slice.
- Default branch name: `codex/ios-native-runtime-safety-hardening-feature-bundle-with-branching`

Scope for this bundle:
- add explicit confirm-before-end behavior for active timer, `custom play`, and playlist runtime
- add explicit confirm-before-delete behavior for `custom play` and playlist library items
- add archived `sankalpa` delete behavior with calm confirmation

Explicitly out of scope:
- backend sync
- Home parity work
- custom media-model parity
- History or summary data-model expansion
- large architectural refactors beyond what the safety flows require

Branching instructions:
1. Confirm the current native milestone state is merged or otherwise safely available as the parent.
2. Create and switch to `codex/ios-native-runtime-safety-hardening-feature-bundle-with-branching`.
3. Do not change unrelated web or backend behavior in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.

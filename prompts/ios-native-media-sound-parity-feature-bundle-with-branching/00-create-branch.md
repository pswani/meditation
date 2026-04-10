# Create Branch: iOS Native Media And Sound Parity

Objective:
- prepare a safe feature branch for the native media and sound parity slice

Read before doing any work:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`
- `docs/ios-native/parity-review-2026-04-10.md`

Branching instructions:
1. Inspect the current branch and working tree with non-destructive git commands.
2. Use the current branch as the default parent unless repo state clearly indicates a safer parent.
3. Create and switch to `codex/ios-native-media-sound-parity-feature-bundle-with-branching`.
4. Do not revert unrelated local changes. Work around them if they are not in scope.

Planning outputs to establish up front:
- ExecPlan: `docs/execplan-ios-native-media-sound-parity-feature.md`
- Review doc: `docs/review-ios-native-media-sound-parity-feature.md`
- Test doc: `docs/test-ios-native-media-sound-parity-feature.md`

Bundle scope reminder:
- align native timer sound options and mappings with the web app
- replace placeholder media behavior for `custom play` and linked playlist items with web-aligned behavior
- update tests and durable docs needed by that work

Stop and escalate if:
- the current branch contains overlapping in-progress media work that would make a new branch unsafe
- full parity depends on a missing backend or asset contract that is not documented anywhere in-repo

When complete:
- report the parent branch, feature branch, and the exact output doc paths above
- then continue to `01-implement-ios-native-media-sound-parity.md`

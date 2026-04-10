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
- Create a dedicated feature branch for the native iOS Home parity slice.
- Default branch name: `codex/ios-native-home-parity-feature-bundle-with-branching`

Scope for this bundle:
- add actionable Home quick start
- add Home support for last-used meditation
- add favorite custom play and favorite playlist shortcuts on Home
- expand Home recent-session context while keeping the screen calm

Explicitly out of scope:
- backend sync
- custom media-model expansion
- History or summary data-model work beyond what Home rendering strictly needs
- large refactors unrelated to Home parity

Branching instructions:
1. Confirm the runtime-safety hardening slice is merged or otherwise safely available as the parent if that bundle was executed first.
2. Create and switch to `codex/ios-native-home-parity-feature-bundle-with-branching`.
3. Do not change unrelated web or backend behavior in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.

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
- Create a dedicated feature branch for the native iOS History and summary parity slice.
- Default branch name: `codex/ios-native-history-summary-parity-feature-bundle-with-branching`

Scope for this bundle:
- enrich native `session log` fidelity where the web app carries materially richer context
- improve History filtering and rendering
- add missing Goals summary range and aggregation behavior

Explicitly out of scope:
- backend sync
- Home parity work
- destructive-action hardening beyond what this slice strictly needs
- large refactors unrelated to History or summary fidelity

Branching instructions:
1. Confirm prior parity slices are merged or otherwise safely available as the parent if they were executed first.
2. Create and switch to `codex/ios-native-history-summary-parity-feature-bundle-with-branching`.
3. Do not change unrelated web or backend behavior in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.

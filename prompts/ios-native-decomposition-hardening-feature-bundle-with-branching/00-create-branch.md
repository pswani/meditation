Read before doing anything else:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-parity-gap-phased-plan.md`
- `docs/ios-native/README.md`

Task:
- Create a dedicated feature branch for the native iOS decomposition and test-hardening slice.
- Default branch name: `codex/ios-native-decomposition-hardening-feature-bundle-with-branching`

Scope for this bundle:
- decompose oversized native files and improve maintainability
- strengthen automated coverage around the highest-risk native flows

Explicitly out of scope:
- new product-surface parity work unless a narrow fix is required to safely extract code
- backend redesign unrelated to testability or decomposition

Branching instructions:
1. Confirm the earlier parity slices are merged or otherwise safely available as the parent if they were executed first.
2. Create and switch to `codex/ios-native-decomposition-hardening-feature-bundle-with-branching`.
3. Do not change unrelated web behavior in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.

Read before doing anything else:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-parity-gap-phased-plan.md`
- `docs/ios-native/README.md`

Task:
- Create a dedicated feature branch for the native iOS sync-parity slice.
- Default branch name: `codex/ios-native-sync-parity-feature-bundle-with-branching`

Scope for this bundle:
- move the native iOS app beyond local-only mode and toward parity with the web app's backend-backed, local-first behavior

Explicitly out of scope:
- unrelated web or backend feature redesign
- large non-sync refactors unless they are required to safely introduce the sync boundary

Branching instructions:
1. Confirm the earlier native parity slices are merged or otherwise safely available as the parent if they were executed first.
2. Create and switch to `codex/ios-native-sync-parity-feature-bundle-with-branching`.
3. Do not change unrelated web behavior in this step except where contracts must align explicitly.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.

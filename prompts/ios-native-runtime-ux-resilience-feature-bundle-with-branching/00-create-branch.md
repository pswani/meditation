# Create Branch: iOS Native Runtime UX And Resilience

Objective:
- prepare a safe feature branch for the runtime trust and usability slice

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
3. Create and switch to `codex/ios-native-runtime-ux-resilience-feature-bundle-with-branching`.
4. Preserve unrelated local changes.

Planning outputs to establish up front:
- ExecPlan: `docs/execplan-ios-native-runtime-ux-resilience-feature.md`
- Review doc: `docs/review-ios-native-runtime-ux-resilience-feature.md`
- Test doc: `docs/test-ios-native-runtime-ux-resilience-feature.md`

Bundle scope reminder:
- active-session recovery for timer, `custom play`, and playlist
- direct numeric entry and calmer validation for duration-style controls
- clearer local-only versus backend-unavailable UX
- more intentional timer-default editing behavior in Settings

Stop and escalate if:
- there is overlapping in-progress session-state work that would make recovery changes unsafe
- settings or sync behavior depends on undocumented product decisions that conflict with the web app

When complete:
- report the parent branch, feature branch, and the exact output doc paths above
- then continue to `01-implement-ios-native-runtime-ux-resilience.md`

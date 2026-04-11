# Create Branch: iOS Native Runtime Device Defects

Objective:
- prepare a safe feature branch for a bounded native defect-fix slice covering runtime controls, backend reachability, and audio behavior on iPhone

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
2. Use `codex/ios` as the intended parent branch unless repo state clearly indicates a safer parent.
3. Create and switch to `codex/ios-native-runtime-device-defects-feature-bundle-with-branching`.
4. Preserve unrelated local changes.

Planning outputs to establish up front:
- ExecPlan: `docs/execplan-ios-native-runtime-device-defects-feature.md`
- Review doc: `docs/review-ios-native-runtime-device-defects-feature.md`
- Test doc: `docs/test-ios-native-runtime-device-defects-feature.md`

Bundle scope reminder:
- change timer duration quick-adjust buttons from 5-minute steps to 1-minute steps
- dismiss the numeric keyboard cleanly after editing duration text input when the user taps elsewhere
- fix native backend reachability or configuration so iPhone runs can actually target the backend instead of falling back to the `base URL is configured` warning path unexpectedly
- make timer and meditation audio play even when the iPhone hardware silent switch is enabled

Stop and escalate if:
- the backend-reachability fix requires unsupported production infrastructure changes or secrets that cannot be derived safely from the repo and local machine state
- the audio fix would require an entitlement or platform behavior change that cannot be justified from the current native app requirements
- the work starts widening into build-deploy automation or a broad redesign

When complete:
- report the parent branch, feature branch, and the exact output doc paths above
- then continue to `01-implement-ios-native-runtime-device-defects.md`

# Create Branch: Runtime Boundary Decomposition

Objective:
- prepare a safe feature branch for a bounded decomposition slice covering the oversized web and iOS orchestration boundaries

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
- `prompts/expert-review-remediation-phased-plan.md`
- `docs/execplan-runtime-boundary-hardening-feature.md`
- `docs/review-runtime-boundary-hardening-feature.md`
- `docs/test-runtime-boundary-hardening-feature.md`
- `docs/execplan-ios-native-decomposition-hardening-feature.md`
- `docs/review-ios-native-decomposition-hardening-feature.md`
- `docs/test-ios-native-decomposition-hardening-feature.md`

Branching instructions:
1. Inspect the current branch and working tree with non-destructive git commands.
2. Use the current branch as the default parent unless repo state clearly indicates a safer base.
3. Create and switch to `codex/runtime-boundary-decomposition-feature-bundle-with-branching`.
4. Preserve unrelated local changes.

Planning outputs to establish up front:
- ExecPlan: `docs/execplan-runtime-boundary-decomposition-feature.md`
- Review doc: `docs/review-runtime-boundary-decomposition-feature.md`
- Test doc: `docs/test-runtime-boundary-decomposition-feature.md`

Bundle scope reminder:
- split `src/features/timer/TimerContext.tsx` into smaller runtime, persistence, sync, and presentation seams where needed
- split `ios-native/MeditationNative/App/ShellViewModel.swift` into smaller collaborators while preserving a clear shell-facing boundary
- make feature boundaries explicit and enforceable
- add focused tests and docs for the extracted seams

Stop and escalate if:
- the decomposition depends on unresolved contract or data-shape decisions that should land first in the contract-hardening bundle
- the work starts widening into unrelated UI redesign or backend feature work
- the extracted boundaries cannot stay truthful without a broader product-model rewrite

When complete:
- report the parent branch, feature branch, and the three planned doc paths above
- then continue to `01-implement-runtime-boundary-decomposition.md`

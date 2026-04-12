# Expert Review Remediation Phased Plan

This plan converts the current expert-review findings into bounded prompt bundles that can be executed one at a time without mixing repo hygiene, API-contract work, runtime decomposition, and deployment hardening into one oversized branch.

Read before running any bundle:
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

Important translation note:
- the review findings are the starting brief, not a license to blindly apply stale evidence
- several cited examples already appear partially addressed in the current repo state
- each bundle must re-verify the current worktree and narrow the implementation to the remaining gap before changing files

## Recommended Execution Order

### Bundle 1
- Bundle: `repo-hygiene-foundation-feature-bundle-with-branching`
- Goal: remove tracked generated and runtime artifacts, tighten ignore rules, and make local runtime state reproducible.
- Review items covered:
  - 2. workspace polluted with generated, built, deployed, and OS-noise content
  - 8. mutable runtime state and caches committed into the workspace
  - 13. build/config surface is ambiguous and includes generated config output
- Primary outcomes:
  - strict root ignore rules audited and tightened rather than recreated blindly
  - tracked generated/runtime artifacts removed from source control while preserving intentional fixtures and config
  - `local-data/` treated as reproducible runtime state with setup/reset flows instead of committed mutable state
  - one canonical Vitest config and no tracked build metadata or generated config output

### Bundle 2
- Bundle: `workspace-docs-toolchain-clarity-feature-bundle-with-branching`
- Goal: make the repo map, supported environments, and iOS tooling story explicit and trustworthy.
- Review items covered:
  - 12. main repo entrypoint is not a reliable map of the actual workspace
  - 14. Swift package metadata does not match the iOS reality of the repo
  - 15. supported environments and toolchain expectations are under-specified
- Primary outcomes:
  - README accurately maps the repo, removes absolute local paths, and surfaces `AGENTS.md`, `PLANS.md`, `ios-native/`, `prompts/`, `scripts/`, and `local-data/`
  - supported environments and toolchains are pinned and documented clearly
  - macOS-only operational scripts are separated clearly from general developer workflow
  - Swift package metadata and Xcode-project guidance align with the actual supported iOS workflow

### Bundle 3
- Bundle: `cross-platform-contract-hardening-feature-bundle-with-branching`
- Goal: establish one canonical sync and API contract across backend, web, and iOS.
- Review items covered:
  - 3. offline/sync behavior implemented three ways without one explicit contract
  - 7. backend, web, and iOS duplicate reference data and API assumptions without a canonical schema
  - 9. REST stale-write and error semantics are inconsistent
  - 10. transaction and concurrency discipline is uneven
- Primary outcomes:
  - one documented canonical sync contract for queued writes, stale mutations, timestamps or versions, and conflict responses
  - shared reference-data or schema source of truth for backend, web, and iOS
  - consistent stale-write HTTP semantics across controllers
  - explicit transaction and optimistic-concurrency boundaries on multi-step writes
  - cross-platform conflict and replay coverage

### Bundle 4
- Bundle: `runtime-boundary-decomposition-feature-bundle-with-branching`
- Goal: split the web and iOS orchestration magnets into smaller runtime, persistence, sync, and presentation modules.
- Review items covered:
  - 4. web and iOS each depend on a giant central orchestrator file
- Primary outcomes:
  - `TimerContext.tsx` reduced to a clear coordination boundary with extracted runtime, persistence, sync, and presentation helpers
  - `ShellViewModel.swift` reduced to a clear shell-facing boundary with extracted sync, persistence, runtime, and presentation collaborators
  - focused tests around extracted seams
  - explicit feature-boundary guidance captured in durable docs

### Bundle 5
- Bundle: `media-surface-and-ci-hardening-feature-bundle-with-branching`
- Goal: harden media serving and offline media caching while adding enforceable CI gates.
- Review items covered:
  - 5. static media exposed from a broad configurable filesystem root
  - 6. no visible CI gate enforcing build, test, or repo hygiene
  - 11. service worker uses a risky media caching strategy
- Primary outcomes:
  - backend media exposure narrowed to intended subtrees with validated configuration
  - service worker media handling avoids full-buffer range emulation for large assets and uses bounded cache policy
  - CI covers web, backend, and iOS verification
  - hygiene checks fail when generated or runtime artifacts appear in diffs

## Global Guardrails

1. Keep the bundles sequential by default because the repo-hygiene and contract bundles reduce risk for later decomposition and CI work.
2. Re-verify each cited issue against the current repo before changing code or docs. If an item is already fixed, document that and narrow the bundle scope.
3. Create an ExecPlan for each bundle before implementation and keep it current.
4. Preserve exact product terminology and the calm, minimal multi-device UX.
5. Prefer removing ambiguity with documented source-of-truth contracts rather than layering another compatibility shim on top.
6. Update durable docs whenever a bundle changes long-lived repo structure, workflow, or architecture.

## Expected Durable Artifacts

- `docs/execplan-repo-hygiene-foundation-feature.md`
- `docs/review-repo-hygiene-foundation-feature.md`
- `docs/test-repo-hygiene-foundation-feature.md`
- `docs/execplan-workspace-docs-toolchain-clarity-feature.md`
- `docs/review-workspace-docs-toolchain-clarity-feature.md`
- `docs/test-workspace-docs-toolchain-clarity-feature.md`
- `docs/execplan-cross-platform-contract-hardening-feature.md`
- `docs/review-cross-platform-contract-hardening-feature.md`
- `docs/test-cross-platform-contract-hardening-feature.md`
- `docs/execplan-runtime-boundary-decomposition-feature.md`
- `docs/review-runtime-boundary-decomposition-feature.md`
- `docs/test-runtime-boundary-decomposition-feature.md`
- `docs/execplan-media-surface-and-ci-hardening-feature.md`
- `docs/review-media-surface-and-ci-hardening-feature.md`
- `docs/test-media-surface-and-ci-hardening-feature.md`

## Suggested Runner Usage

Use the shared runner with one bundle at a time:

- `Read prompts/run-milestone-bundle.md and execute it for repo-hygiene-foundation-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for workspace-docs-toolchain-clarity-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for cross-platform-contract-hardening-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for runtime-boundary-decomposition-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for media-surface-and-ci-hardening-feature-bundle-with-branching.`

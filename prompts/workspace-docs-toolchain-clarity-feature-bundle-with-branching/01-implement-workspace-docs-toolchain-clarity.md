# Implement: Workspace Docs Toolchain Clarity

Objective:
- make onboarding, local verification, and iOS entrypoints understandable without relying on tribal knowledge or stale local-path assumptions

Primary outcomes:
1. `README.md` accurately maps the repo and surfaces the core workflow docs and subprojects.
2. Supported toolchain versions and editor or formatting expectations are explicit and machine-readable where practical.
3. General developer commands are clearly separated from macOS-only operational or deployment scripts.
4. Swift package metadata and iOS documentation align with the actual supported build and test path.

Read before implementation:
- `prompts/expert-review-remediation-phased-plan.md`
- `README.md`
- `docs/ios-native/README.md`
- `docs/mac-mini-production-runbook.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- any Node, Swift, npm, or script docs you touch

In scope:
- README repo map and getting-started clarity
- toolchain pin files such as `.nvmrc`, `.node-version`, `.tool-versions`, or `.editorconfig` if justified
- documentation that distinguishes portable developer workflows from macOS-only operator flows
- Swift package metadata cleanup and iOS workflow clarification
- focused script or package-surface cleanup needed to make the docs truthful

Explicitly out of scope:
- repo-hygiene artifact cleanup beyond what is directly required to document the repo truthfully
- large CI workflow authoring
- sync-contract redesign
- large native or web runtime refactors

Implementation guidance:
1. Re-verify the current repo state before assuming the review evidence is still fully accurate.
2. Prefer one trustworthy source of truth over duplicate docs that drift.
3. If both the Swift package and Xcode project remain intentional, say so clearly and define which one is canonical for app development versus shared-core testing.
4. Toolchain pinning should match what the repo actually verifies today, not an aspirational future stack.
5. Keep docs practical and current-state oriented.

Quality expectations:
- onboarding docs should help a new engineer find the right subproject and command quickly
- toolchain files should be minimal, conventional, and easy to maintain
- iOS metadata should not imply unsupported platforms or misleading target names

Verification expectations:
- run the relevant commands documented by the updated workflow
- validate any new toolchain files or metadata against the existing package or project setup

Documentation updates required:
- `README.md`
- `docs/ios-native/README.md` if the canonical iOS workflow is clarified there
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-workspace-docs-toolchain-clarity-feature.md`

Before handing off to review:
- summarize the updated canonical workflow for web, backend, and iOS contributors
- note any intentionally macOS-only commands or scripts that remain
- then continue to `02-review-workspace-docs-toolchain-clarity.md`

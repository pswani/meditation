# Workspace Docs Toolchain Clarity ExecPlan

Date: 2026-04-11

## Objective

Tighten the repository's contributor and iOS workflow guidance so the root docs, machine-readable toolchain metadata, and native package surface all describe the current workspace truthfully.

## Why

- The root README already maps the repo well, but it still mixed contributor verification with the macOS production install path in a few places.
- The repo had a machine-readable Node pin in `.nvmrc`, but the supported npm baseline was still only prose.
- `docs/ios-native/README.md` correctly pointed app work to Xcode, yet `ios-native/Package.swift` still looked like a broader platform contract than the repo intends.
- The bundle artifacts already present in the tree described an older hypothetical run and needed to be replaced with the real branch state.

## Scope

Included:
- contributor versus operator workflow clarity in `README.md`
- minimal machine-readable toolchain metadata in `package.json`
- native iOS workflow wording in `docs/ios-native/README.md`
- shared-core package metadata cleanup in `ios-native/Package.swift`
- durable decision and handoff updates for the clarified workflow
- refreshed bundle exec, review, and test artifacts

Excluded:
- runtime, API, or UX behavior changes
- CI authoring
- repo hygiene cleanup outside the touched workflow docs
- large native refactors beyond package metadata

## Source documents

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
- `docs/mac-mini-production-runbook.md`
- `prompts/expert-review-remediation-phased-plan.md`
- `prompts/run-milestone-bundle.md`
- `prompts/workspace-docs-toolchain-clarity-feature-bundle-with-branching/00-create-branch.md`
- `prompts/workspace-docs-toolchain-clarity-feature-bundle-with-branching/01-implement-workspace-docs-toolchain-clarity.md`

## Affected files and modules

- `README.md`
- `package.json`
- `ios-native/Package.swift`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-workspace-docs-toolchain-clarity-feature.md`
- `docs/review-workspace-docs-toolchain-clarity-feature.md`
- `docs/test-workspace-docs-toolchain-clarity-feature.md`

## UX behavior

- No user-facing app behavior changes are in scope.
- Contributor-facing guidance should become calmer and less surprising:
  - the README should distinguish portable verification from macOS-only install or release work
  - Node and npm expectations should be discoverable from both docs and package metadata
  - the native docs should clearly separate the Xcode app workflow from the shared-core Swift package workflow

## Data and state model

- `local-data/` remains ignored runtime state, not durable source.
- `package.json` `engines` is the machine-readable npm baseline alongside the existing `.nvmrc` Node pin.
- `ios-native/Package.swift` should describe the shared-core package surface without implying a separate macOS app target, while still preserving the host-side SwiftPM deployment floor the package actually needs.

## Risks

- Tightening package metadata must not break `swift test --package-path ios-native`.
- README wording must clarify the operator flow without making the contributor path harder to find.
- Session handoff updates should stay durable and concise rather than expanding the historical log.

## Milestones

1. Re-verify the actual remaining workspace-docs gaps on top of `codex/expert-review`.
2. Update the root README and package metadata to clarify the supported contributor toolchain and workflow.
3. Update the native README and Swift package metadata to clarify the canonical iOS entrypoints.
4. Refresh durable docs and bundle artifacts.
5. Run the required verification commands and record the results.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`
- `rg -n '/Users/' README.md`

## Decision log

- 2026-04-11: Use `codex/expert-review` as the parent branch because the user explicitly requested it and the working tree was clean.
- 2026-04-11: Narrow the bundle to the real remaining gaps instead of replaying already-landed README restructuring.
- 2026-04-11: Add `package.json` `engines` rather than introducing more version-manager files, because the repo already has `.nvmrc` and `.editorconfig`.
- 2026-04-11: Keep the explicit macOS deployment target in `ios-native/Package.swift` after verification showed the shared core genuinely needs that host-side floor for SwiftPM tests; rely on docs to clarify that this is not a second app target.

## Progress log

- 2026-04-11: Read the required repo docs, the milestone runner, the remediation phased plan, and the target bundle prompts.
- 2026-04-11: Confirmed `codex/expert-review` was a clean and safe parent, then created `codex/workspace-docs-toolchain-clarity-feature-bundle-with-branching`.
- 2026-04-11: Re-verified the current surfaces and narrowed the remaining work to README workflow wording, package metadata, native README wording, and durable docs refresh.
- 2026-04-11: Updated the root README to distinguish portable contributor verification from the macOS production install flow and to reference `package.json` `engines`.
- 2026-04-11: Added Node and npm `engines` to `package.json`.
- 2026-04-11: Updated the native README and verified that `ios-native/Package.swift` must keep its explicit macOS deployment target for host-side SwiftPM compatibility even though the native product remains iPhone-first.
- 2026-04-11: Updated durable decision and handoff docs and replaced the stale bundle artifacts with current branch-specific records.

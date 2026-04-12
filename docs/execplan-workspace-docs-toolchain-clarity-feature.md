# Workspace Docs Toolchain Clarity ExecPlan

Date: 2026-04-11

## Objective

Make the repository entrypoints, supported toolchains, and native iOS workflow trustworthy so a contributor can identify the right workspace, command surface, and iOS build path without relying on stale local assumptions.

## Why

- `README.md` still reads more like a status ledger than a reliable workspace map for web, backend, iOS, docs, prompts, scripts, and `local-data/`.
- The README still contains absolute local filesystem links, which makes the doc non-portable.
- The repo does not currently expose a minimal machine-readable Node or editor baseline even though the workflow depends on consistent Node and multi-language whitespace conventions.
- `docs/ios-native/README.md` correctly describes the native project shape, but it still leaves room for confusion about whether `Package.swift` or `MeditationNative.xcodeproj` is the canonical app entrypoint.
- `ios-native/Package.swift` still advertises a macOS-only platform and a `MeditationNative` target name even though the shared-core package path and test folder are named `MeditationNativeCore`.

## Scope

Included:
- update `README.md` so it is a trustworthy workspace map and onboarding entrypoint
- remove absolute local filesystem links from the README
- add minimal machine-readable toolchain or editor baseline files where they clarify the supported workflow
- clarify the canonical native iOS workflow in `docs/ios-native/README.md`
- align `ios-native/Package.swift` with the shared-core package reality
- update durable docs for decisions and current repo state

Excluded:
- repo-hygiene cleanup beyond what is directly needed for truthful docs
- large CI workflow authoring
- backend or frontend runtime refactors
- large native implementation changes beyond small metadata alignment

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
- `prompts/README.md`
- `prompts/workspace-docs-toolchain-clarity-feature-bundle-with-branching/00-create-branch.md`
- `prompts/workspace-docs-toolchain-clarity-feature-bundle-with-branching/01-implement-workspace-docs-toolchain-clarity.md`

## Affected files and modules

- `README.md`
- `docs/ios-native/README.md`
- `ios-native/Package.swift`
- `.nvmrc`
- `.editorconfig`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-workspace-docs-toolchain-clarity-feature.md`
- `docs/review-workspace-docs-toolchain-clarity-feature.md`
- `docs/test-workspace-docs-toolchain-clarity-feature.md`

## UX behavior

- No end-user product behavior changes are planned in this slice.
- Contributor-facing workflow clarity should improve:
  - the root README should clearly distinguish the web app, backend, native iOS app, docs, prompts, scripts, and ignored local runtime data
  - daily developer verification should be easy to find and separate from macOS production/operator flows
  - the native iOS docs should state plainly that Xcode is the app-development entrypoint while SwiftPM covers shared-core tests

## Data and state model

- `local-data/` remains local runtime state and should be documented as such rather than presented like durable source.
- The native shared-core package should expose metadata that matches its current folder and test layout.
- Toolchain pins should match the workflow already verified in this repo rather than inventing a stricter future baseline.

## Risks and tradeoffs

- Toolchain pins must stay minimal; adding too many files would create more maintenance churn than clarity.
- The native package metadata should remain compatible with `swift test --package-path ios-native` while clarifying that the Xcode project remains canonical for the app target.
- `requirements/session-handoff.md` currently reflects an older branch and bundle state, so updates must stay concise and durable instead of layering more historical narrative.

## Milestones

1. Re-verify the current README, iOS README, toolchain files, and Swift package metadata against the bundle brief.
2. Write the ExecPlan and confirm the narrowed scope.
3. Update `README.md` to provide a trustworthy repo map, portable links, and clear workflow separation.
4. Add minimal machine-readable toolchain or editor baseline files.
5. Update `docs/ios-native/README.md` and `ios-native/Package.swift` so the native workflow and shared-core package metadata match reality.
6. Update durable decision and handoff docs, then review and verify the result.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`

Focused checks:
- `README.md` no longer contains absolute local filesystem links
- the repo map clearly distinguishes portable developer workflow from macOS-only operator workflow
- `.nvmrc` and `.editorconfig` reflect the documented workflow
- the native README states the canonical Xcode-vs-SwiftPM split plainly
- `Package.swift` metadata aligns with the shared-core package naming and supported usage

## Decision log

- 2026-04-11: Use `codex/expert-review` as the parent because the user explicitly requested it and the repo state does not indicate a safer tracked base.
- 2026-04-11: Execute this bundle in an isolated worktree because the original workspace already had in-progress changes for another remediation bundle.
- 2026-04-11: Copy only the required prompt inputs into the isolated worktree because the requested bundle exists locally but is not yet tracked on `codex/expert-review`.
- 2026-04-11: Keep the tooling baseline minimal with `.nvmrc` and `.editorconfig` rather than adding multiple overlapping version-manager files.

## Progress log

- 2026-04-11: Read the milestone runner, the workspace-docs bundle prompts, the remediation phased plan, and the required durable docs.
- 2026-04-11: Created isolated worktree `/tmp/meditation-workspace-docs` on `codex/workspace-docs-toolchain-clarity-feature-bundle-with-branching` from `codex/expert-review`.
- 2026-04-11: Confirmed the requested prompt bundle and phased plan were not yet tracked on `codex/expert-review`, then copied just those prompt inputs from the original local workspace into the isolated worktree so the bundle could run cleanly.
- 2026-04-11: Re-verified the current gaps:
  - `README.md` still contains absolute local filesystem links
  - the root repo map does not yet surface `ios-native/`, `prompts/`, `scripts/`, or `local-data/` clearly
  - the docs still blur developer workflow with macOS production/operator workflow
  - there is no machine-readable Node/editor baseline file
  - `docs/ios-native/README.md` and `ios-native/Package.swift` still leave room for confusion between the Xcode app entrypoint and the shared-core Swift package
- 2026-04-11: Updated the root README to provide a portable workspace map, explicit toolchain baseline, and a cleaner split between contributor workflow and macOS-only operator workflow.
- 2026-04-11: Added `.nvmrc` and `.editorconfig` as the minimal machine-readable repo baseline.
- 2026-04-11: Updated `docs/ios-native/README.md`, aligned `ios-native/Package.swift` with the `MeditationNativeCore` shared package, and updated the SwiftPM core tests to import the renamed module.
- 2026-04-11: Removed the copied prompt inputs from the isolated worktree so the branch diff stays scoped to workspace docs, toolchain clarity, and native metadata.
- 2026-04-11: Verified the slice with `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `swift test --package-path ios-native`, and `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-workspace-docs CODE_SIGNING_ALLOWED=NO build`.
- 2026-04-11: The first Xcode build exposed that the app target still expects the local sample recording at `local-data/media/custom-plays/vipassana-sit-20.mp3`; documented that requirement in the native README, prepared the local media root, copied the sample recording into place, and confirmed the build then passed.

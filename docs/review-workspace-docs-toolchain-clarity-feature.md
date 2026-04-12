# Workspace Docs Toolchain Clarity Review

Date: 2026-04-11

## Findings

No remaining findings.

## Notes

- `README.md` now separates the portable contributor quality gate from the macOS production install and release path instead of steering both audiences through `./scripts/pipeline.sh release`.
- `package.json` now carries explicit `engines` for Node 20.x and npm 10+, which matches the documented workspace baseline without adding more overlapping version-manager files.
- `docs/ios-native/README.md` now states more plainly that Xcode is the canonical app-development entrypoint and that `Package.swift` models only the shared `MeditationNativeCore` surface.
- `ios-native/Package.swift` now reads correctly alongside the updated native README: the explicit macOS deployment target remains because the shared-core package tests need that host-side floor, but the docs no longer let it read like a second app target.

## Highest-priority follow-up

- The next useful onboarding follow-up remains the separate hygiene or contract bundles, not more workspace-doc wording in this slice.

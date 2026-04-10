# Implement: iOS Native Low-Risk Cleanup

Objective:
- improve native project hygiene and clarity without taking on high-risk behavioral work

Primary outcomes:
1. Clean up small Xcode or project-structure warnings where the fix is straightforward and safe.
2. Remove stale milestone wording or minor documentation drift left behind after the main bundles.
3. Make narrow code-quality improvements in touched native files when they materially improve readability or maintainability without changing behavior.

Read before implementation:
- `docs/ios-native/parity-review-2026-04-10.md`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

In scope:
- duplicate `Resources` group or similarly small Xcode project hygiene fixes if they are clearly understood
- small doc cleanup in native README or related operator docs
- minor naming, copy, comment, or structure cleanup in directly touched native files
- small focused test cleanup if needed to keep warnings or intent clear

Explicitly out of scope:
- new feature work
- media parity work
- runtime recovery work
- large refactors
- risky project-file churn that is not well understood

Implementation guidance:
1. Prefer the smallest safe fix.
2. Do not widen cleanup into opinionated refactoring.
3. If a warning is noisy but the safe fix is unclear, document it rather than guessing.
4. Keep docs aligned with the current state created by earlier bundles.

Verification expectations:
- run the smallest relevant native verification for the touched cleanup
- if an Xcode project warning is targeted, rerun the command that originally surfaced it
- keep verification proportionate to the scope

Documentation updates required:
- `requirements/decisions.md` if a durable cleanup decision is made
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-low-risk-cleanup-feature.md`

Before handing off to review:
- summarize each cleanup item and why it was considered low-risk
- then continue to `02-review-ios-native-low-risk-cleanup.md`

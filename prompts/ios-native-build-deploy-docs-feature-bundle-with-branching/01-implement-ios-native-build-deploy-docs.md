# Implement: iOS Native Build Deploy And Docs

Objective:
- make the native iPhone app easier to build, deploy, and operate without opening Xcode for routine flows

Primary outcomes:
1. Add a command-line workflow for building and deploying the app to simulator and, where practical, to a connected iPhone.
2. Document local-only mode, synced mode, backend configuration, and common troubleshooting paths clearly.
3. Refresh the iOS operator docs so they reflect the current app state rather than older milestone framing.

Read before implementation:
- `docs/ios-native/parity-review-2026-04-10.md`
- `docs/ios-native/README.md`
- `README.md`
- any existing scripts or docs you extend

In scope:
- script entry points under `scripts/` for native build, install, and launch flows
- simulator and physical-device destination discovery if practical
- clear environment-variable handling for `MEDITATION_IOS_PROFILE` and `MEDITATION_IOS_API_BASE_URL`
- consolidated `docs/ios-native/README.md` guidance
- updates to `requirements/decisions.md` and `requirements/session-handoff.md`
- feature-catalog or parity-doc updates if behavior or operator guidance changed materially

Explicitly out of scope:
- unrelated app-feature changes
- adding third-party deployment dependencies unless clearly justified
- undocumented production or App Store release workflows

Implementation guidance:
1. Prefer repo-native scripts and standard Apple command-line tooling already available on a typical Xcode machine.
2. Keep the scripts transparent, inspectable, and non-destructive.
3. Support dry, readable output and clear failure messages.
4. Document exactly what is and is not automated on a physical iPhone.
5. If fixing the duplicate `Resources` project warning is straightforward and directly in the way of the workflow, address it; otherwise document it as follow-up rather than widening the slice.

Documentation deliverables:
- a consolidated iOS README section for:
- local-only mode
- synced mode
- simulator workflow
- physical iPhone workflow
- backend URL setup
- common sync or build troubleshooting
- any script usage examples needed by a new contributor

Verification expectations:
- run the script or scripts you add with safe local arguments
- run the relevant native build command
- record limitations if device install cannot be fully exercised in the environment

Before handing off to review:
- summarize the new script entry points and the doc updates
- then continue to `02-review-ios-native-build-deploy-docs.md`

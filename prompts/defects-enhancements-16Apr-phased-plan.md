# Defects And Enhancements 16 Apr Phased Plan

This phased plan coordinates the six prompt bundles created for the 16 Apr defect and enhancement backlog.

## Parent branch

- Use `codex/defects-enhancements-16Apr` as the parent branch for every bundle in this plan.
- Create each feature branch from `codex/defects-enhancements-16Apr`, not from the current checked-out branch unless it is already that parent branch.
- Merge each completed bundle back into `codex/defects-enhancements-16Apr`.

## How to run

For each bundle below:

1. Check out `codex/defects-enhancements-16Apr`.
2. Read `prompts/run-milestone-bundle.md`.
3. Execute the named bundle in the recommended order.
4. Merge the finished bundle back into `codex/defects-enhancements-16Apr`.
5. Return to `codex/defects-enhancements-16Apr` before starting the next bundle.

## Recommended execution order

### Phase 1: Native iPhone defects that block basic use

1. `ios-native-home-practice-navigation-defects-feature-bundle-with-branching`
   - Fixes duplicate Home and Practice titles, disabled Home favorite shortcuts, missing Practice `custom play` start affordances, and broken `custom plays` back navigation.
   - Run this first because it restores the most visible core iPhone navigation and start-flow defects.

2. `ios-native-history-goals-build-branding-defects-feature-bundle-with-branching`
   - Fixes Goals title duplication, restores History manual-log access, adds the requested History meditation-type change path, repairs iPhone Xcode buildability, and renames the app display to `Meditation`.
   - Run this second because it clears the remaining high-priority native functional and build blockers without overlapping much with Phase 1 files.

3. `ios-native-lock-screen-audio-mixing-feature-bundle-with-branching`
   - Improves lock-screen ending-bell behavior and competing-audio playback behavior on iPhone.
   - Run this third because it is higher risk, more device-dependent, and benefits from the core native UI and build defects already being resolved.

### Phase 2: Web parity defect

4. `web-manual-log-open-ended-feature-bundle-with-branching`
   - Adds open-ended support to web manual logging.
   - Run this after the native defect passes so cross-platform defect momentum continues while the change stays narrowly scoped to History and session-log contracts.

### Phase 3: Feature enhancements

5. `sankalpa-threshold-frequency-goals-feature-bundle-with-branching`
   - Adds recurring threshold-based `sankalpa` goals for duration and session-count flows.
   - Run this after the defect bundles because it is the broadest product-model enhancement and can touch frontend, backend, persistence, and progress math.

6. `backend-test-h2-isolation-feature-bundle-with-branching`
   - Hardens test and verification isolation so production-like H2 data is not touched.
   - Run this last because it is cross-cutting infrastructure hardening that should validate the final repo verification path after the user-facing slices land.

## Rationale for the ordering

- Start with native iPhone defects because they contain the highest concentration of broken user-visible behavior.
- Split native UI and build defects ahead of native audio work so the audio slice can run against a more stable app baseline.
- Keep the web manual-log defect separate from the larger `sankalpa` enhancement because both may touch session-log interpretation.
- Leave the H2 isolation work until the end so it can harden the final verification workflow for the combined branch rather than forcing mid-stream test-environment churn.

## Expected branch flow

- Parent branch:
  - `codex/defects-enhancements-16Apr`
- Bundle branches:
  - `codex/ios-native-home-practice-navigation-defects-feature-bundle-with-branching`
  - `codex/ios-native-history-goals-build-branding-defects-feature-bundle-with-branching`
  - `codex/ios-native-lock-screen-audio-mixing-feature-bundle-with-branching`
  - `codex/web-manual-log-open-ended-feature-bundle-with-branching`
  - `codex/sankalpa-threshold-frequency-goals-feature-bundle-with-branching`
  - `codex/backend-test-h2-isolation-feature-bundle-with-branching`

## Notes for future execution

- If one bundle uncovers prerequisite work for a later phase, update this phased plan and `requirements/session-handoff.md` before continuing.
- Keep every bundle bounded. If a fix naturally spills across multiple phases, land the minimum safe seam in the earlier bundle and defer the remainder to the later one.

# ExecPlan: iOS Native Low-Risk Cleanup

## 1. Objective
Resolve a small native-project hygiene issue and clean up stale iOS documentation wording without changing app behavior.

## 2. Why
- Xcode currently reports a malformed-project warning because the `.pbxproj` reuses one group object id for both `MeditationNativeTests` and `Resources`.
- The native iOS README still uses older milestone-oriented framing in places where the repo now prefers current-state operator guidance.
- This bundle is intended to reduce noise and drift after the larger parity bundles, not to introduce new feature work.

## 3. Scope
Included:
- fix the duplicate `Resources` group object id in `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- refresh small stale milestone wording in `docs/ios-native/README.md`
- update durable handoff docs for the cleanup outcome

Excluded:
- new native build or deploy automation
- feature, UX, sync, or media behavior changes
- broad Xcode project reorganization
- risky project-file churn beyond the warning fix

## 4. Source documents
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
- `prompts/ios-native-low-risk-cleanup-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-low-risk-cleanup-feature-bundle-with-branching/01-implement-ios-native-low-risk-cleanup.md`

## 5. Affected files and modules
- `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-ios-native-low-risk-cleanup-feature.md`
- `docs/test-ios-native-low-risk-cleanup-feature.md`

## 6. UX behavior
- No user-facing runtime behavior should change.
- Operator docs should describe the current native app state directly instead of referring to milestone sequencing as if it were still the primary operating model.

## 7. Data and state model
- No domain, persistence, or API contracts should change.
- The `.pbxproj` fix should only replace the duplicate `Resources` group object id with a unique one and update the corresponding parent-group reference.

## 8. Risks
- Editing `.pbxproj` files is easy to get wrong if the change is larger than intended.
- Over-cleaning the README could accidentally remove still-useful operator detail.
- Session handoff should reflect the durable post-merge state rather than temporary feature-branch state.

## 9. Milestones
1. Confirm the exact malformed-project warning source and choose the smallest safe project-file fix.
2. Refresh stale milestone wording in the native README while preserving current setup and verification guidance.
3. Update durable docs, then run proportionate native verification and capture results.

## 10. Verification
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`
- confirm the duplicate `Resources` warning no longer appears in the targeted build output
- confirm README cleanup matches the current repo state

## 11. Decision log
- 2026-04-10: Keep this cleanup bundle limited to one clearly understood Xcode warning plus small iOS documentation drift instead of widening into the separate build-and-deploy-docs bundle.
- 2026-04-10: Treat the duplicate `Resources` group object id as safe to fix because the warning points to malformed project structure rather than app behavior.

## 12. Progress log
- 2026-04-10: Reviewed the required repo docs, the low-risk-cleanup prompt bundle, the native README, the parity review, and the current `.pbxproj`.
- 2026-04-10: Confirmed `codex/ios` as the requested parent branch and created `codex/ios-native-low-risk-cleanup-feature-bundle-with-branching`.
- 2026-04-10: Identified the malformed-project warning source as a duplicate PBX group object id reused by `MeditationNativeTests` and `Resources`.
- 2026-04-10: Replaced the duplicate `Resources` group object id with a unique value and refreshed stale milestone-oriented wording in `docs/ios-native/README.md` so the operator guidance reads as current-state documentation.
- 2026-04-10: Added a durable documentation note in `requirements/decisions.md` to keep the native iOS README current-state oriented after the milestone bundle sequence lands.
- 2026-04-10: Verification passed with:
  - `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -showBuildSettings`
  - `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-low-risk-cleanup CODE_SIGNING_ALLOWED=NO build`
- 2026-04-10: The targeted malformed `Resources` warning no longer appeared in the `xcodebuild -showBuildSettings` output after the project-file fix.
- 2026-04-10: Review found no remaining in-scope issues, and `requirements/session-handoff.md` was refreshed to record the cleanup outcome in the durable native-track state.

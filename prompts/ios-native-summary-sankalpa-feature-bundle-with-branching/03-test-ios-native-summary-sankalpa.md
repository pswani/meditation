Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-summary-sankalpa-feature.md`

Goal:
- Verify the native iOS summary and `sankalpa` milestone thoroughly without widening scope.

Required automated verification:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Required focused checks:
1. Confirm Home surfaces progress without clutter.
2. Confirm summaries render meaningful totals and filters for milestone scope.
3. Confirm duration, session-count, and `observance-based` `sankalpa` validation rules are enforced.
4. Confirm observance tracking shows `Pending`, `Observed`, and `Missed` states correctly.
5. Confirm empty states stay calm and actionable on iPhone-sized screens.

Artifact requirement:
- Create or update `docs/test-ios-native-summary-sankalpa-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused check.
- Call out any residual real-device or longitudinal-progress risk that still needs manual validation.

Read before implementation:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-app-phased-plan.md`
- `docs/ios-native/README.md`

Implementation objective:
- Complete the native iPhone product loop with summaries, Home progress context, and disciplined `sankalpa` support.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-ios-native-summary-sankalpa-feature.md` before making substantial code changes.

Required behavior:
1. Implement summary views using local `session log` history:
   - overall summary
   - summary by meditation type
   - summary by source when practical
2. Improve Home so it surfaces useful progress without becoming a dashboard-heavy screen.
3. Implement `sankalpa` creation and editing for:
   - duration-based goals
   - session-count goals
   - `observance-based` goals
4. Support `sankalpa` progress, status sections, and calm archive or restore behavior if the chosen scope reaches that far.
5. Support observance check-ins with explicit `Pending`, `Observed`, and `Missed` states.
6. Preserve the product's serious, minimal tone on iPhone screens.

Expected affected areas:
- `ios-native/`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Required tests:
- Add or update focused Swift tests for summary aggregation, goal validation, progress calculations, and observance-state derivation.
- Add UI or integration-level tests for the riskiest `sankalpa` interactions if practical.

Documentation updates:
- Update `requirements/decisions.md` for long-lived native summary or `sankalpa` decisions.
- Update `requirements/session-handoff.md` for the new repo state and recommended next bundle.
- Update `docs/ios-native/README.md` if setup, sample-data, or QA instructions changed.

Verification after implementation:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Suggested durable artifacts:
- `docs/execplan-ios-native-summary-sankalpa-feature.md`
- `docs/review-ios-native-summary-sankalpa-feature.md`
- `docs/test-ios-native-summary-sankalpa-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(ios): add summary and sankalpa flows`

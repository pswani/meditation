Read before implementation:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-parity-gap-phased-plan.md`
- `docs/ios-native/README.md`

Implementation objective:
- Bring native History and Goals summary behavior materially closer to the HTML front end by enriching `session log` context, filters, and reflective summary options.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-ios-native-history-summary-parity-feature.md` before making substantial code changes.

Required behavior:
1. Expand native `session log` modeling where needed so the app can represent richer context such as:
   - playlist run identity or grouping context
   - playlist item position or related item context
   - `custom play` identity or recording-label context
2. Improve History so it can support missing parity behaviors such as:
   - status filtering
   - grouped playlist-run context where practical
   - clearer start-to-end time presentation where practical
3. Expand Goals summary to cover missing parity behavior such as:
   - custom date range support
   - by-time-of-day aggregation
   - clearer handling of empty or invalid ranges
4. Keep the resulting iPhone UI calm and avoid turning History or Goals into dense dashboards.
5. Update native data migration or normalization paths carefully if stored snapshot schema changes are introduced.

Expected affected areas:
- `ios-native/Sources/MeditationNativeCore/`
- `ios-native/MeditationNative/Features/History/`
- `ios-native/MeditationNative/Features/Goals/`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Required tests:
- Add or update focused Swift tests for `session log` derivation, filters, grouping helpers, summary range logic, and time-of-day aggregation.
- Add UI coverage for the highest-risk History or Goals summary flows if practical.

Documentation updates:
- Update `requirements/decisions.md` for any long-lived native `session log` schema or summary-range decisions.
- Update `requirements/session-handoff.md` for the new repo state and recommended next bundle.
- Update `docs/ios-native/README.md` if migration or verification guidance changed.

Verification after implementation:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Suggested durable artifacts:
- `docs/execplan-ios-native-history-summary-parity-feature.md`
- `docs/review-ios-native-history-summary-parity-feature.md`
- `docs/test-ios-native-history-summary-parity-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(ios): enrich history and summary parity`

Deliverables before moving on:
- coherent ExecPlan
- richer native History and summary behavior
- updated docs
- verification results

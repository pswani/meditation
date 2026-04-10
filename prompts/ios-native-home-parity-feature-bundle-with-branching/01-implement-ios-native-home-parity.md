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
- Bring the native iOS Home screen closer to the web Home surface so it supports fast, trustworthy return-to-practice behavior on iPhone.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-ios-native-home-parity-feature.md` before making substantial code changes.

Required behavior:
1. Add actionable quick start behavior from Home.
2. Add a Home shortcut for the last used meditation, supporting:
   - timer
   - `custom play`
   - playlist
3. Add favorite custom play shortcuts on Home.
4. Add favorite playlist shortcuts on Home.
5. Expand recent-session context beyond a single latest-row view if that is needed for parity.
6. Keep Home calm, readable, and iPhone-appropriate rather than turning it into a dashboard.
7. Reuse existing native runtime and navigation flows instead of duplicating logic.

Expected affected areas:
- `ios-native/MeditationNative/Features/Home/`
- `ios-native/MeditationNative/App/`
- `ios-native/Sources/MeditationNativeCore/`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Required tests:
- Add or update focused Swift tests for last-used or favorite selection logic if new model helpers are added.
- Add UI coverage for the highest-risk Home shortcut flows if practical.

Documentation updates:
- Update `requirements/decisions.md` for long-lived Home-state or shortcut-model decisions.
- Update `requirements/session-handoff.md` for the new repo state and recommended next bundle.
- Update `docs/ios-native/README.md` if Home verification guidance changed.

Verification after implementation:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Suggested durable artifacts:
- `docs/execplan-ios-native-home-parity-feature.md`
- `docs/review-ios-native-home-parity-feature.md`
- `docs/test-ios-native-home-parity-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(ios): add home parity shortcuts`

Deliverables before moving on:
- coherent ExecPlan
- working Home quick-start and shortcut flows
- updated docs
- verification results

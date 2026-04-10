Read before implementation:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-parity-gap-phased-plan.md`
- `docs/ios-native/README.md`

Implementation objective:
- Reduce native maintenance risk by decomposing oversized files and expanding automated coverage around the highest-risk native behavior.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-ios-native-decomposition-hardening-feature.md` before making substantial code changes.

Required behavior:
1. Break up oversized native files such as:
   - `ios-native/MeditationNative/App/ShellViewModel.swift`
   - `ios-native/MeditationNative/Features/Practice/PracticeView.swift`
   where practical and without changing the product surface unintentionally.
2. Move logic into smaller helpers, feature-local models, or view subcomponents while keeping boundaries explicit.
3. Add or improve tests so the highest-risk native flows have better than smoke-only coverage.
4. Keep behavior stable; this slice is about maintainability and verification confidence, not widening scope.

Expected affected areas:
- `ios-native/MeditationNative/`
- `ios-native/Sources/MeditationNativeCore/`
- `ios-native/Tests/MeditationNativeCoreTests/`
- `ios-native/MeditationNativeUITests/`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Required tests:
- Strengthen unit coverage for extracted logic.
- Strengthen UI coverage for at least the most failure-prone native flows.

Documentation updates:
- Update `requirements/decisions.md` for any long-lived native organization decisions.
- Update `requirements/session-handoff.md` for the new repo state and recommended next bundle or completion state.
- Update `docs/ios-native/README.md` only if setup or verification workflow changes.

Verification after implementation:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Suggested durable artifacts:
- `docs/execplan-ios-native-decomposition-hardening-feature.md`
- `docs/review-ios-native-decomposition-hardening-feature.md`
- `docs/test-ios-native-decomposition-hardening-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `refactor(ios): decompose native runtime surfaces`

Deliverables before moving on:
- coherent ExecPlan
- smaller, clearer native boundaries
- stronger automated coverage
- updated docs
- verification results

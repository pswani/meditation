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
- Close the highest-value `custom play` gaps between the native iOS app and the HTML front end while staying local-first until the sync bundle intentionally widens scope.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-ios-native-custom-play-parity-feature.md` before making substantial code changes.

Required behavior:
1. Extend native `custom play` modeling as needed to support web-parity concepts such as:
   - optional start sound
   - optional end sound
   - recording label or session note
   - a link-aware media identifier seam suitable for later sync
2. Add a native `Apply To Timer` flow similar to the web app.
3. Improve native `custom play` editor and collection UI so the richer metadata is visible and editable.
4. Keep current local playback workable, even if richer media selection still uses local placeholder assets before sync.
5. Keep playlist-linked `custom play` items compatible with the richer `custom play` model where needed.

Expected affected areas:
- `ios-native/MeditationNative/Features/Practice/`
- `ios-native/Sources/MeditationNativeCore/`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Required tests:
- Add or update focused Swift tests for `custom play` validation, draft conversion, and runtime or logging changes.
- Add UI coverage for the highest-risk editor or `Apply To Timer` flow if practical.

Documentation updates:
- Update `requirements/decisions.md` for long-lived native `custom play` data-model or placeholder-media decisions.
- Update `requirements/session-handoff.md` for the new repo state and recommended next bundle.
- Update `docs/ios-native/README.md` if native `custom play` setup or verification guidance changed.

Verification after implementation:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Suggested durable artifacts:
- `docs/execplan-ios-native-custom-play-parity-feature.md`
- `docs/review-ios-native-custom-play-parity-feature.md`
- `docs/test-ios-native-custom-play-parity-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(ios): expand custom play parity`

Deliverables before moving on:
- coherent ExecPlan
- richer native `custom play` model and UI
- updated docs
- verification results

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
- Make destructive and end-session actions in the native iOS app calm, explicit, and trust-preserving so the runtime UX matches the web app's safety level more closely.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-ios-native-runtime-safety-hardening-feature.md` before making substantial code changes.

Required behavior:
1. Add confirm-before-end flows for:
   - active fixed-duration timer early end
   - active open-ended timer end
   - active `custom play` end
   - active playlist end
2. Add confirm-before-delete flows for:
   - saved `custom play` entries
   - saved playlists
3. Add archived `sankalpa` delete support with calm confirmation copy.
4. Keep confirmation copy concise, serious, and aligned with the existing meditation UX.
5. Preserve current local-first runtime behavior and do not widen into backend sync.

Expected affected areas:
- `ios-native/MeditationNative/`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Required tests:
- Add or update focused Swift tests for any new destructive-action state handling.
- Add UI coverage for the highest-risk confirm flows if practical.

Documentation updates:
- Update `requirements/decisions.md` for any long-lived UX or state decisions around confirmations or archived delete behavior.
- Update `requirements/session-handoff.md` for the new repo state and recommended next bundle.
- Update `docs/ios-native/README.md` if manual QA expectations changed.

Verification after implementation:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Suggested durable artifacts:
- `docs/execplan-ios-native-runtime-safety-hardening-feature.md`
- `docs/review-ios-native-runtime-safety-hardening-feature.md`
- `docs/test-ios-native-runtime-safety-hardening-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `fix(ios): add native runtime safety confirmations`

Deliverables before moving on:
- coherent ExecPlan
- working confirm-before-end and confirm-before-delete flows
- archived `sankalpa` delete support
- updated docs
- verification results

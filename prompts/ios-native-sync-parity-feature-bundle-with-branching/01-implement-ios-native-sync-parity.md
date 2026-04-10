Read before implementation:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-parity-gap-phased-plan.md`
- `docs/ios-native/README.md`

Implementation objective:
- Introduce backend-backed, local-first sync behavior in the native iOS app so it can move toward parity with the web app's existing persistence and connectivity experience.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-ios-native-sync-parity-feature.md` before making substantial code changes.

Required behavior:
1. Add an explicit native API boundary aligned with the existing backend contracts where practical.
2. Introduce backend-backed reads and writes for the implemented native domains as appropriate:
   - timer settings
   - `session log`
   - `custom play`
   - playlist
   - `sankalpa`
   - summary reads
3. Preserve a local-first experience with queued or deferred writes when backend connectivity is unavailable.
4. Add calm connectivity and pending-sync messaging similar in spirit to the web app.
5. Keep the environment configuration seam explicit and document simulator versus physical-device base-URL rules.
6. Avoid silently losing local changes during reconciliation.

Expected affected areas:
- `ios-native/MeditationNative/`
- `ios-native/Sources/MeditationNativeCore/`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- any backend contract docs only if they must change intentionally

Required tests:
- Add or update focused Swift tests for API-boundary mapping, queue or reconciliation logic, and fallback behavior.
- Add UI or integration coverage for the highest-risk offline or backend-unreachable states if practical.

Documentation updates:
- Update `requirements/decisions.md` for long-lived native sync, queue, and conflict-handling decisions.
- Update `requirements/session-handoff.md` for the new repo state and recommended next bundle.
- Update `docs/ios-native/README.md` for base-URL setup, local-network rules, and verification workflow.

Verification after implementation:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- relevant local backend verification commands for this repo if native sync is wired to them

Suggested durable artifacts:
- `docs/execplan-ios-native-sync-parity-feature.md`
- `docs/review-ios-native-sync-parity-feature.md`
- `docs/test-ios-native-sync-parity-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(ios): add local-first sync parity`

Deliverables before moving on:
- coherent ExecPlan
- working native backend boundary with local-first fallback
- updated docs
- verification results

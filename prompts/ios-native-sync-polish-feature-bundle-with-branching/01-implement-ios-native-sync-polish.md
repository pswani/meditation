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
- Connect the native iPhone app to the existing backend intentionally, then harden the app for repeatable real-device use and release preparation.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-ios-native-sync-polish-feature.md` before making substantial code changes.

Required behavior:
1. Add an environment-driven API base URL strategy suitable for simulator and physical iPhone debugging.
2. Integrate backend sync only where the native app already has stable local behavior.
3. Reuse the existing backend REST surfaces where practical instead of inventing unrelated contracts.
4. Keep local-first behavior and explicit offline guidance even after sync is added.
5. Handle conflict or stale-write scenarios in a documented, trust-preserving way.
6. Improve Settings or diagnostics only as needed to support sync clarity, device testing, and release-readiness.
7. Update signing, local-network, and Xcode run instructions so a human can repeat the setup confidently.

Expected affected areas:
- `ios-native/`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- any iOS-native API or QA docs added during implementation

Required tests:
- Add or update focused Swift tests for API decoding, sync reconciliation, and offline fallback behavior.
- Add targeted integration or UI tests for the riskiest sync flows if practical.

Documentation updates:
- Update `requirements/decisions.md` for long-lived native sync and release-readiness decisions.
- Update `requirements/session-handoff.md` for the new repo state and what remains after the iOS milestone set.
- Update `docs/ios-native/README.md` so Xcode, signing, and backend-connection guidance match reality.

Verification after implementation:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- run any relevant local backend checks required by the chosen sync scope

Suggested durable artifacts:
- `docs/execplan-ios-native-sync-polish-feature.md`
- `docs/review-ios-native-sync-polish-feature.md`
- `docs/test-ios-native-sync-polish-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(ios): add backend sync and release polish`

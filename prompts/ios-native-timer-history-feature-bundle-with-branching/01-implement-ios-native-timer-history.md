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
- Deliver the first complete native iPhone meditation journey: configure a meditation, run it, and see the resulting `session log` in History.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-ios-native-timer-history-feature.md` before making substantial code changes.

Required behavior:
1. Implement timer setup for:
   - fixed-duration mode
   - open-ended mode
   - meditation type selection
   - optional start sound
   - optional end sound
   - optional interval sounds
2. Enforce timer validation:
   - duration greater than 0 for fixed sessions
   - meditation type required
   - interval values must fit within the session
3. Implement an active timer runtime with:
   - countdown or elapsed display
   - pause
   - resume
   - early end or manual end
4. Add iPhone-appropriate notification and foreground or background completion behavior where practical.
5. Create `session log` records automatically from timer outcomes and support manual log entry.
6. Implement a History screen that clearly shows recent logs, source badges, and key filters.
7. Add Settings support for timer defaults and notification capability or permission messaging if that is part of the chosen native design.
8. Keep everything local-first on device with no backend dependency.

Expected affected areas:
- `ios-native/`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Required tests:
- Add or update focused Swift tests for timer math, validation, runtime state transitions, and `session log` creation.
- Add UI or integration-level tests for the highest-risk flow if practical.

Documentation updates:
- Update `requirements/decisions.md` for long-lived native timer or notification decisions.
- Update `requirements/session-handoff.md` for the new repo state and recommended next bundle.
- Update `docs/ios-native/README.md` if setup, permissions, or simulator instructions changed.

Verification after implementation:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- run existing repo frontend or backend verification only if shared web or backend code changed

Suggested durable artifacts:
- `docs/execplan-ios-native-timer-history-feature.md`
- `docs/review-ios-native-timer-history-feature.md`
- `docs/test-ios-native-timer-history-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(ios): add timer and history flow`

Deliverables before moving on:
- coherent ExecPlan
- working timer and history flow
- updated docs
- verification results

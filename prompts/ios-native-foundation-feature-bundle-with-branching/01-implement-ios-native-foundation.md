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
- Create the native iPhone app foundation as a separate SwiftUI codebase that reflects this product's calm structure and local-first direction.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-ios-native-foundation-feature.md` before making substantial code changes.
2. Use that ExecPlan to record:
   - objective
   - scope and exclusions
   - affected modules
   - UX behavior and validations
   - data and state model
   - risks and tradeoffs
   - milestones
   - verification plan
   - decision log
   - progress log

Required behavior:
1. Create the iOS project under `ios-native/` with a SwiftUI app target and test target.
2. Keep the native app separate from the existing web app rather than wrapping the SPA inside a web view.
3. Establish a calm iPhone-first shell with these destinations:
   - Home
   - Practice
   - History
   - Goals
   - Settings
4. Create a clear module layout for the native app, such as:
   - `App`
   - `Features`
   - `Components`
   - `Domain`
   - `Data`
   - `Services`
   - `Utils`
5. Add shared domain models and reference values for:
   - meditation type
   - timer settings or draft state
   - `session log`
   - `custom play`
   - playlist
   - `sankalpa`
   - summary
6. Add local persistence foundations using SwiftData or another documented Apple-native persistence layer.
7. Add a documented environment configuration seam for future API base URLs, but do not require a backend for app launch.
8. Seed the shell with sample data where needed so the app is navigable before later milestones fill in real feature behavior.
9. Keep the visual direction calm, minimal, and intentionally suited to iPhone screens.

Expected affected areas:
- `ios-native/`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- any new iOS-specific supporting docs added during implementation

Required tests:
- Add or update focused Swift tests for domain models, sample data, and persistence helpers.
- Add a light app-launch or navigation smoke test if practical for the chosen project template.

Documentation updates:
- Update `requirements/decisions.md` for long-lived native-iOS architectural choices.
- Update `requirements/session-handoff.md` for the new repo state and recommended next bundle.
- Update `docs/ios-native/README.md` so Xcode setup instructions match the new workspace.

Verification after implementation:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- run existing repo frontend or backend verification only if shared web or backend code changed

Suggested durable artifacts:
- `docs/execplan-ios-native-foundation-feature.md`
- `docs/review-ios-native-foundation-feature.md`
- `docs/test-ios-native-foundation-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(ios): scaffold native app foundation`

Deliverables before moving on:
- coherent ExecPlan
- runnable Xcode project foundation
- updated docs
- verification results

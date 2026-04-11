# Implement: iOS Native Runtime Device Defects

Objective:
- fix a small but high-friction set of native iPhone defects affecting timer controls, keyboard behavior, backend connectivity, and sound playback

Primary outcomes:
1. Timer duration quick-adjust controls use 1-minute increments instead of 5-minute increments.
2. Editing a numeric duration text field no longer leaves the keyboard stuck onscreen after the user taps outside the field.
3. Native iPhone runs can actually reach the backend when configured, and the app no longer falls back to the `saved changes will stay on this device until a backend base URL is configured` state unexpectedly.
4. Timer cues and meditation audio play regardless of the iPhone hardware silent switch position, consistent with a serious meditation app rather than a casual ambient app.

Read before implementation:
- `docs/ios-native/parity-review-2026-04-10.md`
- `docs/ios-native/README.md`
- `docs/ux-spec.md`
- `docs/architecture.md`
- any existing native audio, environment, or settings docs you touch

In scope:
- timer duration input behavior and related quick-adjust controls
- focus and keyboard-dismiss behavior for directly edited numeric duration fields
- native backend configuration, reachability, or local-device transport fixes needed to make configured iPhone sync actually work
- ATS, local-network, or environment-configuration seams if they are the real blocker to backend access
- native audio-session configuration for timer sounds and meditation playback while muted
- focused tests for touched helpers or presentation behavior where practical
- durable docs required to explain the new behavior or configuration path

Explicitly out of scope:
- unrelated navigation or visual redesign
- new backend product features
- large build-and-deploy automation work
- broad refactors outside the touched runtime, environment, settings, and audio surfaces

Implementation guidance:
1. Treat the four user-reported defects as the authoritative scope. Fix root causes, not just surface copy.
2. Keep the duration-step change narrow. Do not silently change unrelated stepping behavior unless the same shared control makes it unavoidable and still product-correct.
3. Prefer a calm native keyboard-dismiss pattern that works across iPhone touch interaction rather than forcing the user to explicitly close the keyboard.
4. For backend reachability, distinguish clearly between:
   - no backend configured
   - backend configured but unreachable
   - backend configured and syncing successfully
5. If scheme-only environment injection is too fragile for physical-device use, introduce the smallest durable native configuration seam that makes backend setup practical and truthful.
6. For silent-mode audio, use the appropriate native audio-session behavior so meditation sounds still play intentionally when the mute switch is on.
7. Preserve calm UX copy and avoid new warning-heavy flows.

Code quality expectations:
- keep duration and focus behavior in focused, testable view or helper seams
- keep backend-environment and reachability logic explicit rather than scattering fallback decisions across the UI
- keep audio-session policy centralized and understandable

Verification expectations:
- add or update focused native tests where practical
- run relevant native build and test commands
- run manual device-oriented verification if available for:
  - 1-minute duration stepping
  - keyboard dismissal after tapping outside a numeric field
  - configured backend reachability on iPhone or a truthful fallback explanation if the environment blocks it
  - audio playback while the device silent switch is enabled

Documentation updates required:
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-runtime-device-defects-feature.md`

Before handing off to review:
- summarize the fix for each of the four defects
- note any physical-device steps still required to validate backend reachability or silent-mode audio
- then continue to `02-review-ios-native-runtime-device-defects.md`

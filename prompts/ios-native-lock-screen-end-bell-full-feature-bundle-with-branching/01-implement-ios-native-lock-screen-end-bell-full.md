# 01 Implement Native Lock-Screen End-Bell Completion

Implement the native iPhone lock-screen end-bell requirement as completely and truthfully as the platform allows.

Product goal:
- Improve fixed-timer completion sound behavior on iPhone when the screen is locked.
- Keep timer cues and `custom play` audio intentional when another app is already producing audio.
- Finish this as a complete native slice, including runtime behavior, fallback behavior, UX copy, docs, and tests.

Execution requirements:
- Keep one active ExecPlan at `docs/execplan-ios-native-lock-screen-end-bell-full-feature.md`.
- Read and align with the current native docs and repo requirements before coding.
- Keep the implementation truthful. Do not promise behavior that iOS background suspension cannot guarantee.
- Prefer the strongest reliable combination of:
  - audio-session configuration
  - timer completion bridging
  - notification fallback
  - scene-phase handling
  - duplicate-completion protection
- Keep timer correctness wall-clock based.

Key outcomes to deliver:
1. Audit the current native completion path and remaining limitation.
2. Implement the best app-driven lock-screen completion behavior the app can support safely.
3. Improve notification fallback and explain when the sound may be system-driven rather than app-driven.
4. Preserve intentional audio mixing behavior with other apps where requested.
5. Avoid duplicate end bells, duplicate completion state, and duplicate logs.
6. Update Practice and Settings copy so users understand:
   - what is guaranteed
   - what is best-effort
   - which limitations still belong to iOS

Likely files:
- `ios-native/MeditationNative/App/SystemSupport.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/App/ShellRootView.swift`
- `ios-native/MeditationNative/Features/Practice/*`
- `ios-native/MeditationNative/Features/Settings/*`
- `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- focused native tests under:
  - `ios-native/MeditationNativeTests/`
  - `ios-native/Tests/MeditationNativeCoreTests/`

Acceptance targets:
- The chosen native audio-session policy is deliberate and documented.
- Fixed-timer completion handling is stronger and more reliable on lock screen than before.
- Residual platform limitations remain explicit in code comments, docs, and UX copy where needed.
- Existing silent-switch behavior, recording playback, and competing-audio behavior do not regress.

Required follow-through:
- Add focused automated coverage for audio-session policy and completion-handling logic.
- Update `docs/ios-native/README.md`.
- Update `requirements/session-handoff.md`.
- Update `requirements/decisions.md` if the audio/runtime policy becomes a durable product or platform decision.

Do not absorb:
- Home, History, Goals, or branding defects
- unrelated web or backend changes
- broad native UX refactors outside the lock-screen completion path

When implementation is stable, continue with `02-review-ios-native-lock-screen-end-bell-full.md`.

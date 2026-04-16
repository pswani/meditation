# 01 Implement Native Lock-Screen Audio And Mixing Improvements

Implement the strongest truthful native improvement for these requests:

- the ending bell did not play when the screen was locked
- timer and `custom play` sounds should still play when another app is already playing audio

Execution requirements:
- Keep one active ExecPlan at `docs/execplan-ios-native-lock-screen-audio-mixing-feature.md`.
- Be explicit about platform constraints. If full lock-screen bell playback cannot be guaranteed without tradeoffs, document the chosen compromise instead of hiding the limitation.
- Prefer the smallest reliable combination of audio-session configuration, runtime handling, and system feedback that improves real-device trust.
- Keep the work scoped to native audio, timer completion, and any required project capability changes.

Likely files:
- `ios-native/MeditationNative/App/SystemSupport.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/App/MeditationNativeApp.swift`
- `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- focused native tests under `ios-native/MeditationNativeTests/` or `ios-native/Tests/MeditationNativeCoreTests/`

Acceptance targets:
- The native audio-session policy intentionally supports the requested competing-audio behavior, with documented options such as mixing or non-mixing chosen on purpose.
- Timer completion handling improves lock-screen reliability as far as the chosen native approach allows.
- Any residual platform limitation is called out in docs and test notes.
- Existing silent-switch support and recording playback do not regress.

Required follow-through:
- Add focused automated coverage where practical for audio-policy decisions or timer-completion state handling.
- Update `docs/ios-native/README.md` and `requirements/session-handoff.md` with the new behavior and remaining manual-device QA needs.
- Update `requirements/decisions.md` if the chosen native audio policy is a long-lived operational decision.

Do not absorb:
- Home, Practice, History, or Goals UI defects
- app renaming or Xcode build cleanup outside audio-related project settings
- web or backend feature work

Hand off to `02-review-ios-native-lock-screen-audio-mixing.md` when implementation is ready.

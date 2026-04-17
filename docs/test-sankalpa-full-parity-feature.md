# Test: Sankalpa Full Parity Feature

## Automated verification
- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run test`: pass with 47 files and 342 tests
- `npm run build`: pass
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`: pass with 63 backend tests, including `com.meditation.backend.sankalpa.SankalpaControllerTest`
- `swift test --package-path ios-native`: pass with 39 Swift Testing tests plus 9 XCTest cases in `AppSyncServiceTests`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' build`: pass

## Focused checks
- Native recurring duration-goal validation and weekly-threshold progress math: pass
- Native recurring session-count goal validation and weekly-threshold progress math: pass
- Native recurring active, completed, expired, and archived state derivation: pass
- Native backend fetch mapping for recurring `qualifyingDaysPerWeek`: pass
- Native recurring `sankalpa` upsert payload mapping and queued-header replay: pass
- Existing cumulative native `sankalpa` progress coverage: pass
- Existing observance-goal native coverage: pass
- Existing web and backend recurring `sankalpa` coverage remained green through repo-wide verification: pass

## Manual checks
- Live manual iPhone UI checks were not run during this bundle execution.
- Highest-value remaining manual QA:
  - create a recurring duration goal in native Goals and confirm the Home snapshot wording stays calm on phone-sized layouts
  - create a recurring session-count goal and confirm the week pills wrap or scroll comfortably with larger Dynamic Type settings
  - verify a non-default timezone and later-in-the-day goal creation still feel intuitive around week boundaries

## Notes
- The simulator build reported an informational Xcode line about supported platforms being empty for the scheme before continuing; the build still completed successfully.
- The simulator build also reported App Intents metadata extraction was skipped because the app has no AppIntents dependency, which is expected for this target.

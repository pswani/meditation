# iOS Feature Parity Review And Function Catalog

Date: 2026-04-10

Scope:
- Compare the native iOS app in `ios-native/` against the implemented HTML/web frontend
- Identify feature and behavior gaps in the iOS implementation
- Identify UX issues, code quality issues, and documentation or script gaps
- Answer the reported iPhone-app issues at a product and implementation level

This review is based on:
- required product and architecture docs in the repo
- code inspection of the web frontend and native iOS app
- local verification of native build and test commands run on 2026-04-10

Use this document as:
- a parity checklist between the web app and the iOS app
- a concise feature and function catalog for the current native implementation
- a prioritized review of the main iOS gaps, UX issues, and operational follow-ups

## Executive Summary

The iOS app covers a large portion of the product surface:
- Home
- timer practice
- History and manual log entry
- `custom play`
- playlist
- summary
- `sankalpa`
- basic sync messaging and optional backend connectivity

The biggest parity gaps are:
- native `custom play` and linked-playlist audio still use placeholder audio instead of the same managed media behavior as the web app
- active session recovery is missing on iOS
- timer sound options and sound mappings do not match the web app
- timer and manual-log numeric entry is less usable on iOS than on the web app
- there is no command-line build-and-deploy script for physical iPhone installation

Overall parity status:
- core product coverage: good
- media and sound parity: weak
- operational polish and iPhone deployment workflow: incomplete
- UX parity with the calmer and more flexible web flows: partial

## Feature And Function Catalog

Status legend:
- `Full`: iOS appears materially aligned with the web implementation
- `Partial`: iOS implements the main flow but differs in behavior, depth, or usability
- `Gap`: implemented on web but not implemented or not equivalent on iOS

| Feature / Function | Brief Description | Web | iOS | iOS Status | Main iOS Gap |
| --- | --- | --- | --- | --- | --- |
| Home quick start | Start practice fast from the home screen | Yes | Yes | Full | None noted |
| Start last used meditation | Resume the most recently used timer, `custom play`, or playlist shortcut | Yes | Yes | Full | None noted |
| Favorite `custom play` shortcuts | Start favorite saved `custom play` entries from Home | Yes | Yes | Full | Still depends on placeholder media behavior on iOS |
| Favorite playlist shortcuts | Start favorite playlists from Home | Yes | Yes | Full | Linked recording playback still uses placeholder media on iOS |
| Today progress | Show today totals and recent progress context | Yes | Yes | Full | None noted |
| Sankalpa snapshot on Home | Show nearest active `sankalpa` summary | Yes | Yes | Full | None noted |
| Fixed-duration timer | Run a timed meditation with a target duration | Yes | Yes | Full | iOS setup ergonomics are weaker |
| Open-ended timer | Elapsed-time meditation without a scheduled finish | Yes | Yes | Full | iOS setup ergonomics are weaker |
| Pause / resume timer | Pause and resume active timer session | Yes | Yes | Full | None noted |
| End timer early | End a fixed session early and create truthful logs | Yes | Yes | Full | None noted |
| Timer validation | Require meditation type, positive duration, valid interval configuration | Yes | Yes | Full | None noted |
| Timer start / end / interval sounds | Select timer sounds from supported sound catalog | Yes | Yes | Partial | iOS sound catalog and actual mappings do not match web |
| Timer editable duration input | Type a duration directly | Yes | No | Gap | iOS uses Stepper-only controls |
| Timer editable interval input | Type interval minutes directly | Yes | No | Gap | iOS uses Stepper-only controls |
| Timer defaults screen | Configure persisted defaults in Settings | Yes | Yes | Partial | iOS persists immediately; web supports explicit save/reset workflow |
| Completion notifications | Expose permission state and notification support | Yes | Yes | Full | Real-device validation still needed |
| `custom play` create / edit / delete | Manage saved prerecorded meditation sessions | Yes | Yes | Full | None noted at CRUD level |
| `custom play` favorite | Favorite and surface on Home | Yes | Yes | Full | None noted |
| `custom play` start / pause / resume / end | Dedicated prerecorded runtime flow | Yes | Yes | Partial | Native playback is placeholder-based rather than actual managed media |
| `custom play` media linkage | Link a saved play to specific recording metadata | Yes | Yes | Partial | iOS keeps only a seam plus placeholder playback, not equivalent media behavior |
| `custom play` duration derived from media | Duration follows linked managed media | Yes | Partial | Partial | Sync path maps backend media into placeholder media rather than real playback |
| `Apply to timer` | Copy `custom play` settings into timer defaults | Yes | Yes | Full | None noted |
| Playlist create / edit / delete | Manage playlists of timed and linked items | Yes | Yes | Full | None noted |
| Playlist reorder | Reorder playlist items | Yes | Yes | Full | None noted |
| Playlist favorite | Favorite and surface on Home | Yes | Yes | Full | None noted |
| Playlist run flow | Run items in order with current-item progress | Yes | Yes | Partial | Linked recording items still use placeholder audio behavior |
| Playlist optional small gaps | Pause briefly between items | Yes | Yes | Full | None noted |
| Playlist per-item logging | Log each item outcome explicitly | Yes | Yes | Full | None noted |
| Automatic logging | Auto-create `session log` entries from app sessions | Yes | Yes | Full | None noted |
| Manual logging | Add manual log entries for off-app meditation | Yes | Yes | Partial | iOS input ergonomics are weaker than web |
| History filters by source | Filter logs by source | Yes | Yes | Full | None noted |
| History filters by status | Filter logs by status | Yes | Yes | Full | None noted |
| History filters by meditation type | Filter logs by meditation type | Yes | Yes | Full | None noted |
| History time ranges | Show start and end range clearly | Yes | Yes | Full | None noted |
| History context labels | Show playlist and `custom play` context | Yes | Yes | Full | None noted |
| Summary overall | Show overall totals | Yes | Yes | Full | None noted |
| Summary by meditation type | Break down by meditation type | Yes | Yes | Full | None noted |
| Summary by source | Break down by source | Yes | Yes | Full | None noted |
| Summary by time of day | Break down by time-of-day bucket | Yes | Yes | Full | None noted |
| Summary custom date range | Support custom start and end range | Yes | Yes | Full | None noted |
| `Sankalpa` duration goal | Duration-based goal in X days | Yes | Yes | Full | None noted |
| `Sankalpa` session-count goal | Session-count goal in X days | Yes | Yes | Full | None noted |
| `Sankalpa` observance goal | Manual observance goal with per-date states | Yes | Yes | Full | None noted |
| `Sankalpa` meditation-type filter | Optional meditation-type filter | Yes | Yes | Full | None noted |
| `Sankalpa` time-of-day filter | Optional time-of-day filter | Yes | Yes | Full | None noted |
| `Sankalpa` archive / restore / archived delete | Preserve goal history while allowing cleanup | Yes | Yes | Full | None noted |
| Offline-first local changes | Keep local changes visible immediately | Yes | Yes | Full | None noted |
| Backend-backed sync | Sync timer, logs, `custom play`, playlist, `sankalpa`, summary when configured | Yes | Yes | Partial | Works in principle, but user messaging can be confusing and media parity is not complete |
| Active timer recovery after relaunch | Recover active timer if app is killed or relaunched | Yes | No | Gap | Active runtime is in-memory only on iOS |
| Active `custom play` recovery after relaunch | Recover active playback session | Yes | No | Gap | Active runtime is in-memory only on iOS |
| Active playlist recovery after relaunch | Recover active playlist run | Yes | No | Gap | Active runtime is in-memory only on iOS |

## Highest-Priority iOS Gaps

### 1. Managed media parity is not complete

The web app uses a managed media library for `custom play` recordings and derives runtime behavior from linked media. The iOS app still describes and uses bundled placeholder audio for `custom play` playback and playlist-linked recording playback.

Impact:
- the same `custom play` does not behave the same way on web and iPhone
- linked media on iOS is not trustworthy as a real playback contract
- users may assume they are hearing the same recording when they are not

Recommendation:
- treat this as one of the top parity blockers before calling web and iOS behavior aligned

### 2. Sound catalog and sound mapping mismatch

The web app currently supports:
- `None`
- `Temple Bell`
- `Gong`

The iOS app exposes:
- `Temple Bell`
- `Gong`
- `Wood Block`

The web app explicitly normalizes legacy `Wood Block` to `Gong`, while iOS still treats `Wood Block` as a separate active choice and maps sounds to generic system sound IDs rather than the same media assets.

Impact:
- the iPhone app can present sound choices that are not valid in the web app anymore
- the user hears different sounds than expected
- saved data can drift semantically between platforms

Recommendation:
- remove `Wood Block` as a distinct current option on iOS
- remap legacy values to the same normalized labels as the web app
- use the same actual sound assets or the same catalog contract across both platforms

### 3. No active-session recovery on iOS

The iOS app persists timer defaults, logs, `custom play`, playlists, and `sankalpas`, but not active runtime sessions.

Impact:
- a timer, `custom play`, or playlist can be lost on relaunch
- this is a meaningful trust gap compared with the web app

Recommendation:
- persist canonical active runtime snapshots for timer, `custom play`, and playlist

### 4. Timer and manual-log entry controls are less usable than web

The user-reported issue is valid. Stepper-only minute entry is noticeably worse than allowing direct text or numeric entry.

Impact:
- slower adjustments for common values
- more taps
- more frustrating on phone-sized devices

Recommendation:
- keep the stepper if desired, but add editable numeric text fields alongside it for:
  - timer duration
  - interval minutes
  - manual-log duration

## User-Reported Issues Review

### 1. Timer `+/-` buttons are not user friendly

Assessment:
- agreed

Why:
- iOS timer duration and interval entry use Stepper-only controls
- manual-log duration uses Stepper-only controls too
- the web app allows direct numeric entry

Recommended improvement:
- add editable numeric text boxes with validation
- optionally keep +/- controls for quick adjustments

Priority:
- high

### 2. Command-line script to build and deploy to iPhone without opening Xcode

Assessment:
- not currently implemented

Current state:
- the repo has no dedicated iOS build or deploy script
- `docs/ios-native/README.md` only documents raw `xcodebuild` commands

Recommended improvement:
- add a dedicated script for:
  - listing destinations
  - building for device or simulator
  - installing to a connected iPhone
  - optionally launching the app
  - injecting `MEDITATION_IOS_PROFILE` and `MEDITATION_IOS_API_BASE_URL` when needed

Priority:
- medium to high

### 3. Thorough UX and usability review of the iOS app

Top improvements:
- add direct numeric entry for duration-style fields
- reduce hidden advanced controls friction where users frequently need sounds
- make sync state and backend configuration more actionable and less ambiguous
- replace placeholder-media messaging with real media-state messaging once parity is improved
- add clearer save affordances or change review for timer defaults
- validate real-device readability and tap comfort for long lists, menus, and sheet forms
- improve manual-log speed on iPhone
- verify navigation and data density on larger iPhones, not just simulator-smoke behavior

### 4. Sounds are mapped to unknown sounds

Assessment:
- confirmed as a real parity problem

Root cause:
- native timer cues use system sound IDs rather than the same audio files as the web app
- native still exposes `Wood Block` as a first-class option while web does not

Priority:
- high

### 5. Message says local changes are waiting for a configured backend

Assessment:
- this usually means backend sync is not configured, not that connectivity is broken

What it means:
- `MEDITATION_IOS_API_BASE_URL` is not set for the running app profile
- the app is in local-only mode

When it would mean broken connectivity:
- if the API base URL were configured and the app showed `Backend unavailable` instead

Recommendation:
- improve copy so local-only mode sounds intentional, not broken
- consider a clearer message such as:
  - `This iPhone is running in local-only mode. Add a backend base URL in the run configuration to sync changes.`

## UX Review Notes

### Strengths

- destination structure matches the product well
- Home is calm and useful rather than dashboard-heavy
- `sankalpa` flow is disciplined and not gamified
- runtime safety prompts are present for end and delete actions
- summary and goals surfaces are meaningfully implemented, not placeholders

### Main UX Weaknesses

- Stepper-heavy numeric input increases friction
- placeholder-media messaging leaks implementation detail into the product experience
- timer defaults changing immediately in Settings is less intentional than the web flow
- sync messaging is informative but not always user-friendly
- `custom play` and playlist mental model is weaker on iOS because actual playback source is not trustworthy

## Code Quality And Maintenance Issues

### 1. Known malformed Xcode project warning

`xcodebuild` still reports:
- duplicate `Resources` group membership warning

Impact:
- low current risk
- worth cleaning up to avoid future project drift

### 2. Sound implementation is platform-specific and semantically inconsistent

The iOS app uses `AudioServicesPlaySystemSound` IDs for timer sounds, while the web app uses an explicit sound catalog and bundled audio files.

Impact:
- parity drift
- hard to reason about exact user-facing output

### 3. Placeholder-media architecture is still visible in user-facing product copy

This is acceptable as an intermediate milestone, but it should not be mistaken for full parity.

### 4. State mutation behavior for timer defaults is easy to change accidentally

Immediate persistence through binding is simple technically, but weaker as a user contract than the web save workflow.

### 5. Test coverage is decent but still leaves real-device gaps

The native suite has useful unit coverage and smoke UI coverage, but the most important unresolved areas still need device or concrete-simulator verification:
- sound output correctness
- real notification behavior
- background and foreground transitions
- physical-device backend connectivity

## Build Scripts, README, And Operational Docs

### What is up to date

- native README exists and broadly matches the current native project structure
- native README documents `swift test` and `xcodebuild` commands
- native build command still passes:
  - `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-review CODE_SIGNING_ALLOWED=NO build`
- shared Swift package tests still pass:
  - `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`

### What is not up to date enough

- there is no consolidated operator-focused README for the iPhone app lifecycle
- there is no script-based build and deploy workflow for physical iPhone use
- the README still uses milestone-oriented language in places instead of a simpler current-state guide
- the README does not provide a one-command way to run with backend sync on a physical iPhone

### Recommended documentation improvements

- add a consolidated iPhone-app README section for:
  - local-only mode
  - synced mode
  - simulator workflow
  - physical iPhone workflow
  - backend URL setup
  - troubleshooting common sync messages
- add a scripted build and deploy section once the script exists

## Verification Performed During This Review

Executed on 2026-04-10:

1. `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- result: passed

2. `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -showdestinations`
- result: command ran
- notable environment limitation: CoreSimulator services were unavailable in this environment
- available destinations included:
  - `My Mac`
  - `Any iOS Device`
  - `Any iOS Simulator Device`

3. `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-review CODE_SIGNING_ALLOWED=NO build`
- result: passed
- warning still present:
  - duplicate `Resources` group membership in the Xcode project

## Recommended Next Priorities

1. Fix sound parity first
- remove `Wood Block` as a current option
- normalize legacy values
- map native playback to the same actual sound assets as web

2. Replace placeholder-media playback with real managed-media parity
- `custom play`
- linked playlist items

3. Improve timer and manual-log input ergonomics
- add editable numeric text fields

4. Add active-session recovery
- timer
- `custom play`
- playlist

5. Add an iPhone build-and-deploy CLI script

6. Refresh the iOS README into a consolidated current-state operator guide

## Bottom Line

The iOS app is no longer a shell. It is a substantial native client with broad feature coverage.

However, it is not yet fully behaviorally aligned with the web frontend because the remaining gaps are concentrated in high-trust areas:
- sound correctness
- recording and media behavior
- active-session resilience
- iPhone usability polish

Those should be treated as the main parity blockers.

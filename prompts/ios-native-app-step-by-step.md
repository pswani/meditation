# Native iOS Prompt Bundle Instructions

Use these steps to execute the native iOS milestone bundles in order.

## Before You Start

1. Make sure the repo worktree is clean or that any unrelated changes are committed safely.
2. Read:
   - `prompts/ios-native-app-phased-plan.md`
   - `docs/ios-native/README.md`
3. Install the latest stable Xcode that supports your iPhone and simulator runtime.
4. Sign in to Xcode with your Apple ID if you plan to run on a physical iPhone.

## Milestone Workflow

1. Run the foundation bundle first:
   - `Read prompts/run-milestone-bundle.md and execute it for ios-native-foundation-feature-bundle-with-branching.`
2. After milestone 1 creates the project, open `ios-native/MeditationNative.xcodeproj` in Xcode.
3. In Xcode, set your Team and bundle identifier, then confirm the app launches on an iPhone simulator.
4. If you want to run on your iPhone, connect the device, trust the computer, choose the device in Xcode, and run once from Xcode so signing issues are surfaced early.
5. Run the remaining bundles in sequence:
   - `ios-native-timer-history-feature-bundle-with-branching`
   - `ios-native-custom-play-playlist-feature-bundle-with-branching`
   - `ios-native-summary-sankalpa-feature-bundle-with-branching`
   - `ios-native-sync-polish-feature-bundle-with-branching`
6. After each milestone:
   - review the generated ExecPlan, review, and test docs
   - run the Xcode build and test steps called for by that milestone
   - launch the app in simulator or on device for a quick smoke test
7. Keep milestone work merged before starting the next one unless you intentionally want stacked branches and document that choice in the next ExecPlan.

## Backend Notes

1. Do not block milestones 1 through 4 on backend connectivity.
2. When milestone 5 adds backend sync, do not point the iPhone app at `localhost` if the backend is running on your Mac.
3. For a physical iPhone talking to a backend on your Mac, use your Mac's LAN IP instead of `127.0.0.1` and keep the backend reachable on that host and port.

## Suggested Human Checkpoints

1. After milestone 1: the shell opens cleanly in Xcode and on simulator.
2. After milestone 2: a full timer session can be started, ended, and seen in History.
3. After milestone 3: `custom play` and playlist playback feel trustworthy on iPhone.
4. After milestone 4: summaries and `sankalpa` progress feel calm and readable on a phone.
5. After milestone 5: backend sync, offline behavior, and device QA notes are documented clearly enough to repeat.

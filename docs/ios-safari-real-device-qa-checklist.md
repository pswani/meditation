# iPhone Safari Real-Device QA Checklist

Date created: 2026-04-03
Applies to: iPhone Safari browser-tab timer behavior for the meditation app

## Purpose

Use this checklist as a release-trust gate whenever timer behavior changes could affect iPhone Safari lock, background, foreground, or completion signaling behavior.

This checklist is intentionally scoped to Safari running in a browser tab on iPhone. It does not claim the same behavior for:

- installed PWA mode
- non-Safari browsers on iPhone
- native wrappers

## Environment capture

Record these before running the checks:

- device model
- iOS version
- Safari version if known
- app branch or commit under test
- host URL used
- test date

## Setup

1. Open the app in Safari on the iPhone.
2. Go to `Practice`.
3. Confirm a fixed timer is selected.
4. Use a short duration such as 1 minute so lock/unlock checks are practical.
5. Ensure an end sound is selected.
6. If testing notifications, also open `Settings` in the same Safari context.

## Checks

### 1. Fixed timer completion while Safari stays foregrounded

Steps:

1. Start a fixed timer.
2. Keep Safari visible until scheduled completion.

Pass expectations:

- the session completes without duplicate completion handling
- the completion state appears once
- the configured end sound behavior matches the current browser/runtime capability
- no Safari-specific deferred-completion explanation appears for a fully foregrounded completion

### 2. Lock before scheduled completion, then unlock after the timer should have finished

Steps:

1. Start a fixed timer.
2. Lock the phone before the scheduled end time.
3. Wait until after the scheduled end time.
4. Unlock the phone and return to Safari.

Pass expectations:

- the timer finishes promptly after Safari returns to foreground
- the app does not require extra taps to notice the session is already complete
- one foreground return produces one catch-up completion
- the UI does not show duplicate completion banners or repeat the end state multiple times

### 3. Deferred-completion explanation after foreground catch-up

Steps:

1. Repeat the lock/unlock flow above.
2. Observe the completion copy shown after Safari returns.

Pass expectations:

- the completion UI explains calmly that the scheduled end was reached while Safari was in the background
- the explanation appears once for that completion
- the explanation is specific enough to build trust without sounding alarmist

### 4. Safari-specific guidance targeting

Steps:

1. Review the fixed-timer guidance in `Practice`.
2. Start a fixed timer and review the active-timer guidance.

Pass expectations:

- Safari-specific guidance is visible in the relevant iPhone Safari browser-tab flow
- the guidance matches the current product wording about background or lock-screen deferral
- the guidance stays consistent between setup and active timer surfaces

### 5. Notification permission state handling

Steps:

1. Open `Settings`.
2. Record the current notification capability and permission state.
3. If the browser offers a permission prompt path, exercise the default state carefully.
4. If possible on the device, also confirm denied and granted states.

Pass expectations:

- Settings states clearly whether notifications are available, unavailable, granted, denied, or requestable
- the permission request action only appears when Safari can actually prompt
- iPhone Safari copy stays honest that browser-tab behavior can still defer completion handling even when permission is granted

If a state cannot be exercised on the current device:

- record `warn`, not `fail`
- state exactly which permission path was unavailable to test

## Result recording

For each check, record:

- `pass` when the observed behavior matches the expectations above
- `fail` when the product behavior contradicts the expectation or creates confusing duplicate handling
- `warn` when the environment could not exercise the scenario completely

## Escalation rule

If this checklist reveals a real product bug that is larger than a tiny copy or docs correction:

1. stop changing production code in the QA bundle
2. capture the evidence in the QA report
3. open a new bounded feature or fix bundle for the product change

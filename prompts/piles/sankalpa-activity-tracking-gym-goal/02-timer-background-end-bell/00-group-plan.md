# Group Plan: Timer Background End Bell

## Scope

Fix the ending bell behavior when the timer completes while the app is not focused.

## Explicit Limits

- Web browsers may throttle or suspend background tabs, especially on iPhone Safari and lock screens.
- The implementation must not claim guaranteed playback after full browser suspension.
- Preserve the existing notification and foreground catch-up messaging model.
- Do not change Sankalpa, History, custom play, or playlist behavior except where shared timer sound helpers require safe reuse.

## Current-State Notes

The current timer code already:

- primes interval and end sounds from the Start action
- runs foreground catch-up on `visibilitychange` and `pageshow`
- attempts completion notifications only when permission is granted and the document is hidden
- plays the end sound when `lastOutcome` is processed after the active session clears

The likely defect is in the hidden/not-focused completion path, where React effects, timer ticks, browser throttling, notification timing, or audio playback policy can prevent the end cue from playing when completion is reached outside visible focus.

## Risks

- Attempting playback from a hidden page can still fail under browser policy.
- A notification plus end bell can double-signal if not coordinated.
- Tests need to simulate document visibility and playback outcomes without becoming brittle.

## Verification Gates

Use focused tests for timer sound playback, timer reducer/outcome handling, foreground catch-up, and notification behavior. Then run the group verification commands from `README.md`.

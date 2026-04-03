# 03-test-ios-safari-ux-hardening.md

## Goal
Execute verification for the iPhone Safari UX hardening slice.

## Automated checks
Run and report:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Focused behavior checks
1. Notification permission UX
- capability state shown
- permission request action behavior
- denied/default/granted states handled

2. Guidance targeting
- iPhone Safari-relevant contexts show guidance
- unrelated contexts do not show guidance

3. Deferred completion explanation
- after foreground catch-up finalization, explanatory status appears once

4. Foreground coalescing
- no duplicate completion handling when `visibilitychange` and `pageshow` both fire

## Manual iPhone Safari checklist
If device is available:
1. Start fixed timer with end sound.
2. Lock phone before completion.
3. Unlock and confirm single completion handling.
4. Confirm deferred-completion explanation appears.
5. Confirm notification behavior based on permission state.

## Report format
For every check:
- status (pass/fail/warn)
- exact command/check
- concise result

Capture environment limitations explicitly.

# 03-test-ios-safari-real-device-qa.md

## Goal
Verify the iPhone Safari real-device QA bundle.

## Artifact checks
Run and report:
- docs path exists for the new or updated QA checklist
- docs path exists for the new or updated QA result report
- `requirements/session-handoff.md` references the current QA state accurately

## Manual device checks
If device is available, run and report:
1. Start a fixed timer with end sound.
2. Lock the phone before scheduled completion.
3. Unlock and confirm single catch-up handling.
4. Confirm deferred-completion explanation appears once.
5. Check notification behavior for default, denied, and granted states where possible.

## Automated checks
Only if production code changed, also run and report:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Report format
For every check:
- status (pass/fail/warn)
- exact command/check
- concise result

Capture device availability limitations explicitly.

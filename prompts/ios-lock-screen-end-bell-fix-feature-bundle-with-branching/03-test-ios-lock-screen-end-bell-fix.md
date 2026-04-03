# 03-test-ios-lock-screen-end-bell-fix.md

## Goal
Execute full verification for the lock-screen end-bell fix slice.

## Test plan
1. Automated checks
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

2. Focused behavior verification
- Start fixed timer session with end sound enabled.
- Simulate/validate background-then-foreground catch-up behavior.
- Confirm completion status and session log are correct.
- Confirm end sound is not duplicated.

3. iPhone Safari manual validation (if device access available)
- Start timer and lock phone before completion.
- Observe behavior while locked.
- Unlock and confirm immediate, deterministic completion handling.
- Confirm expected guidance copy is visible (if implemented).

## Reporting format
For each command/check, report:
- status (pass/fail/warn)
- exact command
- short result

Include any environment limitations clearly.

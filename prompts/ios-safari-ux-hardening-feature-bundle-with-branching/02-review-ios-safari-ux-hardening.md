# 02-review-ios-safari-ux-hardening.md

## Goal
Review the iPhone Safari UX hardening slice for correctness, scope, and user trust.

## Review checklist
1. Product UX
   - Does permission UX remain calm and optional?
   - Is Safari guidance targeted (not noisy for all users)?
   - Is deferred-completion explanation clear and non-alarmist?

2. Technical correctness
   - Is foreground event coalescing robust?
   - Any duplicate completion sound/log risks?
   - Are capability checks resilient when APIs are unavailable?

3. Scope discipline
   - No unrelated refactors.
   - Changes limited to timer UX hardening and docs.

4. Tests and docs
   - Focused tests added for each load-bearing change.
   - Required docs and session handoff updated.

## Output format
Findings by severity:
- blocker
- high
- medium
- low

If clean: "No blocker/high/medium findings."

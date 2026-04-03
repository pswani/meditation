# 01-implement-ios-safari-real-device-qa.md

## Objective
Turn the remaining manual iPhone Safari timer validation into a repeatable repo artifact and record the current result when a device is available.

## In-scope outcomes
1. **Durable QA checklist**
   - Add or update a dedicated manual checklist under `docs/`.
   - Cover browser-tab behavior on iPhone Safari for:
     - fixed timer completion
     - lock/unlock foreground catch-up
     - deferred-completion explanation
     - notification permission states

2. **Current validation report**
   - If an iPhone device is available, execute the checklist and record:
     - device model if known
     - iOS version if known
     - Safari version if known
     - test date
     - pass/fail/warn outcomes
   - If a device is not available, record that limitation explicitly and leave the checklist runnable.

3. **Release-trust documentation**
   - Make the artifact easy to reuse as a release gate.
   - Keep tone practical and calm, not alarmist.

## Scope guardrails
- Prefer docs and verification artifacts only.
- Do not change production code unless a directly observed issue is tiny, clearly in scope, and necessary to keep the checklist accurate.
- If manual QA reveals a real bug that is not tiny, stop at documentation and recommend a new bounded bundle instead of broadening this one.

## Verification expectations
- If no production code changes are made, verify the docs and artifact paths only.
- If code changes are made, also run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`

## Documentation updates required
- update `requirements/session-handoff.md`
- add/update QA checklist and report artifacts under `docs/`
- update `requirements/decisions.md` only if the release process changes durably

## Commit guidance
Suggested commit message:
- `docs(qa): codify ios safari real-device timer checks`

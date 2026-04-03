# Test Report: iOS Safari UX Hardening

Date: 2026-04-03

## Automated checks
- status: pass
  command/check: `npm run typecheck`
  result: TypeScript completed with no errors.

- status: pass
  command/check: `npm run lint`
  result: ESLint completed with no reported violations.

- status: pass
  command/check: `npm run test`
  result: Vitest completed with 44 files and 293 passing tests, including the new runtime, coalescing, Settings, Practice, and Active Timer coverage.

- status: warn
  command/check: `npm run build`
  result: Production build succeeded, and the pre-existing frontend large-chunk warning is still emitted for the main JavaScript bundle.

## Focused behavior checks
- status: pass
  command/check: notification permission UX
  result: Settings now shows capability and permission state, supports the default-to-granted request flow, and handles denied and unavailable states through focused tests.

- status: pass
  command/check: guidance targeting
  result: Fixed-timer Safari guidance now appears in likely iPhone Safari browser contexts and stays hidden for unrelated default desktop-style contexts in setup and active flows.

- status: pass
  command/check: deferred completion explanation
  result: Active Timer and Practice completion messaging now explain that a fixed timer reached its scheduled end in the background when foreground catch-up finalized it.

- status: pass
  command/check: foreground coalescing
  result: Foreground catch-up now coalesces rapid `visibilitychange` and `pageshow` events, with focused tests confirming single completion handling.

## Manual iPhone Safari checklist
- status: warn
  command/check: real-device iPhone Safari lock/unlock validation
  result: Not executable in this environment; confidence comes from the focused browser-context tests plus the full frontend suite.

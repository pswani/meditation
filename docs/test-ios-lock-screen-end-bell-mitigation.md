# iOS Lock-Screen End-Bell Mitigation — Verification Report

Date: 2026-04-03
Feature branch: `fix/ios-lock-screen-end-bell`
Parent branch: `main`

## Automated checks

- ✅ `npm run typecheck`
- ✅ `npm run lint`
- ✅ `npm run test` (42 files, 277 tests)
- ✅ `npm run build`

## Focused behavior checks covered by tests

- ✅ Active timer now finalizes on foreground return by forcing a sync tick on `visibilitychange`.
- ✅ Fixed-session active page shows iPhone Safari lock-screen bell deferral guidance.
- ✅ Completion notification helper only notifies when permission is granted and document is hidden.

## Known environment limitations

- ⚠️ Manual iPhone Safari hardware verification is not executable in this environment.
- ⚠️ Existing test-suite jsdom stderr noise remains for `HTMLMediaElement.prototype.pause` in Sankalpa tests.
- ⚠️ Existing Vite chunk-size warning remains in build output.
